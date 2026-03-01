import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendConfirmationEmail } from "@/lib/email-service";

const BookingPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [bookingInfo, setBookingInfo] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      finalizeBooking(sessionId);
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  const finalizeBooking = async (sessionId: string) => {
    try {
      // Call edge function to verify payment and create booking
      const { data, error } = await supabase.functions.invoke("verify-booking-payment", {
        body: { sessionId },
      });

      if (error) throw error;
      if (!data?.booking) throw new Error("No booking data returned");

      setBookingInfo(data.booking);
      setStatus("success");
    } catch (err) {
      console.error("Payment verification error:", err);
      setStatus("error");
      toast.error("Failed to verify payment. Please contact support.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we confirm your booking.
          </p>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn't verify your payment. If you were charged, please contact support.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center animate-scale-in">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Payment & Booking Confirmed!</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was successful and your meeting has been scheduled.
        </p>
        {bookingInfo && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{bookingInfo.scheduledDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{bookingInfo.startTime} - {bookingInfo.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Event: {bookingInfo.eventTitle}</span>
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to you.
        </p>
      </Card>
    </div>
  );
};

export default BookingPaymentSuccess;
