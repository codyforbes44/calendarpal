import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_notes: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  host_user_id: string;
  event_type_id: string;
  host_timezone: string | null;
  guest_timezone: string | null;
  recurrence_pattern: string | null;
  recurrence_count: number | null;
  parent_booking_id: string | null;
  cancellation_token: string | null;
  meeting_link: string | null;
  payment_status: string | null;
  stripe_payment_id: string | null;
  created_at: string;
  updated_at: string;
  event_types: {
    title: string;
    duration: number;
    color: string;
    buffer_before: number;
    buffer_after: number;
  };
}

export interface BookingInsert {
  guest_name: string;
  guest_email: string;
  guest_notes?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  host_user_id: string;
  event_type_id: string;
  host_timezone?: string;
  guest_timezone?: string;
  recurrence_pattern?: string;
  recurrence_count?: number;
  parent_booking_id?: string;
}

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (userId: string) => [...bookingKeys.all, "list", userId] as const,
  upcoming: (userId: string) => [...bookingKeys.all, "upcoming", userId] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
  byToken: (token: string) => [...bookingKeys.all, "token", token] as const,
  stats: (userId: string) => [...bookingKeys.all, "stats", userId] as const,
};

export function useBookings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: bookingKeys.list(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          event_types (
            title,
            duration,
            color,
            buffer_before,
            buffer_after
          )
        `)
        .eq("host_user_id", user.id)
        .order("scheduled_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpcomingBookings(limit = 5) {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: [...bookingKeys.upcoming(user?.id ?? ""), limit],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          event_types (
            title,
            duration,
            color,
            buffer_before,
            buffer_after
          )
        `)
        .eq("host_user_id", user.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useBookingStats() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: bookingKeys.stats(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select("status, scheduled_date")
        .eq("host_user_id", user.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        upcoming: data.filter(
          (b) => b.status === "confirmed" && b.scheduled_date >= today
        ).length,
        completed: data.filter((b) => b.status === "completed").length,
        cancelled: data.filter((b) => b.status === "cancelled").length,
      };

      return stats;
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: string;
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all booking queries
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: () => {
      toast.error("Failed to update booking status");
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      scheduledDate,
      startTime,
      endTime,
    }: {
      bookingId: string;
      scheduledDate: string;
      startTime: string;
      endTime: string;
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          scheduled_date: scheduledDate,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      toast.success("Booking rescheduled successfully!");
    },
    onError: () => {
      toast.error("Failed to reschedule booking");
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: BookingInsert) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: () => {
      toast.error("Failed to create booking");
    },
  });
}
