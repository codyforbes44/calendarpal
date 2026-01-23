import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface ChartData {
  signups: { date: string; count: number }[];
  bookings: { date: string; count: number }[];
  subscriptions: { name: string; value: number; color: string }[];
}

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
  signups: {
    label: "Signups",
    color: "hsl(var(--primary))",
  },
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-2))",
  },
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

export function AdminCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, 13);

        // Generate all dates in range
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        const dateLabels = dateRange.map((d) => format(d, "MMM dd"));

        // Fetch signups data
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());

        // Fetch bookings data
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("created_at")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());

        // Fetch subscription distribution
        const { data: subsData } = await supabase
          .from("profiles")
          .select("subscription_plan");

        // Process signups by date
        const signupsByDate = dateRange.map((date) => {
          const dayStart = startOfDay(date);
          const count =
            profilesData?.filter((p) => {
              const pDate = startOfDay(new Date(p.created_at));
              return pDate.getTime() === dayStart.getTime();
            }).length || 0;
          return { date: format(date, "MMM dd"), count };
        });

        // Process bookings by date
        const bookingsByDate = dateRange.map((date) => {
          const dayStart = startOfDay(date);
          const count =
            bookingsData?.filter((b) => {
              const bDate = startOfDay(new Date(b.created_at));
              return bDate.getTime() === dayStart.getTime();
            }).length || 0;
          return { date: format(date, "MMM dd"), count };
        });

        // Process subscription distribution
        const proCount = subsData?.filter((s) => s.subscription_plan === "pro").length || 0;
        const freeCount = subsData?.filter((s) => s.subscription_plan === "free").length || 0;

        setData({
          signups: signupsByDate,
          bookings: bookingsByDate,
          subscriptions: [
            { name: "Pro", value: proCount, color: COLORS[0] },
            { name: "Free", value: freeCount, color: COLORS[1] },
          ],
        });
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Analytics</CardTitle>
        <CardDescription>Overview of key metrics over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signups" className="space-y-4">
          <TabsList>
            <TabsTrigger value="signups">User Signups</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="signups" className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.signups || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="bookings" className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.bookings || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="subscriptions" className="h-[300px]">
            <div className="flex items-center justify-center h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.subscriptions || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data?.subscriptions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
