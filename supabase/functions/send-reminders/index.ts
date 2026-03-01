import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") || "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ <noreply@notifications.3bi.io>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Utilities ──────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${masked}@${domain}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

/**
 * Get the short timezone abbreviation (e.g. "CT", "IST") for a given IANA tz string.
 */
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

/**
 * Convert a HH:MM time (stored in `fromTz`) to a display string + abbreviation in `toTz`.
 * Also returns dateDiff: +1 means "next day in toTz", -1 means "previous day".
 */
function convertTimeBetweenZones(
  dateStr: string, // "YYYY-MM-DD" (the date the time is stored for, in fromTz)
  timeStr: string, // "HH:MM"
  fromTz: string,
  toTz: string
): { time: string; abbr: string; dateDiff: number } {
  try {
    const [sh, sm] = timeStr.split(":").map(Number);
    const [sy, smo, sd] = dateStr.split("-").map(Number);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localIso = `${sy}-${pad(smo)}-${pad(sd)}T${pad(sh)}:${pad(sm)}:00`;

    // Step 1: Convert localIso (in fromTz) → UTC milliseconds
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

    // Step 2: Render UTC → toTz
    const toTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: toTz, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(utcMs));

    const abbr =
      new Intl.DateTimeFormat("en-US", { timeZone: toTz, timeZoneName: "short" })
        .formatToParts(new Date(utcMs))
        .find((p) => p.type === "timeZoneName")?.value ?? toTz;

    // Step 3: Detect cross-day difference
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

// ─── ICS Generator ──────────────────────────────────────────────────────────

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
  const toUtcIcsString = (dateStr: string, timeStr: string, tz?: string): string => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, m] = timeStr.split(":").map(Number);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const localIso = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(m)}:00`;

    let utcMs = new Date(localIso).getTime();
    if (tz) {
      try {
        const fmt = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false,
        });
        for (let i = 0; i < 3; i++) {
          const parts = fmt.formatToParts(new Date(utcMs));
          const p: Record<string, number> = {};
          for (const { type, value } of parts) p[type] = Number(value);
          const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
          utcMs = new Date(localIso).getTime() - (rendered - utcMs);
        }
      } catch { /* fall through */ }
    }
    const d2 = new Date(utcMs);
    return `${d2.getUTCFullYear()}${pad(d2.getUTCMonth() + 1)}${pad(d2.getUTCDate())}T${pad(d2.getUTCHours())}${pad(d2.getUTCMinutes())}00Z`;
  };

  const start = toUtcIcsString(booking.scheduledDate, booking.startTime, booking.hostTimezone);
  const end = toUtcIcsString(booking.scheduledDate, booking.endTime, booking.hostTimezone);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BookMe.Bet//Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:booking-${booking.id}@bookme.bet
DTSTAMP:${stamp}
DTSTART:${start}
DTEND:${end}
SUMMARY:${booking.eventTitle} with ${booking.guestName}
DESCRIPTION:24-hour reminder for your upcoming meeting via Bᴏᴏᴋᴍᴇ.ʙᴇᴛ.${booking.meetingLink ? `\\n\\nMeeting Link: ${booking.meetingLink}` : ""}
ORGANIZER;CN=${booking.hostName}:mailto:${booking.hostEmail}
ATTENDEE;CN=${booking.guestName};RSVP=TRUE:mailto:${booking.guestEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

// ─── Shared design system (matches send-booking-email) ──────────────────────

const BRAND_COLOR = "#6366f1";
const AMBER_GRADIENT = "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)";
const LOGO_URL = "https://calendarpal.lovable.app/bookme-logo.png";

function emailLayout(options: {
  preheader: string;
  headerIcon: string;
  headerTitle: string;
  headerGradient: string;
  greeting: string;
  introParagraph: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${options.headerTitle}</title></head>
<body style="margin:0;padding:0;background-color:#f0f0f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">${options.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f5;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="background:${options.headerGradient};border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" width="120" height="auto" style="display:block;margin:0 auto 20px;max-width:120px;">
      <div style="font-size:36px;line-height:1;">${options.headerIcon}</div>
      <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${options.headerTitle}</h1>
    </td></tr>
    <tr><td style="background:#ffffff;padding:36px 32px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <p style="margin:0 0 6px;font-size:17px;font-weight:600;color:#1f2937;">${options.greeting}</p>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">${options.introParagraph}</p>
      ${options.bodyHtml}
      ${options.footerHtml || ""}
    </td></tr>
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

function detailRow(icon: string, label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;vertical-align:top;width:28px;font-size:18px;">${icon}</td>
    <td style="padding:10px 16px;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
      <p style="margin:3px 0 0;font-size:15px;font-weight:600;color:#1f2937;">${value}</p>
    </td>
  </tr>`;
}

function detailsCard(rows: string, borderColor: string = "#f59e0b"): string {
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

function toUtcIso(dateStr: string, timeStr: string, timezone?: string): { google: string; outlook: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const localIso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

  let utcMs = new Date(localIso).getTime();
  if (timezone) {
    try {
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      });
      for (let i = 0; i < 3; i++) {
        const parts = fmt.formatToParts(new Date(utcMs));
        const p: Record<string, number> = {};
        for (const { type, value } of parts) p[type] = Number(value);
        const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
        utcMs = new Date(localIso).getTime() - (rendered - utcMs);
      }
    } catch { /* fallback */ }
  }

  const d = new Date(utcMs);
  const google = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const outlook = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00Z`;
  return { google, outlook };
}

function calendarLinks(params: {
  eventTitle: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  hostTimezone?: string;
  meetingLink?: string;
}): string {
  const tz = params.hostTimezone || "UTC";
  const start = toUtcIso(params.scheduledDate, params.startTime, tz);
  const end = toUtcIso(params.scheduledDate, params.endTime, tz);
  const details = `Meeting: ${params.eventTitle}${params.meetingLink ? `\n\nJoin: ${params.meetingLink}` : ""}`;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(params.eventTitle)}&dates=${start.google}/${end.google}&details=${encodeURIComponent(details)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(params.eventTitle)}&startdt=${encodeURIComponent(start.outlook)}&enddt=${encodeURIComponent(end.outlook)}&body=${encodeURIComponent(details)}`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 6px;">
            <a href="${googleUrl}" target="_blank" style="display:inline-block;background:#ffffff;color:#4285f4;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1.5px solid #4285f4;line-height:1;">
              <img src="https://www.google.com/favicon.ico" width="14" height="14" alt="" style="vertical-align:-2px;margin-right:6px;">Add to Google Calendar
            </a>
          </td>
          <td style="padding:0 6px;">
            <a href="${outlookUrl}" target="_blank" style="display:inline-block;background:#ffffff;color:#0078d4;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;border:1.5px solid #0078d4;line-height:1;">
              <img src="https://outlook.live.com/favicon.ico" width="14" height="14" alt="" style="vertical-align:-2px;margin-right:6px;">Add to Outlook
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

// ─── Email template ─────────────────────────────────────────────────────────

function buildReminderHtml(params: {
  recipientName: string;
  otherPartyName: string;
  otherPartyEmail: string;
  eventTitle: string;
  formattedDate: string;
  primaryTime: string;
  primaryTzAbbr: string;
  secondaryTime: string;
  secondaryTzAbbr: string;
  secondaryLabel: string;
  dateDiff: number;
  duration: number;
  meetingLink?: string;
  manageUrl?: string;
  isGuest: boolean;
  rawScheduledDate: string;
  rawStartTime: string;
  rawEndTime: string;
  rawHostTimezone?: string;
}): string {
  const bodyRows = detailRow("📅", "Date", params.formattedDate)
    + buildTimezoneBlock({
        primaryTime: params.primaryTime,
        primaryTzAbbr: params.primaryTzAbbr,
        secondaryTime: params.secondaryTime,
        secondaryTzAbbr: params.secondaryTzAbbr,
        secondaryLabel: params.secondaryLabel,
        dateDiff: params.dateDiff,
      })
    + detailRow("⏱️", "Duration", `${params.duration} minutes`)
    + detailRow(params.isGuest ? "👤" : "👤", params.isGuest ? "Host" : "Guest",
        params.isGuest ? params.otherPartyName : `${params.otherPartyName} (${params.otherPartyEmail})`);

  const meetingBtn = params.meetingLink ? actionButton("Join Meeting →", params.meetingLink) : "";
  const manageBtn = params.manageUrl && params.isGuest ? secondaryButton("Reschedule or Cancel", params.manageUrl) : "";

  return emailLayout({
    preheader: `Reminder: Your meeting with ${params.otherPartyName} is tomorrow, ${params.formattedDate}.`,
    headerIcon: "⏰",
    headerTitle: "Meeting in 24 Hours",
    headerGradient: AMBER_GRADIENT,
    greeting: `Hi ${params.recipientName},`,
    introParagraph: params.isGuest
      ? `This is your 24-hour reminder for your upcoming meeting with <strong>${params.otherPartyName}</strong>.`
      : `This is your 24-hour reminder for your upcoming meeting with <strong>${params.otherPartyName}</strong> (${params.otherPartyEmail}).`,
    bodyHtml: `
      <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;font-weight:700;">${params.eventTitle}</h2>
      ${detailsCard(bodyRows)}
      ${meetingBtn}
      ${manageBtn}
      ${icsNote("The attached .ics file can be used to update your calendar event.")}
      ${calendarLinks({ eventTitle: params.eventTitle, scheduledDate: params.rawScheduledDate, startTime: params.rawStartTime, endTime: params.rawEndTime, hostTimezone: params.rawHostTimezone, meetingLink: params.meetingLink })}
    `,
  });
}

// ─── Resend helper ───────────────────────────────────────────────────────────

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
): Promise<void> {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.text();
      if (!res.ok) {
        if (res.status >= 400 && res.status < 500 && res.status !== 429)
          throw new Error(`Resend ${res.status}: ${body}`);
        throw new Error(`Resend ${res.status}: ${body}`);
      }
      return;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  throw lastError ?? new Error("Unknown error");
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 23–25 hour window (gives ±1h cron tolerance)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const windowStartDate = windowStart.toISOString().split("T")[0];
    const windowEndDate   = windowEnd.toISOString().split("T")[0];

    console.log(`[Reminders] Scanning ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id, guest_name, guest_email, guest_timezone,
        host_user_id, host_timezone,
        scheduled_date, start_time, end_time, status,
        meeting_link, cancellation_token, reminder_sent,
        event_types ( title, duration ),
        profiles!bookings_host_user_id_profiles_fkey ( full_name, email )
      `)
      .eq("status", "confirmed")
      .eq("reminder_sent", false)
      .gte("scheduled_date", windowStartDate)
      .lte("scheduled_date", windowEndDate);

    if (error) throw error;

    console.log(`[Reminders] ${bookings?.length ?? 0} candidate bookings`);

    let sent = 0, skipped = 0, failed = 0;

    for (const booking of bookings ?? []) {
      try {
        const scheduledDate: string = booking.scheduled_date;
        const startTime: string = booking.start_time.slice(0, 5);
        const endTime: string   = booking.end_time.slice(0, 5);
        const hostTz: string    = booking.host_timezone || "America/New_York";
        const guestTz: string   = booking.guest_timezone || "UTC";

        // Precise UTC check to filter cross-date false positives
        const [sh, sm] = startTime.split(":").map(Number);
        const [sy, smo, sd] = scheduledDate.split("-").map(Number);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const localIso = `${sy}-${pad(smo)}-${pad(sd)}T${pad(sh)}:${pad(sm)}:00`;
        const fromFmt = new Intl.DateTimeFormat("en-US", {
          timeZone: hostTz,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false,
        });
        let utcMs = new Date(localIso).getTime();
        for (let i = 0; i < 3; i++) {
          const parts = fromFmt.formatToParts(new Date(utcMs));
          const p: Record<string, number> = {};
          for (const { type, value } of parts) p[type] = Number(value);
          const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
          utcMs = new Date(localIso).getTime() - (rendered - utcMs);
        }

        if (utcMs < windowStart.getTime() || utcMs > windowEnd.getTime()) {
          console.log(`[Reminders] Booking ${booking.id} outside precise window, skipping`);
          skipped++;
          continue;
        }

        const eventTitle: string = (booking.event_types as any)?.title ?? "Meeting";
        const duration: number   = (booking.event_types as any)?.duration ?? 30;
        const hostName: string   = (booking.profiles as any)?.full_name ?? "Host";
        const hostEmail: string  = (booking.profiles as any)?.email ?? "";

        // Check host's email reminder preference
        let hostReminderEnabled = true;
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("notification_preferences")
            .eq("user_id", booking.host_user_id)
            .single();

          if (profileData?.notification_preferences) {
            const prefs = profileData.notification_preferences as Record<string, boolean>;
            hostReminderEnabled = prefs.email_reminder !== false;
            console.log(`[Reminders] Host email_reminder pref: ${hostReminderEnabled}`);
          }
        } catch (prefErr: any) {
          console.warn(`[Reminders] Could not check email prefs: ${prefErr.message}`);
        }
        const formattedDate      = formatDate(scheduledDate);
        const meetingLink: string | undefined = booking.meeting_link ?? undefined;
        const manageUrl = booking.cancellation_token
          ? `https://bookme.bet/booking/${booking.id}/manage?token=${booking.cancellation_token}`
          : undefined;

        // Host time (stored timezone = host timezone)
        const hostTimeFormatted = formatTime(startTime);
        const hostTzAbbr = getTimezoneAbbr(hostTz);

        // Guest time = host time converted to guest timezone
        const guestConverted = convertTimeBetweenZones(scheduledDate, startTime, hostTz, guestTz);

        const ics = generateReminderICS({
          id: booking.id, scheduledDate, startTime, endTime,
          eventTitle, guestName: booking.guest_name, guestEmail: booking.guest_email,
          hostName, hostEmail, hostTimezone: hostTz, meetingLink,
        });
        const icsBase64 = btoa(ics);
        const attachment = [{ filename: "meeting-reminder.ics", content: icsBase64, content_type: "text/calendar" }];

        let guestSent = false;
        let hostSent  = false;

        // ── Guest email: primary = guest local time, secondary = host time ──
        try {
          await sendEmailWithRetry({
            from: RESEND_FROM_EMAIL,
            to: [booking.guest_email],
            replyTo: hostEmail || undefined,
            subject: `⏰ Reminder: Your meeting tomorrow — ${formattedDate}`,
            html: buildReminderHtml({
              recipientName: booking.guest_name,
              otherPartyName: hostName,
              otherPartyEmail: hostEmail,
              eventTitle,
              formattedDate,
              primaryTime: guestConverted.time,
              primaryTzAbbr: guestConverted.abbr,
              secondaryTime: hostTimeFormatted,
              secondaryTzAbbr: hostTzAbbr,
              secondaryLabel: "Host's time",
              dateDiff: -guestConverted.dateDiff,
              duration,
              meetingLink,
              manageUrl,
              isGuest: true,
              rawScheduledDate: scheduledDate,
              rawStartTime: startTime,
              rawEndTime: endTime,
              rawHostTimezone: hostTz,
            }),
            attachments: attachment,
          });
          guestSent = true;
          console.log(`[Reminders] Guest reminder → ${maskEmail(booking.guest_email)}`);
        } catch (err: any) {
          console.error(`[Reminders] Guest reminder failed for ${booking.id}: ${err.message}`);
        }

        // ── Host email: primary = host local time, secondary = guest time ──
        if (hostEmail && hostReminderEnabled) {
          try {
            await sendEmailWithRetry({
              from: RESEND_FROM_EMAIL,
              to: [hostEmail],
              replyTo: booking.guest_email,
              subject: `⏰ Reminder: ${booking.guest_name}'s meeting tomorrow — ${formattedDate}`,
              html: buildReminderHtml({
                recipientName: hostName,
                otherPartyName: booking.guest_name,
                otherPartyEmail: booking.guest_email,
                eventTitle,
                formattedDate,
                primaryTime: hostTimeFormatted,
                primaryTzAbbr: hostTzAbbr,
                secondaryTime: guestConverted.time,
                secondaryTzAbbr: guestConverted.abbr,
                secondaryLabel: "Guest's time",
                dateDiff: guestConverted.dateDiff,
                duration,
                meetingLink,
                isGuest: false,
                rawScheduledDate: scheduledDate,
                rawStartTime: startTime,
                rawEndTime: endTime,
                rawHostTimezone: hostTz,
              }),
              attachments: attachment,
            });
            hostSent = true;
            console.log(`[Reminders] Host reminder → ${maskEmail(hostEmail)}`);
          } catch (err: any) {
            console.error(`[Reminders] Host reminder failed for ${booking.id}: ${err.message}`);
          }
        }

        if (guestSent || hostSent) {
          await supabase
            .from("bookings")
            .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
            .eq("id", booking.id);
          sent++;
        } else {
          failed++;
        }

        await sleep(200);
      } catch (err: any) {
        console.error(`[Reminders] Error processing booking ${booking.id}: ${err.message}`);
        failed++;
      }
    }

    console.log(`[Reminders] Done — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, skipped, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Reminders] Fatal:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
