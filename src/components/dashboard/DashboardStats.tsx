import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, TrendingUp } from "lucide-react";

const DashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    activeEventTypes: 0,
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Get total bookings
      const { count: totalCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("host_user_id", user?.id);

      // Get upcoming bookings
      const today = new Date().toISOString().split("T")[0];
      const { count: upcomingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("host_user_id", user?.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", today);

      // Get completed bookings
      const { count: completedCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("host_user_id", user?.id)
        .eq("status", "completed");

      // Get active event types
      const { count: eventTypesCount } = await supabase
        .from("event_types")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("is_active", true);

      setStats({
        totalBookings: totalCount || 0,
        upcomingBookings: upcomingCount || 0,
        completedBookings: completedCount || 0,
        activeEventTypes: eventTypesCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Upcoming",
      value: stats.upcomingBookings,
      icon: Clock,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Completed",
      value: stats.completedBookings,
      icon: CheckCircle,
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "Active Events",
      value: stats.activeEventTypes,
      icon: TrendingUp,
      color: "bg-blue-500/10 text-blue-600",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.title}</div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
