import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, Calendar, AlertTriangle, Crown } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "signup" | "booking" | "appeal" | "subscription";
  message: string;
  timestamp: string;
}

const iconMap = {
  signup: UserPlus,
  booking: Calendar,
  appeal: AlertTriangle,
  subscription: Crown,
};

const colorMap = {
  signup: "text-blue-500 bg-blue-500/10",
  booking: "text-green-500 bg-green-500/10",
  appeal: "text-orange-500 bg-orange-500/10",
  subscription: "text-yellow-500 bg-yellow-500/10",
};

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const allActivities: ActivityItem[] = [];

        // Fetch recent signups
        const { data: signups } = await supabase
          .from("profiles")
          .select("id, full_name, email, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        signups?.forEach((signup) => {
          allActivities.push({
            id: `signup-${signup.id}`,
            type: "signup",
            message: `New user: ${signup.full_name || signup.email}`,
            timestamp: signup.created_at,
          });
        });

        // Fetch recent bookings
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, guest_name, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        bookings?.forEach((booking) => {
          allActivities.push({
            id: `booking-${booking.id}`,
            type: "booking",
            message: `New booking from ${booking.guest_name}`,
            timestamp: booking.created_at,
          });
        });

        // Fetch recent appeals
        const { data: appealsResponse } = await supabase.functions.invoke(
          "admin-appeals",
          {
            body: { action: "list" },
          }
        );

        appealsResponse?.appeals?.slice(0, 5).forEach((appeal: any) => {
          allActivities.push({
            id: `appeal-${appeal.id}`,
            type: "appeal",
            message: `Appeal from ${appeal.full_name} (${appeal.country_code})`,
            timestamp: appeal.created_at,
          });
        });

        // Sort by timestamp
        allActivities.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(allActivities.slice(0, 10));
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Latest platform events</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 px-4 pb-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = iconMap[activity.type];
                const colors = colorMap[activity.type];
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className={`p-2 rounded-full ${colors}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
