import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  redirectTo?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RESET-PASSWORD] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body: ResetPasswordRequest = await req.json();
    const { email, redirectTo } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Sending password reset email", { email });

    const origin = req.headers.get("origin") || "https://calendarpal.lovable.app";
    const resetRedirectTo = redirectTo || `${origin}/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectTo,
    });

    if (error) {
      logStep("Reset password error", { error: error.message });
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists with this email, a reset link has been sent." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Password reset email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "If an account exists with this email, a reset link has been sent." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
