import { useState, useEffect } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import TimeSlotPicker from "@/components/calendar/TimeSlotPicker";
import { useTimeSlots, convertTo24Hour, calculateEndTime } from "@/hooks/useTimeSlots";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { sendRescheduleEmail } from "@/lib/email-service";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  hostUserId: string;
  eventTypeId: string;
  duration: number;
  eventTitle: string;
  guestName: string;
  guestEmail: string;
  currentDate: string;
  currentStartTime: string;
  onRescheduled: () => void;
  bufferBefore?: number;
  bufferAfter?: number;
}

const RescheduleDialog = ({
  open,
  onOpenChange,
  bookingId,
  hostUserId,
  eventTypeId,
  duration,
  eventTitle,
  guestName,
  guestEmail,
  currentDate,
  currentStartTime,
  onRescheduled,
  bufferBefore = 0,
  bufferAfter = 0,
}: RescheduleDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [rescheduling, setRescheduling] = useState(false);

  const { timeSlots, loading: slotsLoading } = useTimeSlots({
    userId: hostUserId,
    eventTypeId,
    selectedDate,
    duration,
    bufferBefore,
    bufferAfter,
  });

  useEffect(() => {
    if (open && hostUserId) {
      loadAvailableDates();
    }
  }, [open, hostUserId]);

  useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [open]);

  const loadAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("day_of_week")
        .eq("user_id", hostUserId);

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

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    setRescheduling(true);

    try {
      const startTime = convertTo24Hour(selectedTime);
      const endTime = calculateEndTime(startTime, duration);
      const newDate = format(selectedDate, "yyyy-MM-dd");

      const { error } = await supabase
        .from("bookings")
        .update({
          scheduled_date: newDate,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", bookingId);

      if (error) throw error;

      // Fetch host profile for email
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", hostUserId)
        .single();

      // Send reschedule email notification using the email service
      const emailResult = await sendRescheduleEmail(
        {
          id: bookingId,
          guestName,
          guestEmail,
          hostName: hostProfile?.full_name || "Host",
          hostEmail: hostProfile?.email || undefined,
          eventTitle,
          scheduledDate: newDate,
          startTime,
          endTime,
          duration,
        },
        {
          date: currentDate,
          time: currentStartTime,
        }
      );

      if (emailResult.success) {
        toast.success("Booking rescheduled and notifications sent");
      } else {
        toast.success("Booking rescheduled successfully");
        console.warn("Email notification could not be sent:", emailResult.error);
      }
      
      onOpenChange(false);
      onRescheduled();
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      toast.error("Failed to reschedule booking");
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Reschedule ${eventTitle} with ${guestName}`}
      className="sm:max-w-4xl"
    >
      <div className="grid md:grid-cols-[1.5fr,1fr] gap-6 mt-4">
        <div>
          <CalendarGrid
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            availableDates={availableDates}
          />
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          {slotsLoading ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
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
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px]">
            Cancel
          </Button>
          <Button variant="hero" onClick={handleReschedule} disabled={rescheduling} className="min-h-[44px]">
            {rescheduling ? "Rescheduling..." : "Confirm New Time"}
          </Button>
        </div>
      )}
    </ResponsiveModal>
  );
};

export default RescheduleDialog;
