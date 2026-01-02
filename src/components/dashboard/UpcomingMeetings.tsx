import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MoreVertical } from "lucide-react";
import { format, parseISO } from "date-fns";
import { SkeletonMeeting } from "@/components/ui/skeleton-card";
import EmptyState from "@/components/EmptyState";

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  scheduled_date: string;
  start_time: string;
  event_types: {
    title: string;
    duration: number;
  };
}

const UpcomingMeetings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          guest_name,
          guest_email,
          scheduled_date,
          start_time,
          event_types (
            title,
            duration
          )
        `)
        .eq("host_user_id", user?.id)
        .eq("status", "confirmed")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Upcoming Meetings</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonMeeting key={i} />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Upcoming Meetings</h2>
      
      {bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming meetings"
          description="When someone books a meeting with you, it will appear here."
          tip="Share your booking link to start receiving meetings"
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{booking.event_types.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    with {booking.guest_name}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  <span>{format(parseISO(booking.scheduled_date), "MMM d")}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  <span>{booking.start_time}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                  <span>{booking.event_types.duration}min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default UpcomingMeetings;
