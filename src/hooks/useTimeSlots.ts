import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, parse, isBefore } from "date-fns";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface UseTimeSlotsParams {
  userId: string;
  eventTypeId: string;
  selectedDate: Date | null;
  duration: number;
  bufferBefore?: number;
  bufferAfter?: number;
}

export const useTimeSlots = ({
  userId,
  eventTypeId,
  selectedDate,
  duration,
  bufferBefore = 0,
  bufferAfter = 0,
}: UseTimeSlotsParams) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate && userId) {
      generateTimeSlots();
    }
  }, [selectedDate, userId, eventTypeId, duration, bufferBefore, bufferAfter]);

  const generateTimeSlots = async () => {
    if (!selectedDate) return;
    setLoading(true);

    try {
      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = selectedDate.getDay();

      // Fetch user's availability for this day
      const { data: availabilityData, error: availError } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .eq("day_of_week", dayOfWeek);

      if (availError) throw availError;

      // If no availability set for this day, return empty
      if (!availabilityData || availabilityData.length === 0) {
        setTimeSlots([]);
        setLoading(false);
        return;
      }

      // Fetch existing bookings for this date with their event type buffer settings
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          start_time, 
          end_time,
          event_types (
            buffer_before,
            buffer_after
          )
        `)
        .eq("host_user_id", userId)
        .eq("scheduled_date", dateStr)
        .neq("status", "cancelled");

      if (bookingsError) throw bookingsError;

      // Generate all possible time slots from availability
      const slots: TimeSlot[] = [];
      const now = new Date();
      const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

      // Total time needed including buffers
      const totalSlotTime = bufferBefore + duration + bufferAfter;

      for (const avail of availabilityData) {
        const startTime = parse(avail.start_time, "HH:mm:ss", selectedDate);
        const endTime = parse(avail.end_time, "HH:mm:ss", selectedDate);

        let currentSlot = startTime;

        while (isBefore(addMinutes(currentSlot, duration), endTime) || 
               format(addMinutes(currentSlot, duration), "HH:mm") === format(endTime, "HH:mm")) {
          const slotTimeStr = format(currentSlot, "HH:mm");
          const slotEndStr = format(addMinutes(currentSlot, duration), "HH:mm");

          // Calculate the full blocked time including buffers for this new slot
          const slotWithBufferStart = format(addMinutes(currentSlot, -bufferBefore), "HH:mm");
          const slotWithBufferEnd = format(addMinutes(currentSlot, duration + bufferAfter), "HH:mm");

          // Check if slot is in the past (for today)
          if (isToday) {
            const slotDateTime = parse(slotTimeStr, "HH:mm", selectedDate);
            if (isBefore(slotDateTime, now)) {
              currentSlot = addMinutes(currentSlot, 30);
              continue;
            }
          }

          // Check if slot conflicts with existing bookings (including their buffers)
          const isBooked = bookingsData?.some((booking: any) => {
            const bookingStart = booking.start_time.slice(0, 5);
            const bookingEnd = booking.end_time.slice(0, 5);
            const existingBufferBefore = booking.event_types?.buffer_before || 0;
            const existingBufferAfter = booking.event_types?.buffer_after || 0;

            // Calculate the blocked time for the existing booking including its buffers
            const [bookingStartHour, bookingStartMin] = bookingStart.split(":").map(Number);
            const [bookingEndHour, bookingEndMin] = bookingEnd.split(":").map(Number);
            
            const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin - existingBufferBefore;
            const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin + existingBufferAfter;
            
            const blockedStart = `${Math.floor(Math.max(0, bookingStartMinutes) / 60).toString().padStart(2, "0")}:${(Math.max(0, bookingStartMinutes) % 60).toString().padStart(2, "0")}`;
            const blockedEnd = `${Math.floor(bookingEndMinutes / 60).toString().padStart(2, "0")}:${(bookingEndMinutes % 60).toString().padStart(2, "0")}`;

            // Check for overlap between new slot (with buffers) and existing blocked time
            return (
              (slotWithBufferStart >= blockedStart && slotWithBufferStart < blockedEnd) ||
              (slotWithBufferEnd > blockedStart && slotWithBufferEnd <= blockedEnd) ||
              (slotWithBufferStart <= blockedStart && slotWithBufferEnd >= blockedEnd)
            );
          });

          // Format for display
          const hour = parseInt(slotTimeStr.split(":")[0]);
          const minute = slotTimeStr.split(":")[1];
          const period = hour >= 12 ? "PM" : "AM";
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const displayTime = `${displayHour}:${minute} ${period}`;

          slots.push({
            time: displayTime,
            available: !isBooked,
          });

          currentSlot = addMinutes(currentSlot, 30);
        }
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error("Error generating time slots:", error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  return { timeSlots, loading };
};

// Helper to convert display time to 24-hour format
export const convertTo24Hour = (displayTime: string): string => {
  const [time, period] = displayTime.split(" ");
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minute}`;
};

// Calculate end time
export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hour, minute] = startTime.split(":").map(Number);
  const totalMinutes = hour * 60 + minute + duration;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
};
