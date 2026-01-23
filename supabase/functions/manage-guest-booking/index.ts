import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageBookingRequest {
  action: "view" | "cancel" | "reschedule";
  bookingId: string;
  cancellationToken: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MANAGE-GUEST-BOOKING] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ManageBookingRequest = await req.json();
    const { action, bookingId, cancellationToken, newDate, newStartTime, newEndTime } = body;

    logStep("Request received", { action, bookingId });

    if (!bookingId || !cancellationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bookingId and cancellationToken" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate the booking exists and token matches
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        *,
        event_types (
          title,
          duration,
          color
        ),
        profiles:host_user_id (
          full_name,
          email,
          username,
          timezone
        )
      `)
      .eq("id", bookingId)
      .eq("cancellation_token", cancellationToken)
      .single();

    if (fetchError || !booking) {
      logStep("Booking not found or token mismatch", { fetchError });
      return new Response(
        JSON.stringify({ error: "Booking not found or invalid token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    logStep("Booking validated", { bookingId: booking.id, status: booking.status });

    // Check if booking can be modified
    if (booking.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "Cannot modify a cancelled booking" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    switch (action) {
      case "view": {
        logStep("Returning booking details");
        return new Response(
          JSON.stringify({ booking }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "cancel": {
        logStep("Cancelling booking");
        
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", bookingId)
          .eq("cancellation_token", cancellationToken);

        if (updateError) {
          logStep("Cancel failed", { updateError });
          throw new Error("Failed to cancel booking");
        }

        // Send cancellation email
        try {
          await supabase.functions.invoke("send-booking-email", {
            body: {
              type: "cancellation",
              booking: {
                ...booking,
                status: "cancelled"
              }
            }
          });
          logStep("Cancellation email sent");
        } catch (emailError) {
          logStep("Failed to send cancellation email", { emailError });
        }

        return new Response(
          JSON.stringify({ success: true, message: "Booking cancelled successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      case "reschedule": {
        if (!newDate || !newStartTime || !newEndTime) {
          return new Response(
            JSON.stringify({ error: "Missing required fields for reschedule: newDate, newStartTime, newEndTime" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        logStep("Rescheduling booking", { newDate, newStartTime, newEndTime });

        // Check for conflicts
        const { data: conflicts } = await supabase
          .from("bookings")
          .select("id")
          .eq("host_user_id", booking.host_user_id)
          .eq("scheduled_date", newDate)
          .eq("status", "confirmed")
          .neq("id", bookingId)
          .or(`start_time.lt.${newEndTime},end_time.gt.${newStartTime}`);

        if (conflicts && conflicts.length > 0) {
          return new Response(
            JSON.stringify({ error: "Time slot is no longer available" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
          );
        }

        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            scheduled_date: newDate,
            start_time: newStartTime,
            end_time: newEndTime,
            updated_at: new Date().toISOString()
          })
          .eq("id", bookingId)
          .eq("cancellation_token", cancellationToken);

        if (updateError) {
          logStep("Reschedule failed", { updateError });
          throw new Error("Failed to reschedule booking");
        }

        // Send reschedule email
        try {
          await supabase.functions.invoke("send-booking-email", {
            body: {
              type: "reschedule",
              booking: {
                ...booking,
                scheduled_date: newDate,
                start_time: newStartTime,
                end_time: newEndTime
              }
            }
          });
          logStep("Reschedule email sent");
        } catch (emailError) {
          logStep("Failed to send reschedule email", { emailError });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Booking rescheduled successfully",
            newDate,
            newStartTime,
            newEndTime
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: view, cancel, or reschedule" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
