import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TimeRange {
  id?: string;
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  dayOfWeek: number;
  enabled: boolean;
  ranges: TimeRange[];
}

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { day: "Monday", dayOfWeek: 1, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Tuesday", dayOfWeek: 2, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Wednesday", dayOfWeek: 3, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Thursday", dayOfWeek: 4, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Friday", dayOfWeek: 5, enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Saturday", dayOfWeek: 6, enabled: false, ranges: [{ start: "10:00", end: "14:00" }] },
  { day: "Sunday", dayOfWeek: 0, enabled: false, ranges: [{ start: "10:00", end: "14:00" }] },
];

export const useAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<DayAvailability[]>(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user?.id)
        .order("day_of_week");

      if (error) throw error;

      if (data && data.length > 0) {
        // Group by day_of_week
        const grouped = data.reduce((acc, item) => {
          const dayIndex = item.day_of_week;
          if (!acc[dayIndex]) {
            acc[dayIndex] = [];
          }
          acc[dayIndex].push({
            id: item.id,
            start: item.start_time.slice(0, 5),
            end: item.end_time.slice(0, 5),
          });
          return acc;
        }, {} as Record<number, TimeRange[]>);

        // Merge with default availability
        const merged = DEFAULT_AVAILABILITY.map((day) => ({
          ...day,
          enabled: grouped[day.dayOfWeek]?.length > 0,
          ranges: grouped[day.dayOfWeek] || [{ start: "09:00", end: "17:00" }],
        }));

        setAvailability(merged);
      }
    } catch (error) {
      console.error("Error loading availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Delete existing availability
      await supabase.from("availability").delete().eq("user_id", user.id);

      // Insert new availability for enabled days
      const inserts = availability
        .filter((day) => day.enabled)
        .flatMap((day) =>
          day.ranges.map((range) => ({
            user_id: user.id,
            day_of_week: day.dayOfWeek,
            start_time: range.start,
            end_time: range.end,
          }))
        );

      if (inserts.length > 0) {
        const { error } = await supabase.from("availability").insert(inserts);
        if (error) throw error;
      }

      toast.success("Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, enabled: !day.enabled } : day))
    );
  };

  const updateTimeRange = (
    dayIndex: number,
    rangeIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    setAvailability((prev) =>
      prev.map((day, i) => {
        if (i === dayIndex) {
          const newRanges = [...day.ranges];
          newRanges[rangeIndex] = { ...newRanges[rangeIndex], [field]: value };
          return { ...day, ranges: newRanges };
        }
        return day;
      })
    );
  };

  const addTimeRange = (dayIndex: number) => {
    setAvailability((prev) =>
      prev.map((day, i) => {
        if (i === dayIndex) {
          return {
            ...day,
            ranges: [...day.ranges, { start: "09:00", end: "17:00" }],
          };
        }
        return day;
      })
    );
  };

  const removeTimeRange = (dayIndex: number, rangeIndex: number) => {
    setAvailability((prev) =>
      prev.map((day, i) => {
        if (i === dayIndex && day.ranges.length > 1) {
          return {
            ...day,
            ranges: day.ranges.filter((_, idx) => idx !== rangeIndex),
          };
        }
        return day;
      })
    );
  };

  return {
    availability,
    loading,
    saving,
    toggleDay,
    updateTimeRange,
    addTimeRange,
    removeTimeRange,
    saveAvailability,
  };
};

// Function to load availability for a specific user (public)
export const loadUserAvailability = async (userId: string) => {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_week");

  if (error) throw error;
  return data;
};
