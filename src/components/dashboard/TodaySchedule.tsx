import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, CheckCircle2, Calendar } from "lucide-react";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface TodayBooking {
  id: string;
  guest_name: string;
  start_time: string;
  end_time: string;
  status: string;
  event_types: {
    title: string;
    duration: number;
    color: string | null;
  };
}

const formatTime = (time: string): string => {
  if (!time) return "";
  // Handle "HH:MM:SS" or "HH:MM" format
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
};

const TodaySchedule = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodayBookings();
    }
  }, [user]);

  const loadTodayBookings = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          guest_name,
          start_time,
          end_time,
          status,
          event_types (
            title,
            duration,
            color
          )
        `)
        .eq("host_user_id", user?.id)
        .eq("scheduled_date", today)
        .in("status", ["confirmed", "completed"])
        .order("start_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading today's bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const start = parseISO(`${today}T${startTime}`);
    const end = parseISO(`${today}T${endTime}`);

    if (isBefore(now, start)) return "upcoming";
    if (isAfter(now, end)) return "past";
    return "current";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Today's Schedule</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {bookings.length} {bookings.length === 1 ? "meeting" : "meetings"}
        </Badge>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
          <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/50 mb-2 sm:mb-3" />
          <p className="text-sm text-muted-foreground">No meetings today</p>
          <p className="text-xs text-muted-foreground mt-1">Enjoy your free time!</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-border" />

          <div className="space-y-3 sm:space-y-4">
            {bookings.map((booking) => {
              const timeStatus = getTimeStatus(booking.start_time, booking.end_time);
              const isPast = timeStatus === "past" || booking.status === "completed";
              const isCurrent = timeStatus === "current";

              return (
                <div key={booking.id} className="relative flex gap-3 sm:gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 w-4 h-4 rounded-full border-2 mt-1 shrink-0",
                      isPast && "bg-muted border-muted-foreground/30",
                      isCurrent && "bg-accent border-accent animate-pulse",
                      !isPast && !isCurrent && "bg-background border-primary"
                    )}
                  >
                    {isPast && (
                      <CheckCircle2 className="w-3 h-3 text-muted-foreground absolute -top-0.5 -left-0.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 p-2.5 sm:p-3 rounded-lg border transition-colors min-w-0",
                      isPast && "bg-muted/50 border-muted",
                      isCurrent && "bg-accent/10 border-accent",
                      !isPast && !isCurrent && "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate text-sm sm:text-base",
                          isPast && "text-muted-foreground"
                        )}>
                          {booking.event_types.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">{booking.guest_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
                      </div>
                    </div>
                    {isCurrent && (
                      <Badge className="mt-2 bg-accent text-accent-foreground text-xs">
                        In progress
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TodaySchedule;
