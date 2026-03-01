import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF pixel
const PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));

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

    if (bookingId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Only set email_opened_at if it hasn't been set yet (first open)
      await supabase
        .from("bookings")
        .update({ email_opened_at: new Date().toISOString() })
        .eq("id", bookingId)
        .is("email_opened_at", null);
    }
  } catch (err) {
    console.error("[track-email-open] Error:", err);
  }

  // Always return the pixel regardless of errors
  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});
