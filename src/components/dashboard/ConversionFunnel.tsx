import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MousePointerClick, CalendarCheck } from "lucide-react";

interface FunnelData {
  views: number;
  clicks: number;
  bookings: number;
}

const ConversionFunnel = () => {
  const { user } = useAuth();
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [viewsRes, clicksRes, bookingsRes] = await Promise.all([
        supabase
          .from("booking_page_views")
          .select("id", { count: "exact", head: true })
          .eq("host_user_id", user!.id)
          .eq("step", "page_view")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("booking_page_views")
          .select("id", { count: "exact", head: true })
          .eq("host_user_id", user!.id)
          .eq("step", "time_slot_click")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("host_user_id", user!.id)
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      setData({
        views: viewsRes.count || 0,
        clicks: clicksRes.count || 0,
        bookings: bookingsRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading funnel data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-[120px] w-full" />
      </Card>
    );
  }

  const steps = [
    {
      label: "Page Views",
      value: data?.views || 0,
      icon: Eye,
      rate: null,
    },
    {
      label: "Time Slot Clicks",
      value: data?.clicks || 0,
      icon: MousePointerClick,
      rate: data?.views ? Math.round(((data?.clicks || 0) / data.views) * 100) : 0,
    },
    {
      label: "Bookings",
      value: data?.bookings || 0,
      icon: CalendarCheck,
      rate: data?.clicks ? Math.round(((data?.bookings || 0) / data.clicks) * 100) : 0,
    },
  ];

  const overallRate = data?.views
    ? Math.round(((data?.bookings || 0) / data.views) * 100)
    : 0;

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Conversion Funnel</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Last 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-bold">{overallRate}%</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Overall rate</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const maxVal = Math.max(...steps.map((s) => s.value), 1);
          const width = Math.max((step.value / maxVal) * 100, 4);
          return (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <step.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{step.value}</span>
                  {step.rate !== null && (
                    <span className="text-xs text-muted-foreground">({step.rate}%)</span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${width}%`, opacity: 1 - i * 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ConversionFunnel;
