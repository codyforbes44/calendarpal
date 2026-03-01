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

// ─── Shared email layout builder ───
const BRAND_COLOR = "#6366f1";
const BRAND_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)";
const LOGO_URL = "https://calendarpal.lovable.app/bookme-logo.png";

function emailLayout(options: {
  preheader: string;
  headerIcon: string;
  headerTitle: string;
  headerColor: string;
  headerGradient?: string;
  greeting: string;
  introParagraph: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  const gradient = options.headerGradient || BRAND_GRADIENT;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${options.headerTitle}</title></head>
<body style="margin:0;padding:0;background-color:#f0f0f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;">${options.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f5;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <!-- Gradient Header -->
    <tr><td style="background:${gradient};border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" width="120" height="auto" style="display:block;margin:0 auto 20px;max-width:120px;">
      <div style="font-size:36px;line-height:1;">${options.headerIcon}</div>
      <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${options.headerTitle}</h1>
    </td></tr>
    <!-- Body Card -->
    <tr><td style="background:#ffffff;padding:36px 32px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="margin:0 0 6px;font-size:17px;font-weight:600;color:#1f2937;">${options.greeting}</p>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">${options.introParagraph}</p>
      ${options.bodyHtml}
      ${options.footerHtml || ""}
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 32px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Powered by <a href="https://bookme.bet" style="color:${BRAND_COLOR};text-decoration:none;font-weight:600;">Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</a></p>
      <p style="margin:0;font-size:11px;color:#c4c7cc;">Scheduling Made Simple</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function detailRow(icon: string, label: string, value: string, options?: { strikethrough?: boolean }): string {
  const textStyle = options?.strikethrough ? "text-decoration:line-through;color:#9ca3af;" : "color:#1f2937;";
  return `<tr>
    <td style="padding:10px 16px;vertical-align:top;width:28px;font-size:18px;">${icon}</td>
    <td style="padding:10px 16px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      <p style="margin:3px 0 0;font-size:15px;font-weight:600;${textStyle}">${value}</p>
    </td>
  </tr>`;
}

function detailsCard(rows: string, borderColor: string = BRAND_COLOR): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;border-left:4px solid ${borderColor};margin:0 0 24px;">
    ${rows}
  </table>`;
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

  return `<tr>
    <td style="padding:10px 16px;vertical-align:top;width:28px;font-size:18px;">🕐</td>
    <td style="padding:10px 16px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">YOUR LOCAL TIME</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#1f2937;line-height:1.2;">
        ${params.primaryTime}
        <span style="display:inline-block;font-size:11px;font-weight:700;background:${BRAND_COLOR};color:white;padding:3px 8px;border-radius:5px;margin-left:8px;vertical-align:middle;">${params.primaryTzAbbr}</span>
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">
        ${params.secondaryLabel}: <strong style="color:#374151;">${params.secondaryTime}</strong>
        <span style="color:#9ca3af;"> (${params.secondaryTzAbbr})</span>${crossDayWarning}
      </p>
    </td>
  </tr>`;
}

function actionButton(text: string, url: string, bgColor: string = BRAND_COLOR): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:${bgColor};color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.2px;box-shadow:0 2px 8px rgba(99,102,241,0.3);">${text}</a>
  </div>`;
}

function secondaryButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:16px 0;">
    <a href="${url}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:11px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #e5e7eb;">${text}</a>
  </div>`;
}

function icsNote(text: string): string {
  return `<p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">📎 ${text}</p>`;
}

// ─── Confirmation Emails ───

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
  const guestConverted = convertTimeBetweenZones(booking.scheduledDate, booking.startTime, hostTz, guestTz);

  let guestSent = false;
  let hostSent = false;
  
  // Guest email
  try {
    const bodyRows = detailRow("📅", "Date", formattedDate)
      + buildTimezoneBlock({
          primaryTime: guestConverted.time,
          primaryTzAbbr: guestConverted.abbr,
          secondaryTime: hostTimeFormatted,
          secondaryTzAbbr: hostTzAbbr,
          secondaryLabel: "Host's time",
          dateDiff: -guestConverted.dateDiff,
        })
      + detailRow("⏱️", "Duration", `${booking.duration} minutes`)
      + detailRow("👤", "Host", booking.hostName);

    const meetingBtn = booking.meetingLink ? actionButton("Join Meeting →", booking.meetingLink) : "";
    const manageBtn = booking.manageUrl ? secondaryButton("Reschedule or Cancel", booking.manageUrl) : "";

    await sendEmailWithRetry({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      replyTo: booking.hostEmail,
      subject: `✅ Confirmed: ${booking.eventTitle} with ${booking.hostName} — ${formattedDate}`,
      html: emailLayout({
        preheader: `Your meeting with ${booking.hostName} is confirmed for ${formattedDate}.`,
        headerIcon: "✓",
        headerTitle: "Booking Confirmed",
        headerColor: BRAND_COLOR,
        greeting: `Hi ${booking.guestName},`,
        introParagraph: "Your meeting has been confirmed! Here are the details:",
        bodyHtml: `
          <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;font-weight:700;">${booking.eventTitle}</h2>
          ${detailsCard(bodyRows)}
          ${meetingBtn}
          ${manageBtn}
          ${icsNote("Add this event to your calendar using the attached .ics file.")}
        `,
      }),
      attachments: [{ filename: "meeting.ics", content: icsBase64, content_type: "text/calendar" }],
    });
    guestSent = true;
    console.log(`[Confirmation] Guest email sent successfully to ${maskEmail(booking.guestEmail)}`);
  } catch (error: any) {
    console.error(`[Confirmation] Failed to send guest email: ${error.message}`);
  }

  // Host email
  if (booking.hostEmail) {
    try {
      const bodyRows = detailRow("👤", "Guest", `${booking.guestName} (${booking.guestEmail})`)
        + detailRow("📅", "Date", formattedDate)
        + buildTimezoneBlock({
            primaryTime: hostTimeFormatted,
            primaryTzAbbr: hostTzAbbr,
            secondaryTime: guestConverted.time,
            secondaryTzAbbr: guestConverted.abbr,
            secondaryLabel: "Guest's time",
            dateDiff: guestConverted.dateDiff,
          })
        + detailRow("⏱️", "Duration", `${booking.duration} minutes`);

      const meetingRow = booking.meetingLink
        ? detailRow("🔗", "Meeting Link", `<a href="${booking.meetingLink}" style="color:${BRAND_COLOR};text-decoration:none;">${booking.meetingLink}</a>`)
        : "";

      await sendEmailWithRetry({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        replyTo: booking.guestEmail,
        subject: `📅 New Booking: ${booking.guestName} — ${formattedDate}`,
        html: emailLayout({
          preheader: `New booking from ${booking.guestName} on ${formattedDate}.`,
          headerIcon: "📅",
          headerTitle: "New Booking",
          headerColor: BRAND_COLOR,
          greeting: `Hi ${booking.hostName},`,
          introParagraph: "You have a new booking! Here are the details:",
          bodyHtml: `
            <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;font-weight:700;">${booking.eventTitle}</h2>
            ${detailsCard(bodyRows + meetingRow)}
            ${icsNote("Add this event to your calendar using the attached .ics file.")}
          `,
        }),
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

// ─── Cancellation Emails ───

async function sendCancellationEmail(booking: EmailRequest["booking"]): Promise<{ guestSent: boolean; hostSent: boolean }> {
  console.log(`[Cancellation] Processing cancellation emails for booking ${booking.id}`);
  console.log(`[Cancellation] Guest: ${maskEmail(booking.guestEmail)}, Host: ${booking.hostEmail ? maskEmail(booking.hostEmail) : "NOT PROVIDED"}`);
  
  const icsContent = generateICS(booking, "CANCEL");
  const icsBase64 = btoa(icsContent);
  
  const formattedDate = formatDate(booking.scheduledDate);
  const formattedTime = formatTime(booking.startTime);
  const cancelGradient = "linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)";
  
  let guestSent = false;
  let hostSent = false;
  
  // Guest email
  try {
    const bodyRows = detailRow("📅", "Date", formattedDate, { strikethrough: true })
      + detailRow("🕐", "Time", formattedTime, { strikethrough: true })
      + detailRow("👤", "Host", booking.hostName);

    await sendEmailWithRetry({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      replyTo: booking.hostEmail,
      subject: `❌ Cancelled: ${booking.eventTitle} with ${booking.hostName} — ${formattedDate}`,
      html: emailLayout({
        preheader: `Your meeting with ${booking.hostName} on ${formattedDate} has been cancelled.`,
        headerIcon: "✕",
        headerTitle: "Meeting Cancelled",
        headerColor: "#ef4444",
        headerGradient: cancelGradient,
        greeting: `Hi ${booking.guestName},`,
        introParagraph: "Your meeting has been cancelled. Here were the details:",
        bodyHtml: `
          <h2 style="margin:0 0 16px;font-size:20px;color:#9ca3af;font-weight:700;text-decoration:line-through;">${booking.eventTitle}</h2>
          ${detailsCard(bodyRows, "#ef4444")}
          ${icsNote("The attached .ics file will remove this event from your calendar.")}
        `,
      }),
      attachments: [{ filename: "meeting-cancelled.ics", content: icsBase64, content_type: "text/calendar" }],
    });
    guestSent = true;
    console.log(`[Cancellation] Guest email sent successfully`);
  } catch (error: any) {
    console.error(`[Cancellation] Failed to send guest email: ${error.message}`);
  }

  // Host email
  if (booking.hostEmail) {
    try {
      const bodyRows = detailRow("👤", "Guest", `${booking.guestName} (${booking.guestEmail})`)
        + detailRow("📅", "Date", formattedDate, { strikethrough: true })
        + detailRow("🕐", "Time", formattedTime, { strikethrough: true });

      await sendEmailWithRetry({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        replyTo: booking.guestEmail,
        subject: `❌ Cancelled: ${booking.guestName} — ${formattedDate}`,
        html: emailLayout({
          preheader: `Booking from ${booking.guestName} on ${formattedDate} has been cancelled.`,
          headerIcon: "✕",
          headerTitle: "Booking Cancelled",
          headerColor: "#ef4444",
          headerGradient: cancelGradient,
          greeting: `Hi ${booking.hostName},`,
          introParagraph: "A booking has been cancelled:",
          bodyHtml: `
            <h2 style="margin:0 0 16px;font-size:20px;color:#9ca3af;font-weight:700;text-decoration:line-through;">${booking.eventTitle}</h2>
            ${detailsCard(bodyRows, "#ef4444")}
          `,
        }),
        attachments: [{ filename: "meeting-cancelled.ics", content: icsBase64, content_type: "text/calendar" }],
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

// ─── Reschedule Emails ───

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
  const rescheduleGradient = "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)";

  let guestSent = false;
  let hostSent = false;
  
  // Guest email
  try {
    const oldRow = detailRow("📅", "Previous Time", `${oldFormattedDate} at ${oldFormattedTime}`, { strikethrough: true });

    const newRows = detailRow("📅", "New Date", newFormattedDate)
      + buildTimezoneBlock({
          primaryTime: guestConverted.time,
          primaryTzAbbr: guestConverted.abbr,
          secondaryTime: hostTimeFormatted,
          secondaryTzAbbr: hostTzAbbr,
          secondaryLabel: "Host's time",
          dateDiff: -guestConverted.dateDiff,
        })
      + detailRow("⏱️", "Duration", `${booking.duration} minutes`)
      + detailRow("👤", "Host", booking.hostName);

    const manageBtn = booking.manageUrl ? secondaryButton("Reschedule or Cancel", booking.manageUrl) : "";

    await sendEmailWithRetry({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      replyTo: booking.hostEmail,
      subject: `🔄 Rescheduled: ${booking.eventTitle} with ${booking.hostName} — ${newFormattedDate}`,
      html: emailLayout({
        preheader: `Your meeting with ${booking.hostName} has been rescheduled to ${newFormattedDate}.`,
        headerIcon: "🔄",
        headerTitle: "Meeting Rescheduled",
        headerColor: "#f59e0b",
        headerGradient: rescheduleGradient,
        greeting: `Hi ${booking.guestName},`,
        introParagraph: "Your meeting has been rescheduled. Here's the updated information:",
        bodyHtml: `
          ${detailsCard(oldRow, "#ef4444")}
          <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;font-weight:700;">${booking.eventTitle} <span style="display:inline-block;font-size:12px;font-weight:700;background:#22c55e;color:white;padding:2px 8px;border-radius:5px;vertical-align:middle;margin-left:8px;">NEW</span></h2>
          ${detailsCard(newRows, "#22c55e")}
          ${manageBtn}
          ${icsNote("The attached .ics file will update this event in your calendar.")}
        `,
      }),
      attachments: [{ filename: "meeting-updated.ics", content: icsBase64, content_type: "text/calendar" }],
    });
    guestSent = true;
    console.log(`[Reschedule] Guest email sent successfully`);
  } catch (error: any) {
    console.error(`[Reschedule] Failed to send guest email: ${error.message}`);
  }

  // Host email
  if (booking.hostEmail) {
    try {
      const oldRow = detailRow("📅", "Previous Time", `${oldFormattedDate} at ${oldFormattedTime}`, { strikethrough: true });

      const newRows = detailRow("👤", "Guest", `${booking.guestName} (${booking.guestEmail})`)
        + detailRow("📅", "New Date", newFormattedDate)
        + buildTimezoneBlock({
            primaryTime: hostTimeFormatted,
            primaryTzAbbr: hostTzAbbr,
            secondaryTime: guestConverted.time,
            secondaryTzAbbr: guestConverted.abbr,
            secondaryLabel: "Guest's time",
            dateDiff: guestConverted.dateDiff,
          })
        + detailRow("⏱️", "Duration", `${booking.duration} minutes`);

      await sendEmailWithRetry({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        replyTo: booking.guestEmail,
        subject: `🔄 Rescheduled: ${booking.guestName} — ${newFormattedDate}`,
        html: emailLayout({
          preheader: `Booking from ${booking.guestName} has been rescheduled to ${newFormattedDate}.`,
          headerIcon: "🔄",
          headerTitle: "Booking Rescheduled",
          headerColor: "#f59e0b",
          headerGradient: rescheduleGradient,
          greeting: `Hi ${booking.hostName},`,
          introParagraph: "A booking has been rescheduled:",
          bodyHtml: `
            ${detailsCard(oldRow, "#ef4444")}
            <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;font-weight:700;">${booking.eventTitle} <span style="display:inline-block;font-size:12px;font-weight:700;background:#22c55e;color:white;padding:2px 8px;border-radius:5px;vertical-align:middle;margin-left:8px;">NEW</span></h2>
            ${detailsCard(newRows, "#22c55e")}
            ${icsNote("The attached .ics file will update this event in your calendar.")}
          `,
        }),
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

    // Check host's email notification preferences + resolve missing host email
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
          .select("notification_preferences, email, full_name")
          .eq("user_id", bookingData.host_user_id)
          .single();

        // Fallback: fill missing host email from profile
        if (!booking.hostEmail && profileData?.email) {
          booking.hostEmail = profileData.email;
          console.log(`[${requestId}] Resolved host email from profile: ${maskEmail(booking.hostEmail)}`);
        }

        // Fallback: fill missing host name from profile
        if ((!booking.hostName || booking.hostName === "Host") && profileData?.full_name) {
          booking.hostName = profileData.full_name;
          console.log(`[${requestId}] Resolved host name from profile: ${booking.hostName}`);
        }

        // Ultimate fallback: fetch email from auth.users if profile has none
        if (!booking.hostEmail) {
          try {
            const { data: { user: authUser } } = await supabaseForPrefs.auth.admin.getUserById(bookingData.host_user_id);
            if (authUser?.email) {
              booking.hostEmail = authUser.email;
              console.log(`[${requestId}] Resolved host email from auth: ${maskEmail(booking.hostEmail)}`);
            }
          } catch (authErr: any) {
            console.warn(`[${requestId}] Could not fetch host email from auth: ${authErr.message}`);
          }
        }

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
