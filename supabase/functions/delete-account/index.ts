import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // 1. Cancel any active Stripe subscriptions
    if (stripeKey && user.email) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          logStep("Found Stripe customer", { customerId });
          
          // Cancel all active subscriptions
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
          });
          
          for (const subscription of subscriptions.data) {
            await stripe.subscriptions.cancel(subscription.id);
            logStep("Cancelled subscription", { subscriptionId: subscription.id });
          }
        }
      } catch (stripeError) {
        logStep("Stripe error (continuing)", { error: stripeError });
      }
    }

    // 2. Delete user's bookings (as host)
    const { error: bookingsError } = await supabase
      .from("bookings")
      .delete()
      .eq("host_user_id", user.id);
    
    if (bookingsError) {
      logStep("Error deleting bookings", { error: bookingsError });
    } else {
      logStep("Deleted user bookings");
    }

    // 3. Delete user's event types
    const { error: eventTypesError } = await supabase
      .from("event_types")
      .delete()
      .eq("user_id", user.id);
    
    if (eventTypesError) {
      logStep("Error deleting event types", { error: eventTypesError });
    } else {
      logStep("Deleted event types");
    }

    // 4. Delete user's availability
    const { error: availabilityError } = await supabase
      .from("availability")
      .delete()
      .eq("user_id", user.id);
    
    if (availabilityError) {
      logStep("Error deleting availability", { error: availabilityError });
    } else {
      logStep("Deleted availability");
    }

    // 5. Delete user roles
    const { error: rolesError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", user.id);
    
    if (rolesError) {
      logStep("Error deleting user roles", { error: rolesError });
    } else {
      logStep("Deleted user roles");
    }

    // 6. Delete profile (will cascade via RLS)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.id);
    
    if (profileError) {
      logStep("Error deleting profile", { error: profileError });
    } else {
      logStep("Deleted profile");
    }

    // 7. Delete the user from auth.users
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteUserError) {
      logStep("Error deleting auth user", { error: deleteUserError });
      throw new Error("Failed to delete user account");
    }

    logStep("Account deleted successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
