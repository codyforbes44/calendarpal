import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import TimeSlotPicker from "@/components/calendar/TimeSlotPicker";
import { useTimeSlots, convertTo24Hour, calculateEndTime } from "@/hooks/useTimeSlots";
import { Calendar, Clock, Video, User, AlertTriangle, Check, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BookingDetails {
  id: string;
  guest_name: string;
  guest_email: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  host_user_id: string;
  event_type_id: string;
  event_types: {
    title: string;
    duration: number;
    color: string;
    location_type: string;
  };
  profiles: {
    full_name: string;
  };
}

const GuestBookingManage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"view" | "reschedule" | "cancelled" | "rescheduled">("view");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Reschedule state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const { timeSlots, loading: slotsLoading } = useTimeSlots({
    userId: booking?.host_user_id || "",
    eventTypeId: booking?.event_type_id || "",
    selectedDate,
    duration: booking?.event_types.duration || 30,
  });

  useEffect(() => {
    if (bookingId && token) {
      loadBooking();
    }
  }, [bookingId, token]);

  useEffect(() => {
    if (booking?.host_user_id) {
      loadAvailableDates();
    }
  }, [booking?.host_user_id]);

  const loadBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          guest_name,
          guest_email,
          scheduled_date,
          start_time,
          end_time,
          status,
          host_user_id,
          event_type_id,
          event_types (
            title,
            duration,
            color,
            location_type
          ),
          profiles:host_user_id (
            full_name
          )
        `)
        .eq("id", bookingId)
        .eq("cancellation_token", token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Booking not found or invalid token");
        return;
      }

      setBooking(data as any);
    } catch (error) {
      console.error("Error loading booking:", error);
      toast.error("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("day_of_week")
        .eq("user_id", booking?.host_user_id);

      if (error) throw error;

      const availableDays = [...new Set(data?.map((d) => d.day_of_week) || [])];
      const dates: Date[] = [];
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (availableDays.includes(date.getDay())) {
          dates.push(date);
        }
      }
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error loading available dates:", error);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id)
        .eq("cancellation_token", token);

      if (error) throw error;

      setAction("cancelled");
      toast.success("Booking cancelled successfully");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const handleReschedule = async () => {
    if (!booking || !selectedDate || !selectedTime) return;
    setRescheduling(true);

    try {
      const startTime = convertTo24Hour(selectedTime);
      const endTime = calculateEndTime(startTime, booking.event_types.duration);

      const { error } = await supabase
        .from("bookings")
        .update({
          scheduled_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", booking.id)
        .eq("cancellation_token", token);

      if (error) throw error;

      setAction("rescheduled");
      toast.success("Booking rescheduled successfully");
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      toast.error("Failed to reschedule booking");
    } finally {
      setRescheduling(false);
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
          <p className="text-muted-foreground">
            This booking doesn't exist or the link has expired.
          </p>
        </Card>
      </div>
    );
  }

  // Cancelled confirmation
  if (action === "cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Cancelled</h1>
          <p className="text-muted-foreground">
            Your meeting with {(booking.profiles as any)?.full_name} has been cancelled.
          </p>
        </Card>
      </div>
    );
  }

  // Rescheduled confirmation
  if (action === "rescheduled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Rescheduled</h1>
          <p className="text-muted-foreground mb-4">
            Your meeting has been rescheduled.
          </p>
          <div className="bg-muted rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>{selectedTime}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Reschedule view
  if (action === "reschedule") {
    return (
      <div className="min-h-screen bg-gradient-subtle py-12 px-6">
        <Card className="max-w-5xl mx-auto overflow-hidden border-border shadow-lg">
          <div className="grid md:grid-cols-[2fr,1fr] divide-x divide-border">
            <div className="p-8 space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setAction("view")} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div>
                <h2 className="text-2xl font-bold mb-2">Reschedule Booking</h2>
                <p className="text-muted-foreground">
                  Select a new date and time for your {booking.event_types.title}
                </p>
              </div>

              <CalendarGrid
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                availableDates={availableDates}
              />
            </div>

            <div className="p-8 bg-muted/30">
              {slotsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <TimeSlotPicker
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                  timeSlots={timeSlots}
                />
              )}

              {selectedDate && selectedTime && (
                <div className="mt-6 pt-6 border-t border-border animate-fade-in">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleReschedule}
                    disabled={rescheduling}
                  >
                    {rescheduling ? "Rescheduling..." : "Confirm New Time"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Already cancelled
  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Cancelled</h1>
          <p className="text-muted-foreground">This booking has already been cancelled.</p>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-6">
      <Card className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Manage Your Booking</h1>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: booking.event_types.color }}
            />
            <div>
              <div className="font-semibold">{booking.event_types.title}</div>
              <div className="text-sm text-muted-foreground">
                with {(booking.profiles as any)?.full_name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{format(parseISO(booking.scheduled_date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-accent" />
              <span>{formatTime(booking.start_time)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{booking.guest_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span>{booking.event_types.duration} min</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setAction("reschedule")}
          >
            Reschedule Booking
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => setShowCancelDialog(true)}
          >
            Cancel Booking
          </Button>
        </div>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {booking.event_types.title} with{" "}
              {(booking.profiles as any)?.full_name} on{" "}
              {format(parseISO(booking.scheduled_date), "MMMM d, yyyy")} at{" "}
              {formatTime(booking.start_time)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GuestBookingManage;
