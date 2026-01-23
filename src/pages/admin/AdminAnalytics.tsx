import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, eachDayOfInterval, startOfDay, subMonths, eachWeekOfInterval, startOfWeek } from "date-fns";
import { TrendingUp, Users, Calendar, Globe } from "lucide-react";

const chartConfig = {
  users: { label: "Users", color: "hsl(var(--primary))" },
  bookings: { label: "Bookings", color: "hsl(var(--chart-2))" },
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    userGrowth: { date: string; users: number; cumulative: number }[];
    bookingsByStatus: { name: string; value: number }[];
    weeklyActivity: { week: string; bookings: number; users: number }[];
    topEventTypes: { name: string; value: number }[];
  } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const endDate = new Date();
        const startDate30 = subDays(endDate, 30);
        const startDate90 = subMonths(endDate, 3);

        // User growth (last 30 days)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", startDate30.toISOString())
          .order("created_at");

        const dateRange = eachDayOfInterval({ start: startDate30, end: endDate });
        let cumulative = 0;
        const userGrowth = dateRange.map((date) => {
          const dayStart = startOfDay(date);
          const count = profiles?.filter((p) => {
            const pDate = startOfDay(new Date(p.created_at));
            return pDate.getTime() === dayStart.getTime();
          }).length || 0;
          cumulative += count;
          return {
            date: format(date, "MMM dd"),
            users: count,
            cumulative,
          };
        });

        // Bookings by status
        const { data: bookings } = await supabase.from("bookings").select("status");
        const statusCounts = bookings?.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const bookingsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }));

        // Weekly activity (last 3 months)
        const weeks = eachWeekOfInterval({ start: startDate90, end: endDate });
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", startDate90.toISOString());

        const { data: allBookings } = await supabase
          .from("bookings")
          .select("created_at")
          .gte("created_at", startDate90.toISOString());

        const weeklyActivity = weeks.slice(-12).map((weekStart) => {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const usersCount = allProfiles?.filter((p) => {
            const d = new Date(p.created_at);
            return d >= weekStart && d < weekEnd;
          }).length || 0;

          const bookingsCount = allBookings?.filter((b) => {
            const d = new Date(b.created_at);
            return d >= weekStart && d < weekEnd;
          }).length || 0;

          return {
            week: format(weekStart, "MMM dd"),
            users: usersCount,
            bookings: bookingsCount,
          };
        });

        // Top event types
        const { data: eventTypes } = await supabase
          .from("event_types")
          .select("id, title");

        const { data: bookingCounts } = await supabase
          .from("bookings")
          .select("event_type_id");

        const eventCounts = bookingCounts?.reduce((acc, b) => {
          acc[b.event_type_id] = (acc[b.event_type_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const topEventTypes = eventTypes
          ?.map((e) => ({
            name: e.title,
            value: eventCounts[e.id] || 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5) || [];

        setData({
          userGrowth,
          bookingsByStatus,
          weeklyActivity,
          topEventTypes,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Deep dive into platform metrics and trends.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{data?.userGrowth.reduce((sum, d) => sum + d.users, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.bookingsByStatus.reduce((sum, d) => sum + d.value, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const completed = data?.bookingsByStatus.find((s) => s.name === "Completed")?.value || 0;
                const total = data?.bookingsByStatus.reduce((sum, d) => sum + d.value, 0) || 1;
                return `${Math.round((completed / total) * 100)}%`;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Completed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Globe className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.topEventTypes.filter((e) => e.value > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">With bookings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth (30 days)</CardTitle>
            <CardDescription>Daily new user signups with cumulative total</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
            <CardDescription>Breakdown of all bookings by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.bookingsByStatus || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data?.bookingsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity (3 months)</CardTitle>
            <CardDescription>Users and bookings per week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.weeklyActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Event Types</CardTitle>
            <CardDescription>Most booked event types</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topEventTypes || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
