import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin using their JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller JWT and check admin role
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all confirmed bookings with not_sent email status
    const { data: bookings, error: bookingsError } = await serviceClient
      .from("bookings")
      .select(`
        id,
        guest_name,
        guest_email,
        guest_notes,
        scheduled_date,
        start_time,
        end_time,
        status,
        meeting_link,
        host_user_id,
        host_timezone,
        guest_timezone,
        cancellation_token,
        event_type_id,
        event_types (
          id,
          title,
          duration,
          location_type
        )
      `)
      .eq("email_status", "not_sent")
      .eq("status", "confirmed");

    if (bookingsError) {
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, skipped: 0, errors: [], message: "No pending bookings found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all unique host profiles
    const hostIds = [...new Set(bookings.map((b: any) => b.host_user_id))];
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("user_id, full_name, email, timezone")
      .in("user_id", hostIds);

    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

    const supabaseProjectRef = supabaseUrl.replace("https://", "").split(".")[0];
    const sendEmailFunctionUrl = `https://${supabaseProjectRef}.supabase.co/functions/v1/send-booking-email`;

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const booking of bookings as any[]) {
      try {
        const hostProfile = profileMap.get(booking.host_user_id) as any;
        const eventType = booking.event_types as any;

        const emailPayload = {
          type: "booking_confirmed",
          booking: {
            id: booking.id,
            guestName: booking.guest_name,
            guestEmail: booking.guest_email,
            hostName: hostProfile?.full_name || "Host",
            hostEmail: hostProfile?.email || "",
            eventTitle: eventType?.title || "Meeting",
            scheduledDate: booking.scheduled_date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            duration: eventType?.duration || 30,
            guestTimezone: booking.guest_timezone,
            hostTimezone: booking.host_timezone,
            meetingLink: booking.meeting_link,
          },
        };

        const response = await fetch(sendEmailFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
          body: JSON.stringify(emailPayload),
        });

        if (response.ok) {
          sent++;
          console.log(`✓ Email sent for booking ${booking.id}`);
        } else {
          const errText = await response.text();
          failed++;
          const errMsg = `Booking ${booking.id}: HTTP ${response.status} - ${errText}`;
          errors.push(errMsg);
          console.error(`✗ ${errMsg}`);
        }
      } catch (err: any) {
        failed++;
        const errMsg = `Booking ${booking.id}: ${err.message}`;
        errors.push(errMsg);
        console.error(`✗ ${errMsg}`);
      }

      // 200ms delay between sends to respect Resend rate limits
      await sleep(200);
    }

    const result = {
      sent,
      failed,
      skipped: 0,
      total: bookings.length,
      errors,
    };

    console.log(`Bulk email complete: ${sent} sent, ${failed} failed`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("bulk-send-emails error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
