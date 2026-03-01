import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    log("Event received", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        log("Payment failed", { paymentIntentId: paymentIntent.id });

        const { error } = await supabaseAdmin
          .from("bookings")
          .update({ payment_status: "failed", status: "cancelled" })
          .eq("stripe_payment_id", paymentIntent.id);

        if (error) log("DB update error (payment_failed)", { error: error.message });
        else log("Booking marked as failed/cancelled");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        log("Charge refunded", { chargeId: charge.id, paymentIntentId });

        if (paymentIntentId) {
          const isFullRefund = charge.amount_refunded === charge.amount;
          const newPaymentStatus = isFullRefund ? "refunded" : "partially_refunded";

          const { error } = await supabaseAdmin
            .from("bookings")
            .update({
              payment_status: newPaymentStatus,
              ...(isFullRefund ? { status: "cancelled" } : {}),
            })
            .eq("stripe_payment_id", paymentIntentId);

          if (error) log("DB update error (refunded)", { error: error.message });
          else log("Booking payment status updated", { newPaymentStatus });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("Checkout session expired", { sessionId: session.id });

        // Expired sessions mean the guest never paid — no booking was created
        // by verify-booking-payment, so there's nothing to update in DB.
        // Log for monitoring purposes.
        const meta = session.metadata || {};
        log("Expired session details", {
          guestEmail: meta.guestEmail,
          eventTypeId: meta.eventTypeId,
          scheduledDate: meta.scheduledDate,
        });
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: error instanceof Error && msg.includes("signature") ? 400 : 500,
    });
  }
});
