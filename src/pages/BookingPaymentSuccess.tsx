import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import BookingConfirmation from "@/components/booking/BookingConfirmation";

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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 sm:p-6">
      <BookingConfirmation
        hostName={bookingInfo?.hostName || null}
        eventTitle={bookingInfo?.eventTitle || "Session"}
        scheduledDate={bookingInfo?.scheduledDate || ""}
        startTime={bookingInfo?.startTime || ""}
        endTime={bookingInfo?.endTime}
        guestTimezone={bookingInfo?.guestTimezone}
        guestEmail={bookingInfo?.guestEmail}
        isPaid
        icsData={bookingInfo?.scheduledDate && bookingInfo?.startTime && bookingInfo?.endTime ? {
          dateISO: bookingInfo.scheduledDate,
          startTime24: bookingInfo.startTime,
          endTime24: bookingInfo.endTime,
          hostTimezone: bookingInfo.hostTimezone || "UTC",
        } : undefined}
      />
    </div>
  );
};

export default BookingPaymentSuccess;
