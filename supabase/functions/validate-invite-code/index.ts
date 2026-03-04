import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, action, userId } = await req.json();

    if (!code || typeof code !== "string" || code.length < 4 || code.length > 20) {
      return new Response(
        JSON.stringify({ valid: false, reason: "invalid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the code
    const { data: invite, error } = await supabase
      .from("invitation_codes")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      return new Response(
        JSON.stringify({ valid: false, reason: "error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!invite) {
      return new Response(
        JSON.stringify({ valid: false, reason: "not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invite.used_by) {
      return new Response(
        JSON.stringify({ valid: false, reason: "already_used" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, reason: "expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If action is "redeem", mark it as used
    if (action === "redeem" && userId) {
      const { error: updateError } = await supabase
        .from("invitation_codes")
        .update({ used_by: userId, used_at: new Date().toISOString() })
        .eq("id", invite.id);

      if (updateError) {
        console.error("Redeem error:", updateError);
        return new Response(
          JSON.stringify({ valid: false, reason: "redeem_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ valid: false, reason: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
