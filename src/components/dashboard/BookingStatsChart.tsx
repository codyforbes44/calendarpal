import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface DailyStats {
  date: string;
  bookings: number;
  label: string;
}

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const BookingStatsChart = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      // Get all days in range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Fetch bookings for the last 7 days
      const { data, error } = await supabase
        .from("bookings")
        .select("scheduled_date, created_at")
        .eq("host_user_id", user?.id)
        .gte("created_at", startOfDay(startDate).toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      // Count bookings per day
      const bookingCounts = new Map<string, number>();
      data?.forEach((booking) => {
        const day = format(new Date(booking.created_at), "yyyy-MM-dd");
        bookingCounts.set(day, (bookingCounts.get(day) || 0) + 1);
      });

      // Create stats array with all days
      const dailyStats: DailyStats[] = days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        return {
          date: dateKey,
          label: format(day, "EEE"),
          bookings: bookingCounts.get(dateKey) || 0,
        };
      });

      setStats(dailyStats);
    } catch (error) {
      console.error("Error loading booking stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalBookings = stats.reduce((sum, day) => sum + day.bookings, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Booking Activity</h2>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{totalBookings}</p>
          <p className="text-sm text-muted-foreground">New bookings</p>
        </div>
      </div>
      
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="label" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            allowDecimals={false}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          />
          <Bar 
            dataKey="bookings" 
            fill="hsl(var(--primary))" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
};

export default BookingStatsChart;
