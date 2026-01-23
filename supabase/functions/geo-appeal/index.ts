import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppealRequest {
  action: "submit" | "verify" | "check_status";
  email?: string;
  fullName?: string;
  countryCode?: string;
  reason?: string;
  token?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AppealRequest = await req.json();
    const { action } = body;

    if (action === "submit") {
      const { email, fullName, countryCode, reason } = body;

      if (!email || !fullName || !countryCode || !reason) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for existing pending appeal
      const { data: existing } = await supabase
        .from("geo_block_appeals")
        .select("id, status")
        .eq("email", email.toLowerCase())
        .in("status", ["pending", "email_sent", "verified"])
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ 
            error: "You already have a pending appeal. Please check your email for the verification link.",
            existingAppeal: true 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new appeal
      const { data: appeal, error: insertError } = await supabase
        .from("geo_block_appeals")
        .insert({
          email: email.toLowerCase(),
          full_name: fullName,
          country_code: countryCode,
          reason: reason,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating appeal:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to submit appeal" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send verification email
      if (RESEND_API_KEY) {
        try {
          const verifyUrl = `${req.headers.get("origin") || "https://calendarpal.lovable.app"}/appeal/verify?token=${appeal.verification_token}`;

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `CalendarPal <${fromEmail}>`,
              to: [email],
              subject: "Verify Your Access Appeal - CalendarPal",
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Verify Your Appeal</h1>
                    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      Hi ${fullName},
                    </p>
                    <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      We received your appeal requesting access to CalendarPal. To proceed with your request, please verify your email address by clicking the button below.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${verifyUrl}" style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Verify Email Address
                      </a>
                    </div>
                    <p style="color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${verifyUrl}" style="color: #6366f1; word-break: break-all;">${verifyUrl}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
                    <p style="color: #6b6b6b; font-size: 14px;">
                      After verification, our team will review your appeal and respond within 2-3 business days.
                    </p>
                    <p style="color: #6b6b6b; font-size: 14px;">
                      If you didn't submit this appeal, you can safely ignore this email.
                    </p>
                    <p style="color: #4a4a4a; font-size: 14px; margin-top: 24px;">
                      Best regards,<br>
                      The CalendarPal Team
                    </p>
                  </div>
                </body>
                </html>
              `,
            }),
          });

          if (emailRes.ok) {
            // Update status to email_sent
            await supabase
              .from("geo_block_appeals")
              .update({ status: "email_sent" })
              .eq("id", appeal.id);

            console.log("Verification email sent to:", email);
          } else {
            console.error("Failed to send email:", await emailRes.text());
          }
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // Continue anyway - appeal is created
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Appeal submitted. Please check your email to verify.",
          appealId: appeal.id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      const { token } = body;

      if (!token) {
        return new Response(
          JSON.stringify({ error: "Missing verification token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: appeal, error: findError } = await supabase
        .from("geo_block_appeals")
        .select("*")
        .eq("verification_token", token)
        .single();

      if (findError || !appeal) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired verification link" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (appeal.status === "verified" || appeal.status === "approved") {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Your email has already been verified.",
            status: appeal.status 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update to verified
      const { error: updateError } = await supabase
        .from("geo_block_appeals")
        .update({ 
          status: "verified", 
          verified_at: new Date().toISOString() 
        })
        .eq("id", appeal.id);

      if (updateError) {
        console.error("Error verifying appeal:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to verify appeal" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email verified successfully. Our team will review your appeal within 2-3 business days.",
          status: "verified"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_status") {
      const { email, token } = body;

      let query = supabase.from("geo_block_appeals").select("status, created_at, verified_at, reviewed_at");
      
      if (token) {
        query = query.eq("verification_token", token);
      } else if (email) {
        query = query.eq("email", email.toLowerCase()).order("created_at", { ascending: false }).limit(1);
      } else {
        return new Response(
          JSON.stringify({ error: "Email or token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: appeal, error } = await query.single();

      if (error || !appeal) {
        return new Response(
          JSON.stringify({ error: "No appeal found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          status: appeal.status,
          createdAt: appeal.created_at,
          verifiedAt: appeal.verified_at,
          reviewedAt: appeal.reviewed_at
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in geo-appeal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
