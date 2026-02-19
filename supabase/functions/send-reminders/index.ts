import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") || "BookMe.Bet <noreply@notifications.3bi.io>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal =
    local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${maskedLocal}@${domain}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmailWithRetry(
  payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    replyTo?: string;
    attachments?: { filename: string; content: string; content_type: string }[];
  },
  maxRetries = 3
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`Resend API error (${response.status}): ${responseText}`);
        }
        throw new Error(`Resend API error (${response.status}): ${responseText}`);
      }
      const result = JSON.parse(responseText);
      return { success: true, id: result.id };
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError || new Error("Unknown error sending email");
}

function generateReminderICS(booking: {
  id: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  eventTitle: string;
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  hostTimezone?: string;
  meetingLink?: string;
}): string {
  const toUtcIcsString = (dateStr: string, timeStr: string, timezone?: string): string => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localIso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

    let utcMs: number;
    if (timezone) {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false,
        });
        let utcGuess = new Date(localIso).getTime();
        for (let i = 0; i < 3; i++) {
          const parts = formatter.formatToParts(new Date(utcGuess));
          const p: Record<string, number> = {};
          for (const { type, value } of parts) p[type] = Number(value);
          const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
          utcGuess = new Date(localIso).getTime() - (rendered - utcGuess);
        }
        utcMs = utcGuess;
      } catch {
        utcMs = new Date(localIso).getTime();
      }
    } else {
      utcMs = new Date(localIso).getTime();
    }

    const d = new Date(utcMs);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  const startDateTime = toUtcIcsString(booking.scheduledDate, booking.startTime, booking.hostTimezone);
  const endDateTime = toUtcIcsString(booking.scheduledDate, booking.endTime, booking.hostTimezone);
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BookMe.Bet//Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:booking-${booking.id}@bookme.bet
DTSTAMP:${timestamp}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${booking.eventTitle} with ${booking.guestName}
DESCRIPTION:24-hour reminder for your upcoming meeting via BookMe.Bet.${booking.meetingLink ? `\\n\\nMeeting Link: ${booking.meetingLink}` : ""}
ORGANIZER;CN=${booking.hostName}:mailto:${booking.hostEmail}
ATTENDEE;CN=${booking.guestName};RSVP=TRUE:mailto:${booking.guestEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildReminderHtml(params: {
  recipientName: string;
  otherPartyLabel: string;
  otherPartyName: string;
  otherPartyEmail: string;
  eventTitle: string;
  formattedDate: string;
  formattedTime: string;
  timezone?: string;
  duration: number;
  meetingLink?: string;
  manageUrl?: string;
  isGuest: boolean;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">⏰ Meeting in 24 Hours</h1>
      </div>

      <p style="font-size: 16px; color: #374151;">Hi ${params.recipientName},</p>

      <p style="font-size: 16px; color: #374151;">
        This is your 24-hour reminder for your upcoming meeting ${params.isGuest ? `with <strong>${params.otherPartyName}</strong>` : `with <strong>${params.otherPartyName}</strong> (${params.otherPartyEmail})`}.
      </p>

      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #6366f1;">
        <h2 style="margin: 0 0 16px 0; color: #111827;">${params.eventTitle}</h2>
        <p style="margin: 8px 0; color: #4b5563;">
          <strong>📅 Date:</strong> ${params.formattedDate}
        </p>
        <p style="margin: 8px 0; color: #4b5563;">
          <strong>🕐 Time:</strong> ${params.formattedTime}${params.timezone ? ` <span style="color: #6b7280; font-size: 14px;">(${params.timezone})</span>` : ""}
        </p>
        <p style="margin: 8px 0; color: #4b5563;">
          <strong>⏱️ Duration:</strong> ${params.duration} minutes
        </p>
        <p style="margin: 8px 0; color: #4b5563;">
          <strong>${params.isGuest ? "👤 Host" : "👤 Guest"}:</strong> ${params.otherPartyName}
        </p>
        ${params.meetingLink ? `
        <p style="margin: 16px 0 8px 0; color: #4b5563;">
          <strong>🔗 Meeting Link:</strong>
        </p>
        <a href="${params.meetingLink}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 4px;">
          Join Meeting
        </a>
        ` : ""}
      </div>

      ${params.manageUrl && params.isGuest ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${params.manageUrl}" style="display: inline-block; background: #f3f4f6; color: #374151; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; border: 1px solid #e5e7eb;">
          Reschedule or Cancel
        </a>
      </div>
      ` : ""}

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        The attached .ics file can be used to update your calendar event.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Powered by <a href="https://bookme.bet" style="color: #6366f1; text-decoration: none;">BookMe.Bet</a> — Scheduling Made Simple
      </p>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find confirmed bookings in the 24h window that haven't had a reminder sent
    // Window: between 23h and 25h from now (gives an hour of cron tolerance)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h from now
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 25h from now

    // We query by scheduled_date and start_time together using host timezone
    // For simplicity we look for bookings on the date that falls in the window
    // and start_time that would place them in that window relative to UTC
    const windowStartDate = windowStart.toISOString().split("T")[0];
    const windowEndDate = windowEnd.toISOString().split("T")[0];

    console.log(`[Reminders] Scanning for bookings between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        guest_name,
        guest_email,
        guest_timezone,
        host_user_id,
        host_timezone,
        scheduled_date,
        start_time,
        end_time,
        status,
        meeting_link,
        cancellation_token,
        reminder_sent,
        event_types (
          title,
          duration
        ),
        profiles!bookings_host_user_id_profiles_fkey (
          full_name,
          email
        )
      `)
      .eq("status", "confirmed")
      .eq("reminder_sent", false)
      .gte("scheduled_date", windowStartDate)
      .lte("scheduled_date", windowEndDate);

    if (error) throw error;

    console.log(`[Reminders] Found ${bookings?.length ?? 0} candidate bookings`);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookings ?? []) {
      try {
        // Build a UTC datetime for the booking start using host timezone
        const scheduledDate: string = booking.scheduled_date;
        const startTime: string = booking.start_time.slice(0, 5); // "HH:MM"
        const hostTz: string = booking.host_timezone || "America/New_York";

        // Parse start into a UTC timestamp for precise window check
        const [sh, sm] = startTime.split(":").map(Number);
        const [sy, smo, sd] = scheduledDate.split("-").map(Number);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const localIso = `${sy}-${pad(smo)}-${sd}T${pad(sh)}:${pad(sm)}:00`;

        let bookingUtcMs: number;
        try {
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: hostTz,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false,
          });
          let utcGuess = new Date(localIso).getTime();
          for (let i = 0; i < 3; i++) {
            const parts = formatter.formatToParts(new Date(utcGuess));
            const p: Record<string, number> = {};
            for (const { type, value } of parts) p[type] = Number(value);
            const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
            utcGuess = new Date(localIso).getTime() - (rendered - utcGuess);
          }
          bookingUtcMs = utcGuess;
        } catch {
          bookingUtcMs = new Date(localIso).getTime();
        }

        // Only send if the booking truly falls in the 23-25h window
        if (bookingUtcMs < windowStart.getTime() || bookingUtcMs > windowEnd.getTime()) {
          console.log(`[Reminders] Booking ${booking.id} is outside precise window (date-only match). Skipping.`);
          skipped++;
          continue;
        }

        const eventTitle: string = (booking.event_types as any)?.title ?? "Meeting";
        const duration: number = (booking.event_types as any)?.duration ?? 30;
        const hostName: string = (booking.profiles as any)?.full_name ?? "Host";
        const hostEmail: string = (booking.profiles as any)?.email ?? "";
        const formattedDate = formatDate(scheduledDate);
        const formattedGuestTime = formatTime(startTime);
        const formattedHostTime = formatTime(startTime);
        const endTime: string = booking.end_time.slice(0, 5);
        const meetingLink: string | undefined = booking.meeting_link ?? undefined;
        const manageUrl = booking.cancellation_token
          ? `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co/rest", "bookme.bet") || "https://bookme.bet"}/booking/${booking.id}/manage?token=${booking.cancellation_token}`
          : undefined;

        const icsContent = generateReminderICS({
          id: booking.id,
          scheduledDate,
          startTime,
          endTime,
          eventTitle,
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          hostName,
          hostEmail,
          hostTimezone: hostTz,
          meetingLink,
        });
        const icsBase64 = btoa(icsContent);

        let guestSent = false;
        let hostSent = false;

        // Send guest reminder
        try {
          await sendEmailWithRetry({
            from: RESEND_FROM_EMAIL,
            to: [booking.guest_email],
            replyTo: hostEmail || undefined,
            subject: `Reminder: Your meeting tomorrow — ${formattedDate}`,
            html: buildReminderHtml({
              recipientName: booking.guest_name,
              otherPartyLabel: "Host",
              otherPartyName: hostName,
              otherPartyEmail: hostEmail,
              eventTitle,
              formattedDate,
              formattedTime: formattedGuestTime,
              timezone: booking.guest_timezone || undefined,
              duration,
              meetingLink,
              manageUrl,
              isGuest: true,
            }),
            attachments: [{ filename: "meeting-reminder.ics", content: icsBase64, content_type: "text/calendar" }],
          });
          guestSent = true;
          console.log(`[Reminders] Guest reminder sent to ${maskEmail(booking.guest_email)} for booking ${booking.id}`);
        } catch (err: any) {
          console.error(`[Reminders] Failed guest reminder for ${booking.id}: ${err.message}`);
        }

        // Send host reminder
        if (hostEmail) {
          try {
            await sendEmailWithRetry({
              from: RESEND_FROM_EMAIL,
              to: [hostEmail],
              replyTo: booking.guest_email,
              subject: `Reminder: ${booking.guest_name}'s meeting tomorrow — ${formattedDate}`,
              html: buildReminderHtml({
                recipientName: hostName,
                otherPartyLabel: "Guest",
                otherPartyName: booking.guest_name,
                otherPartyEmail: booking.guest_email,
                eventTitle,
                formattedDate,
                formattedTime: formattedHostTime,
                timezone: hostTz,
                duration,
                meetingLink,
                isGuest: false,
              }),
              attachments: [{ filename: "meeting-reminder.ics", content: icsBase64, content_type: "text/calendar" }],
            });
            hostSent = true;
            console.log(`[Reminders] Host reminder sent to ${maskEmail(hostEmail)} for booking ${booking.id}`);
          } catch (err: any) {
            console.error(`[Reminders] Failed host reminder for ${booking.id}: ${err.message}`);
          }
        }

        // Mark reminder as sent if at least guest was notified
        if (guestSent || hostSent) {
          await supabase
            .from("bookings")
            .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
            .eq("id", booking.id);
          sent++;
        } else {
          failed++;
        }

        // Small delay between bookings to respect rate limits
        await sleep(200);
      } catch (err: any) {
        console.error(`[Reminders] Error processing booking ${booking.id}: ${err.message}`);
        failed++;
      }
    }

    console.log(`[Reminders] Done. Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, skipped, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Reminders] Fatal error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
