import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Get a valid access token, refreshing if needed
async function getValidToken(supabase: any, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("google_access_token, google_refresh_token, google_token_expires_at, google_calendar_connected")
    .eq("user_id", userId)
    .single();

  if (!profile?.google_calendar_connected || !profile.google_access_token) {
    return null;
  }

  const expiresAt = new Date(profile.google_token_expires_at);
  if (expiresAt > new Date(Date.now() + 60000)) {
    return profile.google_access_token;
  }

  // Refresh
  const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
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
    const { userId, date, timezone } = await req.json();

    if (!userId || !date) {
      return new Response(
        JSON.stringify({ error: "userId and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const accessToken = await getValidToken(supabase, userId);

    if (!accessToken) {
      // Calendar not connected — return empty busy times
      return new Response(
        JSON.stringify({ busyTimes: [], connected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tz = timezone || "America/New_York";
    const timeMin = `${date}T00:00:00`;
    const timeMax = `${date}T23:59:59`;

    // Use Google Calendar FreeBusy API
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: new Date(`${timeMin}`).toISOString(),
          timeMax: new Date(`${timeMax}`).toISOString(),
          timeZone: tz,
          items: [{ id: "primary" }],
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Google Calendar FreeBusy error:", result);
      return new Response(
        JSON.stringify({ busyTimes: [], connected: true, error: "Failed to fetch busy times" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const busyTimes = result.calendars?.primary?.busy || [];

    // Convert to simple start/end time strings in HH:mm format
    const formattedBusy = busyTimes.map((b: { start: string; end: string }) => {
      const startDate = new Date(b.start);
      const endDate = new Date(b.end);

      // Format in the host timezone
      const startFormatted = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(startDate);

      const endFormatted = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(endDate);

      return { start: startFormatted, end: endFormatted };
    });

    return new Response(
      JSON.stringify({ busyTimes: formattedBusy, connected: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Google Calendar Busy error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
