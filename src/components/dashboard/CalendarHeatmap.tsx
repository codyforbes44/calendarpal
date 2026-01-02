import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DayData {
  date: Date;
  count: number;
}

const CalendarHeatmap = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const today = new Date();
      const startDate = startOfWeek(today, { weekStartsOn: 1 });
      
      // Generate next 28 days (4 weeks)
      const days: DayData[] = [];
      for (let i = 0; i < 28; i++) {
        days.push({
          date: addDays(startDate, i),
          count: 0,
        });
      }

      // Fetch bookings for these days
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("scheduled_date")
        .eq("host_user_id", user?.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(addDays(startDate, 27), "yyyy-MM-dd"));

      if (error) throw error;

      // Count bookings per day
      bookings?.forEach((booking) => {
        const bookingDate = new Date(booking.scheduled_date);
        const dayData = days.find((d) => isSameDay(d.date, bookingDate));
        if (dayData) {
          dayData.count++;
        }
      });

      setData(days);
    } catch (error) {
      console.error("Error loading heatmap data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/50";
    if (count === 3) return "bg-primary/70";
    return "bg-primary";
  };

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(data.slice(i * 7, (i + 1) * 7));
  }

  const today = new Date();

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[140px] w-full" />
      </Card>
    );
  }

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabelsMobile = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Upcoming Schedule</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Next 4 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-muted" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-primary/30" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-primary/50" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-primary/70" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="space-y-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayLabels.map((day, i) => (
            <div key={day} className="text-xs text-muted-foreground text-center">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{dayLabelsMobile[i]}</span>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <TooltipProvider>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => (
                <Tooltip key={dayIndex}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "aspect-square rounded-sm transition-colors cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-1",
                        getIntensityClass(day.count),
                        isSameDay(day.date, today) && "ring-2 ring-accent"
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{format(day.date, "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">
                      {day.count} {day.count === 1 ? "booking" : "bookings"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </TooltipProvider>
      </div>
    </Card>
  );
};

export default CalendarHeatmap;
