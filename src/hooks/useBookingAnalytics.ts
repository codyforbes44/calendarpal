import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, subMonths, startOfDay, eachDayOfInterval } from "date-fns";

export type TimeRange = "7d" | "30d" | "90d" | "all";

interface EmailStats {
  sent: number;
  pending: number;
  failed: number;
  opened: number;
  total: number;
  deliveryRate: number;
  openRate: number;
}

interface DailyTrend {
  date: string;
  label: string;
  confirmed: number;
  cancelled: number;
  rescheduled: number;
  total: number;
}

interface BookingAnalyticsData {
  emailStats: EmailStats;
  trends: DailyTrend[];
  statusBreakdown: { name: string; value: number; color: string }[];
}

function getStartDate(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "7d": return subDays(now, 7);
    case "30d": return subDays(now, 30);
    case "90d": return subMonths(now, 3);
    case "all": return null;
  }
}

function getLabelFormat(range: TimeRange): string {
  switch (range) {
    case "7d": return "EEE";
    case "30d": return "MMM dd";
    case "90d": return "MMM dd";
    case "all": return "MMM yy";
  }
}

export function useBookingAnalytics(range: TimeRange, isAdmin = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["booking-analytics", range, isAdmin, user?.id],
    queryFn: async (): Promise<BookingAnalyticsData> => {
      const startDate = getStartDate(range);
      const labelFormat = getLabelFormat(range);

      // Build query
      let query = supabase
        .from("bookings")
        .select("status, email_status, email_opened_at, created_at, scheduled_date");

      if (!isAdmin && user?.id) {
        query = query.eq("host_user_id", user.id);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data: bookings, error } = await query;
      if (error) throw error;

      const allBookings = bookings || [];

      // Email stats
      const emailStats: EmailStats = { sent: 0, pending: 0, failed: 0, opened: 0, total: allBookings.length, deliveryRate: 0, openRate: 0 };
      for (const b of allBookings) {
        if (b.email_status === "sent") emailStats.sent++;
        else if (b.email_status === "failed") emailStats.failed++;
        else emailStats.pending++;
        if (b.email_opened_at) emailStats.opened++;
      }
      emailStats.deliveryRate = emailStats.total > 0 ? Math.round((emailStats.sent / emailStats.total) * 100) : 0;
      emailStats.openRate = emailStats.sent > 0 ? Math.round((emailStats.opened / emailStats.sent) * 100) : 0;

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      for (const b of allBookings) {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      }

      const statusColors: Record<string, string> = {
        confirmed: "hsl(var(--chart-2))",
        cancelled: "hsl(var(--destructive))",
        rescheduled: "hsl(var(--chart-4))",
        completed: "hsl(var(--primary))",
      };

      const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || "hsl(var(--muted-foreground))",
      }));

      // Daily trends
      const effectiveStart = startDate || (allBookings.length > 0
        ? new Date(allBookings.reduce((min, b) => b.created_at < min ? b.created_at : min, allBookings[0].created_at))
        : subDays(new Date(), 30));

      const days = eachDayOfInterval({ start: effectiveStart, end: new Date() });

      // For "all" with many days, aggregate by month
      const shouldAggregateMonthly = range === "all" && days.length > 90;

      const trends: DailyTrend[] = [];

      if (shouldAggregateMonthly) {
        const monthMap = new Map<string, DailyTrend>();
        for (const b of allBookings) {
          const key = format(new Date(b.created_at), "yyyy-MM");
          if (!monthMap.has(key)) {
            monthMap.set(key, {
              date: key,
              label: format(new Date(b.created_at), "MMM yy"),
              confirmed: 0, cancelled: 0, rescheduled: 0, total: 0,
            });
          }
          const entry = monthMap.get(key)!;
          entry.total++;
          if (b.status === "confirmed") entry.confirmed++;
          else if (b.status === "cancelled") entry.cancelled++;
          else if (b.status === "rescheduled") entry.rescheduled++;
        }
        const sorted = Array.from(monthMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        trends.push(...sorted);
      } else {
        const dayMap = new Map<string, DailyTrend>();
        for (const day of days) {
          const key = format(day, "yyyy-MM-dd");
          dayMap.set(key, {
            date: key,
            label: format(day, labelFormat),
            confirmed: 0, cancelled: 0, rescheduled: 0, total: 0,
          });
        }
        for (const b of allBookings) {
          const key = format(startOfDay(new Date(b.created_at)), "yyyy-MM-dd");
          const entry = dayMap.get(key);
          if (entry) {
            entry.total++;
            if (b.status === "confirmed") entry.confirmed++;
            else if (b.status === "cancelled") entry.cancelled++;
            else if (b.status === "rescheduled") entry.rescheduled++;
          }
        }
        trends.push(...Array.from(dayMap.values()));
      }

      return { emailStats, trends, statusBreakdown };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
