import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function getValidToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenRow } = await supabase
    .from("google_calendar_tokens")
    .select("access_token, refresh_token, token_expires_at, connected")
    .eq("user_id", userId)
    .single();

  if (!tokenRow?.connected || !tokenRow.access_token) return null;

  const expiresAt = new Date(tokenRow.token_expires_at);
  if (expiresAt > new Date(Date.now() + 60000)) return tokenRow.access_token;

  const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ action: "refresh", userId }),
  });

  const refreshData = await refreshResponse.json();
  return refreshData.access_token || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, booking } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accessToken = await getValidToken(supabase, userId);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected or token invalid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: create
    if (action === "create" && booking) {
      const { scheduledDate, startTime, endTime, guestName, guestEmail, eventTitle, meetingLink, hostTimezone } = booking;
      const tz = hostTimezone || "America/New_York";

      const event = {
        summary: `${eventTitle} with ${guestName}`,
        description: `Booking via CalendarPal.\n\nGuest: ${guestName} (${guestEmail})${meetingLink ? `\nMeeting Link: ${meetingLink}` : ""}`,
        start: { dateTime: `${scheduledDate}T${startTime}:00`, timeZone: tz },
        end: { dateTime: `${scheduledDate}T${endTime}:00`, timeZone: tz },
        attendees: [{ email: guestEmail, displayName: guestName }],
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 15 }, { method: "email", minutes: 60 }] },
        extendedProperties: { private: { calendarpal_booking_id: booking.id || "" } },
      };

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Google Calendar create error:", result);
        return new Response(JSON.stringify({ error: "Failed to create calendar event", details: result }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`Google Calendar event created: ${result.id}`);
      return new Response(JSON.stringify({ success: true, eventId: result.id, htmlLink: result.htmlLink }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: delete
    if (action === "delete" && booking) {
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=calendarpal_booking_id%3D${booking.id}`;
      const searchResponse = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const searchResult = await searchResponse.json();

      if (searchResult.items?.length > 0) {
        const eventId = searchResult.items[0].id;
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`, {
          method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log(`Google Calendar event deleted: ${eventId}`);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: update
    if (action === "update" && booking) {
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=calendarpal_booking_id%3D${booking.id}`;
      const searchResponse = await fetch(searchUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const searchResult = await searchResponse.json();

      if (searchResult.items?.length > 0) {
        const eventId = searchResult.items[0].id;
        const tz = booking.hostTimezone || "America/New_York";
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `${booking.eventTitle} with ${booking.guestName}`,
            start: { dateTime: `${booking.scheduledDate}T${booking.startTime}:00`, timeZone: tz },
            end: { dateTime: `${booking.scheduledDate}T${booking.endTime}:00`, timeZone: tz },
          }),
        });
        console.log(`Google Calendar event updated: ${eventId}`);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Google Calendar Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
