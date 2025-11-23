import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Mail, User, Search, MoreVertical } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_notes: string | null;
  scheduled_date: string;
  start_time: string;
  status: string;
  event_types: {
    title: string;
    duration: number;
    color: string;
  };
}

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          guest_name,
          guest_email,
          guest_notes,
          scheduled_date,
          start_time,
          status,
          event_types (
            title,
            duration,
            color
          )
        `)
        .eq("host_user_id", user?.id)
        .order("scheduled_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.event_types.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Bookings</h1>
          <p className="text-muted-foreground">View and manage your scheduled meetings</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by guest name, email, or event type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </Card>

        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No bookings found" : "No bookings yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search"
                : "Your scheduled meetings will appear here"}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: booking.event_types.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {booking.event_types.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(booking.scheduled_date), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.start_time} ({booking.event_types.duration}min)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{booking.guest_name}</div>
                      <div className="text-xs text-muted-foreground">Guest</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{booking.guest_email}</div>
                      <div className="text-xs text-muted-foreground">Email</div>
                    </div>
                  </div>

                  {booking.guest_notes && (
                    <div className="sm:col-span-2 mt-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {booking.guest_notes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
