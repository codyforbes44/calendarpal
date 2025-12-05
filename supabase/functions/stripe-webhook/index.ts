import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature) {
    console.error("No signature found");
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(body);
      console.warn("Webhook secret not configured - skipping signature verification");
    }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errMessage);
    return new Response(`Webhook Error: ${errMessage}`, { status: 400 });
  }

  console.log("Processing webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);
        
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId = subscription.metadata.supabase_user_id;
          
          if (userId) {
            console.log("Updating user subscription:", userId);
            const { error } = await supabaseAdmin
              .from("profiles")
              .update({
                subscription_plan: "pro",
                stripe_subscription_id: session.subscription as string,
              })
              .eq("user_id", userId);
            
            if (error) {
              console.error("Error updating profile:", error);
            } else {
              console.log("Profile updated to pro plan");
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;
        
        if (userId) {
          const plan = subscription.status === "active" ? "pro" : "free";
          console.log("Subscription updated for user:", userId, "new plan:", plan);
          
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_plan: plan })
            .eq("user_id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;
        
        if (userId) {
          console.log("Subscription cancelled for user:", userId);
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_plan: "free",
              stripe_subscription_id: null,
            })
            .eq("user_id", userId);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
