import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string | null;
  bio: string | null;
  subscription_plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  google_calendar_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string;
  username?: string | null;
  timezone?: string;
  avatar_url?: string;
  bio?: string | null;
}

export const profileKeys = {
  all: ["profiles"] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
  byUsername: (username: string) => [...profileKeys.all, "username", username] as const,
};

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: profileKeys.detail(user?.id ?? ""),
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProfileByUsername(username: string | undefined) {
  return useQuery({
    queryKey: profileKeys.byUsername(username ?? ""),
    queryFn: async () => {
      if (!username) throw new Error("Username is required");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username.toLowerCase())
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(user?.id ?? ""), data);
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Username is already taken");
      } else {
        toast.error("Failed to update profile");
      }
    },
  });
}

export function useCheckUsernameAvailability() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!username || username.length < 3) {
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("user_id", user?.id ?? "")
        .maybeSingle();

      if (error) throw error;
      return !data; // true if available
    },
  });
}
