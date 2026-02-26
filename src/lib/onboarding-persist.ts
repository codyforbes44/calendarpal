import { supabase } from "@/integrations/supabase/client";

interface DayAvailability {
  day: string;
  dayOfWeek: number;
  enabled: boolean;
}

export interface OnboardingPersistData {
  fullName: string;
  username: string;
  eventTitle: string;
  eventDescription: string;
  eventDuration: number;
  availability: DayAvailability[];
  startTime: string;
  endTime: string;
}

/**
 * Persist onboarding data (profile, first event type, availability) to the database.
 * Throws on failure so the caller can handle errors.
 */
export async function persistOnboardingData(
  userId: string,
  data: OnboardingPersistData
): Promise<void> {
  // 1. Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName.trim(),
      username: data.username.trim(),
    })
    .eq("user_id", userId);
  if (profileError) throw profileError;

  // 2. Create event type
  const { error: eventError } = await supabase.from("event_types").insert({
    user_id: userId,
    title: data.eventTitle.trim(),
    description: data.eventDescription.trim() || null,
    duration: data.eventDuration,
    is_active: true,
  });
  if (eventError) throw eventError;

  // 3. Save availability
  const enabledDays = data.availability.filter((d) => d.enabled);
  if (enabledDays.length > 0) {
    await supabase.from("availability").delete().eq("user_id", userId);
    const records = enabledDays.map((day) => ({
      user_id: userId,
      day_of_week: day.dayOfWeek,
      start_time: data.startTime,
      end_time: data.endTime,
    }));
    const { error: availError } = await supabase
      .from("availability")
      .insert(records);
    if (availError) throw availError;
  }
}
