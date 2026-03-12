import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[VERIFY-BOOKING-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

/** Reconstruct custom answers from Stripe metadata (may be split across keys) */
function extractCustomAnswers(meta: Record<string, string>): Record<string, unknown> | null {
  // Single key
  if (meta.customAnswers) {
    try { return JSON.parse(meta.customAnswers); } catch { return null; }
  }
  // Chunked keys
  const countStr = meta.customAnswers_count;
  if (!countStr) return null;
  const count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0) return null;
  let combined = "";
  for (let i = 0; i < count; i++) {
    combined += meta[`customAnswers_${i}`] || "";
  }
  try { return JSON.parse(combined); } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing session_id");

    log("Verifying session", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    log("Payment verified", { paymentStatus: session.payment_status });

    const meta = (session.metadata || {}) as Record<string, string>;
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if booking already exists for this session (idempotency)
    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("stripe_payment_id", session.payment_intent as string)
      .maybeSingle();

    if (existing) {
      log("Booking already exists", { bookingId: existing.id });
      return new Response(
        JSON.stringify({
          booking: {
            id: existing.id,
            scheduledDate: meta.scheduledDate,
            startTime: meta.startTime,
            endTime: meta.endTime,
            eventTitle: "Session",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        host_user_id: meta.hostUserId,
        event_type_id: meta.eventTypeId,
        scheduled_date: meta.scheduledDate,
        start_time: meta.startTime,
        end_time: meta.endTime,
        guest_name: meta.guestName,
        guest_email: meta.guestEmail,
        guest_notes: meta.guestNotes || null,
        meeting_link: meta.meetingLink || null,
        status: "confirmed",
        host_timezone: meta.hostTimezone || null,
        guest_timezone: meta.guestTimezone || null,
        payment_status: "paid",
        stripe_payment_id: session.payment_intent as string,
      })
      .select("id, cancellation_token")
      .single();

    if (bookingError) throw bookingError;
    log("Booking created", { bookingId: booking.id });

    // Save custom question answers if present
    const customAnswers = extractCustomAnswers(meta);
    if (customAnswers && Object.keys(customAnswers).length > 0) {
      // Fetch question IDs for this event type to validate
      const { data: questions } = await supabaseAdmin
        .from("booking_questions")
        .select("id")
        .eq("event_type_id", meta.eventTypeId);

      const validQuestionIds = new Set((questions || []).map((q: { id: string }) => q.id));
      
      const answerRows = Object.entries(customAnswers)
        .filter(([qId]) => validQuestionIds.has(qId))
        .filter(([, val]) => {
          if (val === undefined || val === null) return false;
          if (typeof val === "string" && !val.trim()) return false;
          if (Array.isArray(val) && val.length === 0) return false;
          return true;
        })
        .map(([qId, val]) => ({
          booking_id: booking.id,
          question_id: qId,
          answer: val,
        }));

      if (answerRows.length > 0) {
        const { error: answerError } = await supabaseAdmin
          .from("booking_answers")
          .insert(answerRows);
        if (answerError) {
          log("Failed to save custom answers (non-blocking)", { error: answerError.message });
        } else {
          log("Custom answers saved", { count: answerRows.length });
        }
      }
    }

    // Send confirmation email via existing function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const { data: hostProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", meta.hostUserId)
      .single();

    const { data: eventType } = await supabaseAdmin
      .from("event_types")
      .select("title, duration")
      .eq("id", meta.eventTypeId)
      .single();

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          type: "confirmation",
          bookingId: booking.id,
          guestName: meta.guestName,
          guestEmail: meta.guestEmail,
          hostName: hostProfile?.full_name || "Host",
          hostEmail: hostProfile?.email,
          eventTitle: eventType?.title || "Session",
          scheduledDate: meta.scheduledDate,
          startTime: meta.startTime,
          endTime: meta.endTime,
          duration: eventType?.duration || 30,
          guestTimezone: meta.guestTimezone,
          hostTimezone: meta.hostTimezone,
        }),
      });
    } catch (emailErr) {
      log("Email send failed (non-blocking)", { error: String(emailErr) });
    }

    return new Response(
      JSON.stringify({
        booking: {
          id: booking.id,
          scheduledDate: meta.scheduledDate,
          startTime: meta.startTime,
          endTime: meta.endTime,
          eventTitle: eventType?.title || "Session",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
