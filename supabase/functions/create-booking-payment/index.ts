import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[CREATE-BOOKING-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const body = await req.json();
    const {
      eventTypeId,
      hostUserId,
      scheduledDate,
      startTime,
      endTime,
      guestName,
      guestEmail,
      guestNotes,
      meetingLink,
      guestTimezone,
      hostTimezone,
      priceAmount,
      priceCurrency,
      eventTitle,
    } = body;

    log("Request params", { eventTypeId, guestEmail, priceAmount, priceCurrency });

    if (!priceAmount || priceAmount <= 0) {
      throw new Error("Invalid price amount");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://calendarpal.lovable.app";

    // Create a Stripe Checkout session in payment mode
    const session = await stripe.checkout.sessions.create({
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: priceCurrency || "usd",
            product_data: {
              name: eventTitle || "Booking Session",
              description: `${scheduledDate} at ${startTime}`,
            },
            unit_amount: priceAmount, // already in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        eventTypeId,
        hostUserId,
        scheduledDate,
        startTime,
        endTime,
        guestName,
        guestEmail,
        guestNotes: guestNotes || "",
        meetingLink: meetingLink || "",
        guestTimezone: guestTimezone || "",
        hostTimezone: hostTimezone || "",
      },
      success_url: `${origin}/booking-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book/${body.username || ""}?payment=cancelled`,
    });

    log("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
