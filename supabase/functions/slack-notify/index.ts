import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SlackNotifyRequest {
  type: "booking_confirmed" | "booking_cancelled" | "booking_rescheduled";
  booking: {
    id: string;
    guestName: string;
    guestEmail: string;
    hostName: string;
    eventTitle: string;
    scheduledDate: string;
    startTime: string;
    duration: number;
    hostTimezone?: string;
  };
  hostUserId: string;
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

function buildSlackMessage(
  type: SlackNotifyRequest["type"],
  booking: SlackNotifyRequest["booking"]
): { text: string; blocks: unknown[] } {
  const emoji =
    type === "booking_confirmed"
      ? "✅"
      : type === "booking_cancelled"
      ? "❌"
      : "🔄";
  const title =
    type === "booking_confirmed"
      ? "New Booking Confirmed"
      : type === "booking_cancelled"
      ? "Booking Cancelled"
      : "Booking Rescheduled";

  const formattedDate = formatDate(booking.scheduledDate);
  const formattedTime = formatTime(booking.startTime);

  const text = `${emoji} ${title}: ${booking.eventTitle} with ${booking.guestName} on ${formattedDate} at ${formattedTime}`;

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: `${emoji} ${title}`, emoji: true },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Event:*\n${booking.eventTitle}` },
        { type: "mrkdwn", text: `*Guest:*\n${booking.guestName}` },
        { type: "mrkdwn", text: `*Date:*\n${formattedDate}` },
        {
          type: "mrkdwn",
          text: `*Time:*\n${formattedTime} (${booking.duration} min)`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📧 ${booking.guestEmail} · Powered by CalendarPal`,
        },
      ],
    },
  ];

  return { text, blocks };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.warn("[slack-notify] LOVABLE_API_KEY not configured — Slack notifications disabled");
      return new Response(
        JSON.stringify({ success: false, reason: "LOVABLE_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
    if (!SLACK_API_KEY) {
      console.warn("[slack-notify] SLACK_API_KEY not configured — Slack notifications disabled");
      return new Response(
        JSON.stringify({ success: false, reason: "SLACK_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, booking, hostUserId }: SlackNotifyRequest = await req.json();
    console.log(`[slack-notify] Processing ${type} for booking ${booking.id}`);

    // Fetch host's Slack preferences
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("slack_notifications_enabled, slack_channel_id, notification_preferences")
      .eq("user_id", hostUserId)
      .single();

    if (profileError) {
      console.error(`[slack-notify] Profile lookup error: ${profileError.message}`);
      return new Response(
        JSON.stringify({ success: false, reason: "Profile not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.slack_notifications_enabled || !profile.slack_channel_id) {
      console.log("[slack-notify] Slack notifications not enabled or no channel set");
      return new Response(
        JSON.stringify({ success: false, reason: "Slack not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification_preferences for Slack-specific toggle
    const prefs = (profile.notification_preferences as Record<string, boolean>) || {};
    const prefKey =
      type === "booking_confirmed"
        ? "slack_booking_created"
        : type === "booking_cancelled"
        ? "slack_booking_cancelled"
        : "slack_booking_rescheduled";

    if (prefs[prefKey] === false) {
      console.log(`[slack-notify] Slack notification for ${prefKey} disabled by user`);
      return new Response(
        JSON.stringify({ success: false, reason: `${prefKey} disabled` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, blocks } = buildSlackMessage(type, booking);

    const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: profile.slack_channel_id,
        text,
        blocks,
        username: "CalendarPal",
        icon_emoji: ":calendar:",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error(`[slack-notify] Slack API error [${response.status}]: ${JSON.stringify(data)}`);
      return new Response(
        JSON.stringify({ success: false, error: data.error || "Slack API error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[slack-notify] Message sent to channel ${profile.slack_channel_id}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[slack-notify] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
