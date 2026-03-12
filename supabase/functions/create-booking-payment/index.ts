import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

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
      customAnswers,
    } = body;

    log("Request params", { eventTypeId, guestEmail, priceAmount, priceCurrency, hasCustomAnswers: !!customAnswers });

    if (!priceAmount || priceAmount <= 0) {
      throw new Error("Invalid price amount");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://calendarpal.lovable.app";

    // Build metadata — Stripe allows max 500 chars per value
    const metadata: Record<string, string> = {
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
    };

    // Store custom answers as JSON in metadata if they fit
    if (customAnswers && Object.keys(customAnswers).length > 0) {
      const answersJson = JSON.stringify(customAnswers);
      if (answersJson.length <= 500) {
        metadata.customAnswers = answersJson;
      } else {
        // Split across multiple metadata keys (each max 500 chars)
        const chunks: string[] = [];
        for (let i = 0; i < answersJson.length; i += 490) {
          chunks.push(answersJson.slice(i, i + 490));
        }
        for (let i = 0; i < chunks.length && i < 10; i++) {
          metadata[`customAnswers_${i}`] = chunks[i];
        }
        metadata.customAnswers_count = String(chunks.length);
      }
    }

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
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata,
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
