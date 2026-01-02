import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EventType {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration: number;
  color: string;
  is_active: boolean;
  location_type: string | null;
  buffer_before: number;
  buffer_after: number;
  allow_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventTypeInsert {
  title: string;
  description?: string;
  duration: number;
  color?: string;
  is_active?: boolean;
  location_type?: string;
  buffer_before?: number;
  buffer_after?: number;
  allow_recurring?: boolean;
}

export interface EventTypeUpdate extends Partial<EventTypeInsert> {
  id: string;
}

export const eventTypeKeys = {
  all: ["eventTypes"] as const,
  list: (userId: string) => [...eventTypeKeys.all, "list", userId] as const,
  active: (userId: string) => [...eventTypeKeys.all, "active", userId] as const,
  detail: (id: string) => [...eventTypeKeys.all, "detail", id] as const,
  byUser: (userId: string) => [...eventTypeKeys.all, "byUser", userId] as const,
};

export function useEventTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: eventTypeKeys.list(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EventType[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useActiveEventTypes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: eventTypeKeys.active(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EventType[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEventType(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: eventTypeKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) throw new Error("Event type ID is required");

      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data as EventType;
    },
    enabled: !!id && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEventTypesByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: eventTypeKeys.byUser(userId ?? ""),
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EventType[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEventType() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventType: EventTypeInsert) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("event_types")
        .insert({
          ...eventType,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EventType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventTypeKeys.all });
      toast.success("Event type created!");
    },
    onError: () => {
      toast.error("Failed to create event type");
    },
  });
}

export function useUpdateEventType() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EventTypeUpdate) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("event_types")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as EventType;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(eventTypeKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: eventTypeKeys.all });
      toast.success("Event type updated!");
    },
    onError: () => {
      toast.error("Failed to update event type");
    },
  });
}

export function useDeleteEventType() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("event_types")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventTypeKeys.all });
      toast.success("Event type deleted");
    },
    onError: () => {
      toast.error("Failed to delete event type");
    },
  });
}
