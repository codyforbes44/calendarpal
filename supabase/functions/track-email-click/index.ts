import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bid");
    const linkType = url.searchParams.get("type");
    const destination = url.searchParams.get("url");

    if (!destination) {
      return new Response("Missing destination URL", { status: 400 });
    }

    // Log the click asynchronously — don't block the redirect
    if (bookingId && linkType) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const userAgent = req.headers.get("user-agent") || null;

      await supabase.from("email_click_events").insert({
        booking_id: bookingId,
        link_type: linkType,
        user_agent: userAgent,
      });
    }

    // 302 redirect to the actual destination
    return new Response(null, {
      status: 302,
      headers: {
        Location: destination,
        "Cache-Control": "no-store, no-cache",
      },
    });
  } catch (err) {
    console.error("[track-email-click] Error:", err);
    // On error, still try to redirect if we have the URL
    const url = new URL(req.url);
    const destination = url.searchParams.get("url");
    if (destination) {
      return new Response(null, { status: 302, headers: { Location: destination } });
    }
    return new Response("Error", { status: 500 });
  }
});
