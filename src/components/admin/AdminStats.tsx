import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Calendar,
  Crown,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalBookings: number;
  proSubscribers: number;
  pendingAppeals: number;
  completedBookings: number;
  newUsersThisWeek: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch total bookings
        const { count: totalBookings } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true });

        // Fetch pro subscribers
        const { count: proSubscribers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("subscription_plan", "pro");

        // Fetch pending appeals
        const { data: appealsData } = await supabase.functions.invoke(
          "admin-appeals",
          {
            body: { action: "list", status: "verified" },
          }
        );

        // Fetch completed bookings
        const { count: completedBookings } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed");

        // Fetch new users this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const { count: newUsersThisWeek } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneWeekAgo.toISOString());

        setStats({
          totalUsers: totalUsers || 0,
          totalBookings: totalBookings || 0,
          proSubscribers: proSubscribers || 0,
          pendingAppeals: appealsData?.appeals?.length || 0,
          completedBookings: completedBookings || 0,
          newUsersThisWeek: newUsersThisWeek || 0,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: `+${stats?.newUsersThisWeek || 0} this week`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: Calendar,
      description: "All time",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pro Subscribers",
      value: stats?.proSubscribers || 0,
      icon: Crown,
      description: "Active subscriptions",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Pending Appeals",
      value: stats?.pendingAppeals || 0,
      icon: AlertTriangle,
      description: "Awaiting review",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Completed Bookings",
      value: stats?.completedBookings || 0,
      icon: CheckCircle,
      description: "Successfully completed",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Growth Rate",
      value: stats?.totalUsers
        ? `${Math.round((stats.newUsersThisWeek / stats.totalUsers) * 100)}%`
        : "0%",
      icon: TrendingUp,
      description: "Weekly user growth",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
