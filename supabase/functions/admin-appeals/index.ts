import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface AdminRequest {
  action: "list" | "approve" | "reject";
  appealId?: string;
  reviewerNotes?: string;
  status?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify token and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AdminRequest = await req.json();
    const { action } = body;

    if (action === "list") {
      const statusFilter = body.status || "all";
      
      let query = supabaseAdmin
        .from("geo_block_appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: appeals, error } = await query;

      if (error) {
        console.error("Error fetching appeals:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch appeals" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ appeals }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve" || action === "reject") {
      const { appealId, reviewerNotes } = body;

      if (!appealId) {
        return new Response(
          JSON.stringify({ error: "Appeal ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newStatus = action === "approve" ? "approved" : "rejected";

      // Get appeal details first
      const { data: appeal, error: fetchError } = await supabaseAdmin
        .from("geo_block_appeals")
        .select("*")
        .eq("id", appealId)
        .single();

      if (fetchError || !appeal) {
        return new Response(
          JSON.stringify({ error: "Appeal not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update appeal status
      const { error: updateError } = await supabaseAdmin
        .from("geo_block_appeals")
        .update({
          status: newStatus,
          reviewer_notes: reviewerNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", appealId);

      if (updateError) {
        console.error("Error updating appeal:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update appeal" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send decision email
      if (RESEND_API_KEY) {
        try {
          const isApproved = action === "approve";
          const subject = isApproved 
            ? "Your Access Appeal Has Been Approved - Bookme.bet"
            : "Update on Your Access Appeal - Bookme.bet";

          const htmlContent = isApproved
            ? `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h1 style="color: #22c55e; margin-bottom: 24px;">✓ Appeal Approved!</h1>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    Hi ${appeal.full_name},
                  </p>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    Great news! Your appeal to access Bookme.bet has been approved. You should now be able to access the platform normally.
                  </p>
                  ${reviewerNotes ? `<p style="color: #6b6b6b; font-size: 14px; background: #f5f5f5; padding: 16px; border-radius: 6px;"><strong>Note from reviewer:</strong><br>${reviewerNotes}</p>` : ""}
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://bookme.bet" style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Go to Bookme.bet
                    </a>
                  </div>
                  <p style="color: #4a4a4a; font-size: 14px; margin-top: 24px;">
                    Thank you for your patience!<br>
                    The Bookme.bet Team
                  </p>
                </div>
              </body>
              </html>
            `
            : `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h1 style="color: #1a1a1a; margin-bottom: 24px;">Appeal Update</h1>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    Hi ${appeal.full_name},
                  </p>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    We've reviewed your appeal to access Bookme.bet. Unfortunately, we're unable to approve your request at this time.
                  </p>
                  ${reviewerNotes ? `<p style="color: #6b6b6b; font-size: 14px; background: #f5f5f5; padding: 16px; border-radius: 6px;"><strong>Reason:</strong><br>${reviewerNotes}</p>` : ""}
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    If your circumstances change, you're welcome to submit a new appeal in the future.
                  </p>
                  <p style="color: #4a4a4a; font-size: 14px; margin-top: 24px;">
                    Best regards,<br>
                    The Bookme.bet Team
                  </p>
                </div>
              </body>
              </html>
            `;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `Bookme.bet <${fromEmail}>`,
              to: [appeal.email],
              subject,
              html: htmlContent,
            }),
          });

          console.log(`Decision email sent to ${appeal.email}`);
        } catch (emailError) {
          console.error("Failed to send decision email:", emailError);
          // Continue - the update succeeded
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Appeal ${action}d successfully`,
          status: newStatus 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in admin-appeals function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
