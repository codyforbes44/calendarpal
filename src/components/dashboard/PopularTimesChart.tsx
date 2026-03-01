import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM - 7 PM
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PopularTimesChart = () => {
  const { user } = useAuth();
  const [heatmap, setHeatmap] = useState<number[][]>([]);
  const [maxVal, setMaxVal] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.rpc("get_popular_times", {
        p_user_id: user!.id,
      });

      if (error) throw error;

      // Build grid from sparse RPC results
      const grid = DAYS.map(() => HOURS.map(() => 0));
      (data as { day_index: number; hour_index: number; booking_count: number }[])?.forEach(
        (row) => {
          if (
            row.day_index >= 0 &&
            row.day_index < 7 &&
            row.hour_index >= 0 &&
            row.hour_index < HOURS.length
          ) {
            grid[row.day_index][row.hour_index] = Number(row.booking_count);
          }
        }
      );

      const max = Math.max(...grid.flat(), 1);
      setHeatmap(grid);
      setMaxVal(max);
    } catch (error) {
      console.error("Error loading popular times:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityClass = (value: number) => {
    if (value === 0) return "bg-muted";
    const ratio = value / maxVal;
    if (ratio <= 0.25) return "bg-primary/20";
    if (ratio <= 0.5) return "bg-primary/40";
    if (ratio <= 0.75) return "bg-primary/60";
    return "bg-primary/90";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold">Popular Times</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">When your bookings happen</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                {h > 12 ? `${h - 12}p` : h === 12 ? "12p" : `${h}a`}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <span className="w-9 text-xs text-muted-foreground text-right">{day}</span>
              <div className="flex flex-1 gap-0.5">
                {HOURS.map((_, hourIdx) => (
                  <div
                    key={hourIdx}
                    className={cn(
                      "flex-1 aspect-square rounded-sm transition-colors",
                      getIntensityClass(heatmap[dayIdx]?.[hourIdx] || 0)
                    )}
                    title={`${day} ${HOURS[hourIdx]}:00 — ${heatmap[dayIdx]?.[hourIdx] || 0} bookings`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary/90" />
            <span>More</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PopularTimesChart;
