import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ <contact@notifications.3bi.io>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "booking_confirmed" | "booking_cancelled" | "booking_rescheduled";
  booking: {
    id: string;
    guestName: string;
    guestEmail: string;
    hostName: string;
    hostEmail?: string;
    eventTitle: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    guestTimezone?: string;
    hostTimezone?: string;
    meetingLink?: string;
    manageUrl?: string;
  };
  oldDateTime?: {
    date: string;
    time: string;
  };
}

// Mask email for privacy in logs
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${maskedLocal}@${domain}`;
}

// Sleep utility for retry logic
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Send email via Resend API with retry logic
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
  console.log(`[Email] Attempting to send email to: ${payload.to.map(maskEmail).join(", ")}`);
  console.log(`[Email] Subject: ${payload.subject}`);
  console.log(`[Email] From: ${payload.from}`);
  if (payload.replyTo) {
    console.log(`[Email] Reply-To: ${maskEmail(payload.replyTo)}`);
  }

  if (!RESEND_API_KEY) {
    console.error("[Email] ERROR: RESEND_API_KEY is not configured");
    throw new Error("RESEND_API_KEY is not configured");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Email] Attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        // Don't retry on client errors (4xx) except rate limits (429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          console.error(`[Email] ERROR: Resend API returned status ${response.status}`);
          console.error(`[Email] ERROR Response: ${responseText}`);
          throw new Error(`Resend API error (${response.status}): ${responseText}`);
        }
        
        throw new Error(`Resend API error (${response.status}): ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log(`[Email] SUCCESS: Email sent with ID: ${result.id}`);
      return { success: true, id: result.id };
    } catch (error: any) {
      lastError = error;
      console.error(`[Email] Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.log(`[Email] Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  console.error(`[Email] FAILED after ${maxRetries} attempts: ${lastError?.message}`);
  throw lastError || new Error("Unknown error sending email");
}

// Generate ICS calendar file content with UTC timestamps for universal timezone compatibility
function generateICS(booking: EmailRequest["booking"], method: "REQUEST" | "CANCEL" = "REQUEST"): string {
  // Convert a local date+time string to a UTC ICS timestamp (Z-suffix = unambiguous in all calendar apps)
  const toUtcIcsString = (dateStr: string, timeStr: string, timezone?: string): string => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);

    // Build an ISO string in the source timezone for correct DST handling
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localIso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

    let utcMs: number;
    if (timezone) {
      try {
        // Use Intl to find the UTC offset at this exact moment in the given timezone
        const refDate = new Date(`${localIso}`);
        // Get what UTC time Intl thinks this local time maps to
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false,
        });
        // Find offset by comparing how the timezone renders a known UTC instant
        // We iterate to converge on the correct UTC time
        let utcGuess = refDate.getTime();
        for (let i = 0; i < 3; i++) {
          const parts = formatter.formatToParts(new Date(utcGuess));
          const p: Record<string, number> = {};
          for (const { type, value } of parts) p[type] = Number(value);
          const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
          const offset = rendered - utcGuess;
          utcGuess = refDate.getTime() - offset;
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

  const tz = booking.hostTimezone || booking.guestTimezone;
  const startDateTime = toUtcIcsString(booking.scheduledDate, booking.startTime, tz);
  const endDateTime = toUtcIcsString(booking.scheduledDate, booking.endTime, tz);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bookme.bet//Booking//EN
CALSCALE:GREGORIAN
METHOD:${method}
BEGIN:VEVENT
UID:booking-${booking.id}@bookme.bet
DTSTAMP:${timestamp}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${booking.eventTitle} with ${booking.guestName}
DESCRIPTION:Meeting booked via Bookme.bet.${booking.meetingLink ? `\\n\\nMeeting Link: ${booking.meetingLink}` : ""}
ORGANIZER;CN=${booking.hostName}:mailto:${booking.hostEmail || "noreply@bookme.bet"}
ATTENDEE;CN=${booking.guestName};RSVP=TRUE:mailto:${booking.guestEmail}
STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}
SEQUENCE:${method === "CANCEL" ? "1" : "0"}
END:VEVENT
END:VCALENDAR`;

  return icsContent;
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

function getTimezoneAbbr(tz: string): string {
  try {
    return (
      new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? tz
    );
  } catch {
    return tz;
  }
}

function convertTimeBetweenZones(
  dateStr: string,
  timeStr: string,
  fromTz: string,
  toTz: string
): { time: string; abbr: string; dateDiff: number } {
  try {
    const [sh, sm] = timeStr.split(":").map(Number);
    const [sy, smo, sd] = dateStr.split("-").map(Number);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localIso = `${sy}-${pad(smo)}-${pad(sd)}T${pad(sh)}:${pad(sm)}:00`;

    const fromFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: fromTz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
    let utcMs = new Date(localIso).getTime();
    for (let i = 0; i < 3; i++) {
      const parts = fromFormatter.formatToParts(new Date(utcMs));
      const p: Record<string, number> = {};
      for (const { type, value } of parts) p[type] = Number(value);
      const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
      utcMs = new Date(localIso).getTime() - (rendered - utcMs);
    }

    const toTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: toTz, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(utcMs));

    const abbr =
      new Intl.DateTimeFormat("en-US", { timeZone: toTz, timeZoneName: "short" })
        .formatToParts(new Date(utcMs))
        .find((p) => p.type === "timeZoneName")?.value ?? toTz;

    const origDay = sd;
    const convDayStr = new Intl.DateTimeFormat("en-US", {
      timeZone: toTz, day: "2-digit",
    }).format(new Date(utcMs));
    const dateDiff = parseInt(convDayStr) - origDay;

    return { time: toTimeStr, abbr, dateDiff };
  } catch {
    return { time: formatTime(timeStr), abbr: toTz, dateDiff: 0 };
  }
}

function buildTimezoneBlock(params: {
  primaryTime: string;
  primaryTzAbbr: string;
  secondaryTime: string;
  secondaryTzAbbr: string;
  secondaryLabel: string;
  dateDiff: number;
}): string {
  const crossDayWarning =
    params.dateDiff > 0
      ? ` <span style="color:#ef4444;font-weight:600;">(next day ⚠️)</span>`
      : params.dateDiff < 0
      ? ` <span style="color:#ef4444;font-weight:600;">(previous day ⚠️)</span>`
      : "";

  return `
    <div style="margin:14px 0 6px;padding:14px 18px;background:white;border-radius:10px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;font-weight:600;">Your local time</p>
      <p style="margin:0;font-size:24px;font-weight:700;color:#111827;line-height:1.2;">
        ${params.primaryTime}
        <span style="display:inline-block;font-size:12px;font-weight:700;background:#6366f1;color:white;padding:3px 9px;border-radius:5px;margin-left:10px;vertical-align:middle;">${params.primaryTzAbbr}</span>
      </p>
    </div>
    <p style="margin:6px 0 14px 4px;font-size:14px;color:#6b7280;">
      ${params.secondaryLabel}:
      <strong style="color:#374151;">${params.secondaryTime}</strong>
      <span style="color:#9ca3af;">&nbsp;(${params.secondaryTzAbbr})</span>${crossDayWarning}
    </p>`;
}

async function sendConfirmationEmails(booking: EmailRequest["booking"]): Promise<{ guestSent: boolean; hostSent: boolean }> {
  console.log(`[Confirmation] Processing confirmation emails for booking ${booking.id}`);
  console.log(`[Confirmation] Guest: ${maskEmail(booking.guestEmail)}, Host: ${booking.hostEmail ? maskEmail(booking.hostEmail) : "NOT PROVIDED"}`);
  
  const icsContent = generateICS(booking, "REQUEST");
  const icsBase64 = btoa(icsContent);
  
  const formattedDate = formatDate(booking.scheduledDate);
  const hostTz = booking.hostTimezone || "UTC";
  const guestTz = booking.guestTimezone || "UTC";
  const hostTimeFormatted = formatTime(booking.startTime);
  const hostTzAbbr = getTimezoneAbbr(hostTz);

  // Convert host time → guest local time (times are stored in host tz)
  const guestConverted = convertTimeBetweenZones(booking.scheduledDate, booking.startTime, hostTz, guestTz);

  let guestSent = false;
  let hostSent = false;
  
  // Email to guest — primary: guest local time, secondary: host time
  try {
    await sendEmailWithRetry({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      replyTo: booking.hostEmail,
      subject: `Confirmed: Meeting with ${booking.hostName} on ${formattedDate}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#6366f1;margin:0;">✓ Booking Confirmed</h1>
          </div>
          <p style="font-size:16px;color:#374151;">Hi ${booking.guestName},</p>
          <p style="font-size:16px;color:#374151;">Your meeting has been confirmed! Here are the details:</p>
          <div style="background:#f3f4f6;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #6366f1;">
            <h2 style="margin:0 0 16px 0;color:#111827;">${booking.eventTitle}</h2>
            <p style="margin:8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${formattedDate}</p>
            ${buildTimezoneBlock({
              primaryTime: guestConverted.time,
              primaryTzAbbr: guestConverted.abbr,
              secondaryTime: hostTimeFormatted,
              secondaryTzAbbr: hostTzAbbr,
              secondaryLabel: "Host's time",
              dateDiff: -guestConverted.dateDiff,
            })}
            <p style="margin:8px 0;color:#4b5563;"><strong>⏱️ Duration:</strong> ${booking.duration} minutes</p>
            <p style="margin:8px 0;color:#4b5563;"><strong>👤 Host:</strong> ${booking.hostName}</p>
            ${booking.meetingLink ? `
            <p style="margin:16px 0 8px;color:#4b5563;"><strong>🔗 Meeting Link:</strong></p>
            <a href="${booking.meetingLink}" style="display:inline-block;background:#6366f1;color:white;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Join Meeting</a>
            ` : ""}
          </div>
          ${booking.manageUrl ? `
          <div style="text-align:center;margin:20px 0;">
            <a href="${booking.manageUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #e5e7eb;">Reschedule or Cancel</a>
          </div>
          ` : ""}
          <p style="font-size:14px;color:#6b7280;margin-top:20px;">Add this event to your calendar using the attached .ics file.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;">Powered by <a href="https://bookme.bet" style="color:#6366f1;text-decoration:none;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a> — Scheduling Made Simple</p>
        </div>
      `,
      attachments: [{ filename: "meeting.ics", content: icsBase64, content_type: "text/calendar" }],
    });
    guestSent = true;
    console.log(`[Confirmation] Guest email sent successfully to ${maskEmail(booking.guestEmail)}`);
  } catch (error: any) {
    console.error(`[Confirmation] Failed to send guest email: ${error.message}`);
  }

  // Email to host — primary: host local time, secondary: guest time
  if (booking.hostEmail) {
    try {
      await sendEmailWithRetry({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        replyTo: booking.guestEmail,
        subject: `New Booking: ${booking.guestName} on ${formattedDate}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;margin-bottom:30px;">
              <h1 style="color:#6366f1;">📅 New Booking</h1>
            </div>
            <p style="font-size:16px;color:#374151;">Hi ${booking.hostName},</p>
            <p style="font-size:16px;color:#374151;">You have a new booking! Here are the details:</p>
            <div style="background:#f3f4f6;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #6366f1;">
              <h2 style="margin:0 0 16px 0;color:#111827;">${booking.eventTitle}</h2>
              <p style="margin:8px 0;color:#4b5563;"><strong>👤 Guest:</strong> ${booking.guestName} (${booking.guestEmail})</p>
              <p style="margin:8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${formattedDate}</p>
              ${buildTimezoneBlock({
                primaryTime: hostTimeFormatted,
                primaryTzAbbr: hostTzAbbr,
                secondaryTime: guestConverted.time,
                secondaryTzAbbr: guestConverted.abbr,
                secondaryLabel: "Guest's time",
                dateDiff: guestConverted.dateDiff,
              })}
              <p style="margin:8px 0;color:#4b5563;"><strong>⏱️ Duration:</strong> ${booking.duration} minutes</p>
              ${booking.meetingLink ? `<p style="margin:8px 0;color:#4b5563;"><strong>🔗 Meeting Link:</strong> <a href="${booking.meetingLink}" style="color:#6366f1;">${booking.meetingLink}</a></p>` : ""}
            </div>
            <p style="font-size:14px;color:#6b7280;margin-top:20px;">Add this event to your calendar using the attached .ics file.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
            <p style="font-size:12px;color:#9ca3af;text-align:center;">Powered by <a href="https://bookme.bet" style="color:#6366f1;text-decoration:none;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a> — Scheduling Made Simple</p>
          </div>
        `,
        attachments: [{ filename: "meeting.ics", content: icsBase64, content_type: "text/calendar" }],
      });
      hostSent = true;
      console.log(`[Confirmation] Host email sent successfully to ${maskEmail(booking.hostEmail)}`);
    } catch (error: any) {
      console.error(`[Confirmation] Failed to send host email: ${error.message}`);
    }
  } else {
    console.warn(`[Confirmation] WARNING: No host email provided for booking ${booking.id}`);
  }
  
  return { guestSent, hostSent };
}

async function sendCancellationEmail(booking: EmailRequest["booking"]): Promise<{ guestSent: boolean; hostSent: boolean }> {
  console.log(`[Cancellation] Processing cancellation emails for booking ${booking.id}`);
  console.log(`[Cancellation] Guest: ${maskEmail(booking.guestEmail)}, Host: ${booking.hostEmail ? maskEmail(booking.hostEmail) : "NOT PROVIDED"}`);
  
  const icsContent = generateICS(booking, "CANCEL");
  const icsBase64 = btoa(icsContent);
  
  const formattedDate = formatDate(booking.scheduledDate);
  const formattedTime = formatTime(booking.startTime);
  
  let guestSent = false;
  let hostSent = false;
  
  // Email to guest
  try {
    await sendEmailWithRetry({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      replyTo: booking.hostEmail,
      subject: `Cancelled: Meeting with ${booking.hostName} on ${formattedDate}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ef4444;">✕ Meeting Cancelled</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Hi ${booking.guestName},</p>
          
          <p style="font-size: 16px; color: #374151;">Your meeting has been cancelled:</p>
          
          <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
            <h2 style="margin: 0 0 16px 0; color: #111827; text-decoration: line-through;">${booking.eventTitle}</h2>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>📅 Date:</strong> ${formattedDate}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>🕐 Time:</strong> ${formattedTime}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>👤 Host:</strong> ${booking.hostName}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            The attached .ics file will remove this event from your calendar.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Powered by <a href="https://bookme.bet" style="color:#6366f1;text-decoration:none;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a> — Scheduling Made Simple
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "meeting-cancelled.ics",
          content: icsBase64,
          content_type: "text/calendar",
        },
      ],
    });
    guestSent = true;
    console.log(`[Cancellation] Guest email sent successfully`);
  } catch (error: any) {
    console.error(`[Cancellation] Failed to send guest email: ${error.message}`);
  }

  // Email to host
  if (booking.hostEmail) {
    try {
      await sendEmailWithRetry({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        replyTo: booking.guestEmail,
        subject: `Cancelled: Meeting with ${booking.guestName} on ${formattedDate}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444;">✕ Booking Cancelled</h1>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Hi ${booking.hostName},</p>
            
            <p style="font-size: 16px; color: #374151;">A booking has been cancelled:</p>
            
            <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <h2 style="margin: 0 0 16px 0; color: #111827; text-decoration: line-through;">${booking.eventTitle}</h2>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>👤 Guest:</strong> ${booking.guestName} (${booking.guestEmail})
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>📅 Date:</strong> ${formattedDate}
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>🕐 Time:</strong> ${formattedTime}
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Powered by <a href="https://bookme.bet" style="color:#6366f1;text-decoration:none;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a> — Scheduling Made Simple
            </p>
          </div>
        `,
        attachments: [
          {
            filename: "meeting-cancelled.ics",
            content: icsBase64,
            content_type: "text/calendar",
          },
        ],
      });
      hostSent = true;
      console.log(`[Cancellation] Host email sent successfully`);
    } catch (error: any) {
      console.error(`[Cancellation] Failed to send host email: ${error.message}`);
    }
  } else {
    console.warn(`[Cancellation] WARNING: No host email provided`);
  }
  
  return { guestSent, hostSent };
}

async function sendRescheduleEmail(booking: EmailRequest["booking"], oldDateTime: { date: string; time: string }): Promise<{ guestSent: boolean; hostSent: boolean }> {
  console.log(`[Reschedule] Processing reschedule emails for booking ${booking.id}`);
  console.log(`[Reschedule] Old: ${oldDateTime.date} ${oldDateTime.time} -> New: ${booking.scheduledDate} ${booking.startTime}`);
  console.log(`[Reschedule] Guest: ${maskEmail(booking.guestEmail)}, Host: ${booking.hostEmail ? maskEmail(booking.hostEmail) : "NOT PROVIDED"}`);
  
  const icsContent = generateICS(booking, "REQUEST");
  const icsBase64 = btoa(icsContent);
  
  const newFormattedDate = formatDate(booking.scheduledDate);
  const oldFormattedDate = formatDate(oldDateTime.date);
  const oldFormattedTime = formatTime(oldDateTime.time);
  const hostTz = booking.hostTimezone || "UTC";
  const guestTz = booking.guestTimezone || "UTC";
  const hostTimeFormatted = formatTime(booking.startTime);
  const hostTzAbbr = getTimezoneAbbr(hostTz);
  const guestConverted = convertTimeBetweenZones(booking.scheduledDate, booking.startTime, hostTz, guestTz);

  let guestSent = false;
  let hostSent = false;
  
  // Email to guest — primary: guest local time, secondary: host time
  try {
    await sendEmailWithRetry({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      replyTo: booking.hostEmail,
      subject: `Rescheduled: Meeting with ${booking.hostName} - New time: ${newFormattedDate}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#f59e0b;">🔄 Meeting Rescheduled</h1>
          </div>
          <p style="font-size:16px;color:#374151;">Hi ${booking.guestName},</p>
          <p style="font-size:16px;color:#374151;">Your meeting has been rescheduled. Here's the updated information:</p>
          <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #ef4444;">
            <p style="margin:0 0 8px 0;font-weight:bold;color:#ef4444;">Previous Time</p>
            <p style="margin:4px 0;color:#4b5563;text-decoration:line-through;">${oldFormattedDate} at ${oldFormattedTime}</p>
          </div>
          <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #22c55e;">
            <p style="margin:0 0 8px 0;font-weight:bold;color:#22c55e;">✓ New Time</p>
            <h2 style="margin:0 0 16px 0;color:#111827;">${booking.eventTitle}</h2>
            <p style="margin:8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${newFormattedDate}</p>
            ${buildTimezoneBlock({
              primaryTime: guestConverted.time,
              primaryTzAbbr: guestConverted.abbr,
              secondaryTime: hostTimeFormatted,
              secondaryTzAbbr: hostTzAbbr,
              secondaryLabel: "Host's time",
              dateDiff: -guestConverted.dateDiff,
            })}
            <p style="margin:8px 0;color:#4b5563;"><strong>⏱️ Duration:</strong> ${booking.duration} minutes</p>
            <p style="margin:8px 0;color:#4b5563;"><strong>👤 Host:</strong> ${booking.hostName}</p>
          </div>
          ${booking.manageUrl ? `
          <div style="text-align:center;margin:20px 0;">
            <a href="${booking.manageUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #e5e7eb;">Reschedule or Cancel</a>
          </div>
          ` : ""}
          <p style="font-size:14px;color:#6b7280;margin-top:20px;">The attached .ics file will update this event in your calendar.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
          <p style="font-size:12px;color:#9ca3af;text-align:center;">Powered by <a href="https://bookme.bet" style="color:#6366f1;text-decoration:none;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a> — Scheduling Made Simple</p>
        </div>
      `,
      attachments: [{ filename: "meeting-updated.ics", content: icsBase64, content_type: "text/calendar" }],
    });
    guestSent = true;
    console.log(`[Reschedule] Guest email sent successfully`);
  } catch (error: any) {
    console.error(`[Reschedule] Failed to send guest email: ${error.message}`);
  }

  // Email to host — primary: host local time, secondary: guest time
  if (booking.hostEmail) {
    try {
      await sendEmailWithRetry({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        replyTo: booking.guestEmail,
        subject: `Rescheduled: Meeting with ${booking.guestName} - New time: ${newFormattedDate}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;margin-bottom:30px;">
              <h1 style="color:#f59e0b;">🔄 Booking Rescheduled</h1>
            </div>
            <p style="font-size:16px;color:#374151;">Hi ${booking.hostName},</p>
            <p style="font-size:16px;color:#374151;">A booking has been rescheduled:</p>
            <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #ef4444;">
              <p style="margin:0 0 8px 0;font-weight:bold;color:#ef4444;">Previous Time</p>
              <p style="margin:4px 0;color:#4b5563;text-decoration:line-through;">${oldFormattedDate} at ${oldFormattedTime}</p>
            </div>
            <div style="background:#f0fdf4;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #22c55e;">
              <p style="margin:0 0 8px 0;font-weight:bold;color:#22c55e;">✓ New Time</p>
              <h2 style="margin:0 0 16px 0;color:#111827;">${booking.eventTitle}</h2>
              <p style="margin:8px 0;color:#4b5563;"><strong>👤 Guest:</strong> ${booking.guestName} (${booking.guestEmail})</p>
              <p style="margin:8px 0;color:#4b5563;"><strong>📅 Date:</strong> ${newFormattedDate}</p>
              ${buildTimezoneBlock({
                primaryTime: hostTimeFormatted,
                primaryTzAbbr: hostTzAbbr,
                secondaryTime: guestConverted.time,
                secondaryTzAbbr: guestConverted.abbr,
                secondaryLabel: "Guest's time",
                dateDiff: guestConverted.dateDiff,
              })}
              <p style="margin:8px 0;color:#4b5563;"><strong>⏱️ Duration:</strong> ${booking.duration} minutes</p>
            </div>
            <p style="font-size:14px;color:#6b7280;margin-top:20px;">The attached .ics file will update this event in your calendar.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">
            <p style="font-size:12px;color:#9ca3af;text-align:center;">Powered by <a href="https://bookme.bet" style="color:#6366f1;text-decoration:none;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a> — Scheduling Made Simple</p>
          </div>
        `,
        attachments: [{ filename: "meeting-updated.ics", content: icsBase64, content_type: "text/calendar" }],
      });
      hostSent = true;
      console.log(`[Reschedule] Host email sent successfully`);
    } catch (error: any) {
      console.error(`[Reschedule] Failed to send host email: ${error.message}`);
    }
  } else {
    console.warn(`[Reschedule] WARNING: No host email provided`);
  }
  
  return { guestSent, hostSent };
}

// Map email type to database field for tracking
function getEmailTypeField(type: EmailRequest["type"]): string {
  switch (type) {
    case "booking_confirmed":
      return "confirmation";
    case "booking_cancelled":
      return "cancellation";
    case "booking_rescheduled":
      return "reschedule";
    default:
      return "unknown";
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] ========== NEW EMAIL REQUEST ==========`);
  console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`[${requestId}] RESEND_API_KEY configured: ${!!RESEND_API_KEY}`);
  console.log(`[${requestId}] RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL}`);

  try {
    const { type, booking, oldDateTime }: EmailRequest = await req.json();
    
    console.log(`[${requestId}] Email type: ${type}`);
    console.log(`[${requestId}] Booking ID: ${booking.id}`);
    console.log(`[${requestId}] Event: ${booking.eventTitle}`);
    console.log(`[${requestId}] Date: ${booking.scheduledDate} at ${booking.startTime}`);
    console.log(`[${requestId}] Guest: ${booking.guestName} (${maskEmail(booking.guestEmail)})`);
    console.log(`[${requestId}] Host: ${booking.hostName} (${booking.hostEmail ? maskEmail(booking.hostEmail) : "NO EMAIL PROVIDED"})`);

    // Check host's email notification preferences
    let hostEmailEnabled = true;
    try {
      const supabaseForPrefs = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      // Look up the host's profile via the booking record
      const { data: bookingData } = await supabaseForPrefs
        .from("bookings")
        .select("host_user_id")
        .eq("id", booking.id)
        .single();

      if (bookingData?.host_user_id) {
        const { data: profileData } = await supabaseForPrefs
          .from("profiles")
          .select("notification_preferences")
          .eq("user_id", bookingData.host_user_id)
          .single();

        if (profileData?.notification_preferences) {
          const prefs = profileData.notification_preferences as Record<string, boolean>;
          const prefKey = type === "booking_confirmed" ? "email_booking_created"
            : type === "booking_cancelled" ? "email_booking_cancelled"
            : "email_booking_rescheduled";
          hostEmailEnabled = prefs[prefKey] !== false; // default true if not set
          console.log(`[${requestId}] Host email pref (${prefKey}): ${hostEmailEnabled}`);
        }
      }
    } catch (prefErr: any) {
      console.warn(`[${requestId}] Could not check email prefs, defaulting to enabled: ${prefErr.message}`);
    }

    // If host email is disabled by preference, temporarily remove it so email functions skip host
    const originalHostEmail = booking.hostEmail;
    if (!hostEmailEnabled) {
      booking.hostEmail = undefined;
      console.log(`[${requestId}] Skipping host email per notification preferences`);
    }

    let result: { guestSent: boolean; hostSent: boolean };

    switch (type) {
      case "booking_confirmed":
        result = await sendConfirmationEmails(booking);
        break;
      case "booking_cancelled":
        result = await sendCancellationEmail(booking);
        break;
      case "booking_rescheduled":
        if (!oldDateTime) {
          throw new Error("oldDateTime required for reschedule emails");
        }
        result = await sendRescheduleEmail(booking, oldDateTime);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Restore for logging
    booking.hostEmail = originalHostEmail;

    console.log(`[${requestId}] ========== EMAIL RESULT ==========`);
    console.log(`[${requestId}] Guest email sent: ${result.guestSent}`);
    console.log(`[${requestId}] Host email sent: ${result.hostSent}`);
    console.log(`[${requestId}] ===================================`);

    // Trigger Slack notification (fire-and-forget)
    try {
      const bookingForSlack = await (async () => {
        const supabaseSlack = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: bData } = await supabaseSlack
          .from("bookings")
          .select("host_user_id, event_types(duration)")
          .eq("id", booking.id)
          .single();
        return bData;
      })();

      if (bookingForSlack?.host_user_id) {
        const slackPayload = {
          type,
          booking: {
            id: booking.id,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            hostName: booking.hostName,
            eventTitle: booking.eventTitle,
            scheduledDate: booking.scheduledDate,
            startTime: booking.startTime,
            duration: (bookingForSlack.event_types as any)?.duration || booking.duration || 30,
            hostTimezone: booking.hostTimezone,
          },
          hostUserId: bookingForSlack.host_user_id,
        };

        fetch(`${SUPABASE_URL}/functions/v1/slack-notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify(slackPayload),
        }).catch((err) =>
          console.warn(`[${requestId}] Slack notify fire-and-forget error: ${err.message}`)
        );
        console.log(`[${requestId}] Slack notification triggered`);
      }
    } catch (slackErr: any) {
      console.warn(`[${requestId}] Slack notify skipped: ${slackErr.message}`);
    }

    // Trigger Google Calendar sync (fire-and-forget)
    try {
      if (bookingForSlack?.host_user_id) {
        const supabaseGcal = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: hostProfile } = await supabaseGcal
          .from("profiles")
          .select("google_calendar_connected")
          .eq("user_id", bookingForSlack.host_user_id)
          .single();

        if (hostProfile?.google_calendar_connected) {
          const gcalAction = type === "booking_cancelled" ? "delete" : type === "booking_rescheduled" ? "update" : "create";
          
          fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              action: gcalAction,
              userId: bookingForSlack.host_user_id,
              booking: {
                id: booking.id,
                scheduledDate: booking.scheduledDate,
                startTime: booking.startTime,
                endTime: booking.endTime,
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                eventTitle: booking.eventTitle,
                meetingLink: booking.meetingLink,
                hostTimezone: booking.hostTimezone,
              },
            }),
          }).catch((err) =>
            console.warn(`[${requestId}] Google Calendar sync fire-and-forget error: ${err.message}`)
          );
          console.log(`[${requestId}] Google Calendar sync triggered (${gcalAction})`);
        }
      }
    } catch (gcalErr: any) {
      console.warn(`[${requestId}] Google Calendar sync skipped: ${gcalErr.message}`);
    }

    // Update booking record with email status
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const emailTypeField = getEmailTypeField(type);
      const emailStatus = (result.guestSent || result.hostSent) ? "sent" : "failed";

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          confirmation_email_sent: result.guestSent || result.hostSent,
          email_sent_at: new Date().toISOString(),
          email_status: emailStatus,
          last_email_type: emailTypeField,
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error(`[${requestId}] Failed to update booking email status: ${updateError.message}`);
      } else {
        console.log(`[${requestId}] Updated booking ${booking.id} — email_status: ${emailStatus}, type: ${emailTypeField}`);
      }
    } catch (dbError: any) {
      console.error(`[${requestId}] Database error updating email status: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        guestEmailSent: result.guestSent,
        hostEmailSent: result.hostSent
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error(`[${requestId}] ========== ERROR ==========`);
    console.error(`[${requestId}] Error: ${error.message}`);
    console.error(`[${requestId}] Stack: ${error.stack}`);
    console.error(`[${requestId}] ============================`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
