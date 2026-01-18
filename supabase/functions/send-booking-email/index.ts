import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "CalendarPal <onboarding@resend.dev>";

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

// Send email via Resend API with enhanced logging
async function sendEmail(payload: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; content_type: string }[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  console.log(`[Email] Attempting to send email to: ${payload.to.map(maskEmail).join(", ")}`);
  console.log(`[Email] Subject: ${payload.subject}`);
  console.log(`[Email] From: ${payload.from}`);

  if (!RESEND_API_KEY) {
    console.error("[Email] ERROR: RESEND_API_KEY is not configured");
    throw new Error("RESEND_API_KEY is not configured");
  }

  try {
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
      console.error(`[Email] ERROR: Resend API returned status ${response.status}`);
      console.error(`[Email] ERROR Response: ${responseText}`);
      throw new Error(`Resend API error (${response.status}): ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log(`[Email] SUCCESS: Email sent with ID: ${result.id}`);
    return { success: true, id: result.id };
  } catch (error: any) {
    console.error(`[Email] FAILED: ${error.message}`);
    throw error;
  }
}

// Generate ICS calendar file content
function generateICS(booking: EmailRequest["booking"], method: "REQUEST" | "CANCEL" = "REQUEST"): string {
  const formatDate = (dateStr: string, timeStr: string): string => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  };

  const startDateTime = formatDate(booking.scheduledDate, booking.startTime);
  const endDateTime = formatDate(booking.scheduledDate, booking.endTime);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CalendarPal//Booking//EN
CALSCALE:GREGORIAN
METHOD:${method}
BEGIN:VEVENT
UID:booking-${booking.id}@calendarpal.com
DTSTAMP:${timestamp}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${booking.eventTitle} with ${booking.guestName}
DESCRIPTION:Meeting booked via CalendarPal.${booking.meetingLink ? `\\n\\nMeeting Link: ${booking.meetingLink}` : ""}
ORGANIZER;CN=${booking.hostName}:mailto:${booking.hostEmail || "noreply@calendarpal.com"}
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

async function sendConfirmationEmails(booking: EmailRequest["booking"]): Promise<{ guestSent: boolean; hostSent: boolean }> {
  console.log(`[Confirmation] Processing confirmation emails for booking ${booking.id}`);
  console.log(`[Confirmation] Guest: ${maskEmail(booking.guestEmail)}, Host: ${booking.hostEmail ? maskEmail(booking.hostEmail) : "NOT PROVIDED"}`);
  
  const icsContent = generateICS(booking, "REQUEST");
  const icsBase64 = btoa(icsContent);
  
  const formattedDate = formatDate(booking.scheduledDate);
  const formattedTime = formatTime(booking.startTime);
  
  let guestSent = false;
  let hostSent = false;
  
  // Email to guest
  try {
    await sendEmail({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      subject: `Confirmed: Meeting with ${booking.hostName} on ${formattedDate}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">✓ Booking Confirmed</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Hi ${booking.guestName},</p>
          
          <p style="font-size: 16px; color: #374151;">Your meeting has been confirmed! Here are the details:</p>
          
          <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin: 0 0 16px 0; color: #111827;">${booking.eventTitle}</h2>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>📅 Date:</strong> ${formattedDate}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>🕐 Time:</strong> ${formattedTime}${booking.guestTimezone ? ` (${booking.guestTimezone})` : ""}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>⏱️ Duration:</strong> ${booking.duration} minutes
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>👤 Host:</strong> ${booking.hostName}
            </p>
            ${booking.meetingLink ? `<p style="margin: 8px 0; color: #4b5563;"><strong>🔗 Meeting Link:</strong> <a href="${booking.meetingLink}" style="color: #6366f1;">${booking.meetingLink}</a></p>` : ""}
          </div>
          
          ${booking.manageUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${booking.manageUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Manage Booking
            </a>
            <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">Reschedule or cancel if needed</p>
          </div>
          ` : ""}
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Add this event to your calendar using the attached .ics file.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Powered by CalendarPal - Scheduling Made Simple
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "meeting.ics",
          content: icsBase64,
          content_type: "text/calendar",
        },
      ],
    });
    guestSent = true;
    console.log(`[Confirmation] Guest email sent successfully to ${maskEmail(booking.guestEmail)}`);
  } catch (error: any) {
    console.error(`[Confirmation] Failed to send guest email: ${error.message}`);
  }

  // Email to host (if host email provided)
  if (booking.hostEmail) {
    try {
      await sendEmail({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        subject: `New Booking: ${booking.guestName} on ${formattedDate}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1;">📅 New Booking</h1>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Hi ${booking.hostName},</p>
            
            <p style="font-size: 16px; color: #374151;">You have a new booking! Here are the details:</p>
            
            <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 16px 0; color: #111827;">${booking.eventTitle}</h2>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>👤 Guest:</strong> ${booking.guestName} (${booking.guestEmail})
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>📅 Date:</strong> ${formattedDate}
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>🕐 Time:</strong> ${formattedTime}${booking.hostTimezone ? ` (${booking.hostTimezone})` : ""}
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>⏱️ Duration:</strong> ${booking.duration} minutes
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Add this event to your calendar using the attached .ics file.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Powered by CalendarPal - Scheduling Made Simple
            </p>
          </div>
        `,
        attachments: [
          {
            filename: "meeting.ics",
            content: icsBase64,
            content_type: "text/calendar",
          },
        ],
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
    await sendEmail({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
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
            Powered by CalendarPal - Scheduling Made Simple
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
      await sendEmail({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
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
              Powered by CalendarPal - Scheduling Made Simple
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
  const newFormattedTime = formatTime(booking.startTime);
  const oldFormattedDate = formatDate(oldDateTime.date);
  const oldFormattedTime = formatTime(oldDateTime.time);
  
  let guestSent = false;
  let hostSent = false;
  
  // Email to guest
  try {
    await sendEmail({
      from: RESEND_FROM_EMAIL,
      to: [booking.guestEmail],
      subject: `Rescheduled: Meeting with ${booking.hostName} - New time: ${newFormattedDate}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f59e0b;">🔄 Meeting Rescheduled</h1>
          </div>
          
          <p style="font-size: 16px; color: #374151;">Hi ${booking.guestName},</p>
          
          <p style="font-size: 16px; color: #374151;">Your meeting has been rescheduled. Here's the updated information:</p>
          
          <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #ef4444;">Previous Time</p>
            <p style="margin: 4px 0; color: #4b5563; text-decoration: line-through;">${oldFormattedDate}</p>
            <p style="margin: 4px 0; color: #4b5563; text-decoration: line-through;">${oldFormattedTime}</p>
          </div>
          
          <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #22c55e;">✓ New Time</p>
            <h2 style="margin: 0 0 16px 0; color: #111827;">${booking.eventTitle}</h2>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>📅 Date:</strong> ${newFormattedDate}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>🕐 Time:</strong> ${newFormattedTime}${booking.guestTimezone ? ` (${booking.guestTimezone})` : ""}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>⏱️ Duration:</strong> ${booking.duration} minutes
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>👤 Host:</strong> ${booking.hostName}
            </p>
          </div>
          
          ${booking.manageUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${booking.manageUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Manage Booking
            </a>
          </div>
          ` : ""}
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            The attached .ics file will update this event in your calendar.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Powered by CalendarPal - Scheduling Made Simple
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "meeting-updated.ics",
          content: icsBase64,
          content_type: "text/calendar",
        },
      ],
    });
    guestSent = true;
    console.log(`[Reschedule] Guest email sent successfully`);
  } catch (error: any) {
    console.error(`[Reschedule] Failed to send guest email: ${error.message}`);
  }

  // Email to host
  if (booking.hostEmail) {
    try {
      await sendEmail({
        from: RESEND_FROM_EMAIL,
        to: [booking.hostEmail],
        subject: `Rescheduled: Meeting with ${booking.guestName} - New time: ${newFormattedDate}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f59e0b;">🔄 Booking Rescheduled</h1>
            </div>
            
            <p style="font-size: 16px; color: #374151;">Hi ${booking.hostName},</p>
            
            <p style="font-size: 16px; color: #374151;">A booking has been rescheduled:</p>
            
            <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #ef4444;">Previous Time</p>
              <p style="margin: 4px 0; color: #4b5563; text-decoration: line-through;">${oldFormattedDate} at ${oldFormattedTime}</p>
            </div>
            
            <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #22c55e;">✓ New Time</p>
              <h2 style="margin: 0 0 16px 0; color: #111827;">${booking.eventTitle}</h2>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>👤 Guest:</strong> ${booking.guestName} (${booking.guestEmail})
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>📅 Date:</strong> ${newFormattedDate}
              </p>
              <p style="margin: 8px 0; color: #4b5563;">
                <strong>🕐 Time:</strong> ${newFormattedTime}${booking.hostTimezone ? ` (${booking.hostTimezone})` : ""}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              The attached .ics file will update this event in your calendar.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              Powered by CalendarPal - Scheduling Made Simple
            </p>
          </div>
        `,
        attachments: [
          {
            filename: "meeting-updated.ics",
            content: icsBase64,
            content_type: "text/calendar",
          },
        ],
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

    console.log(`[${requestId}] ========== EMAIL RESULT ==========`);
    console.log(`[${requestId}] Guest email sent: ${result.guestSent}`);
    console.log(`[${requestId}] Host email sent: ${result.hostSent}`);
    console.log(`[${requestId}] ===================================`);

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
