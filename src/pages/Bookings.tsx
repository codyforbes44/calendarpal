import { useState } from "react";
import { useBookings, useUpdateBookingStatus, Booking } from "@/hooks/useBookings";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Calendar,
  Clock,
  Mail,
  User,
  Search,
  Globe,
  Repeat,
  ChevronDown,
  ChevronUp,
  List,
  CalendarDays,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import BookingActionsDropdown from "@/components/booking/BookingActionsDropdown";
import RescheduleDialog from "@/components/booking/RescheduleDialog";
import BookingsCalendarView from "@/components/booking/BookingsCalendarView";
import BookingDetailModal from "@/components/booking/BookingDetailModal";
import { getTimezoneLabel } from "@/lib/timezones";
import { SkeletonBooking } from "@/components/ui/skeleton-card";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

type ViewMode = "list" | "calendar";

const Bookings = () => {
  const { data: bookings = [], isLoading, refetch } = useBookings();
  const updateStatus = useUpdateBookingStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Group bookings by series
  const groupedBookings = () => {
    const parentBookings: Booking[] = [];
    const childBookingsMap = new Map<string, Booking[]>();

    bookings.forEach((booking) => {
      if (booking.parent_booking_id) {
        const children = childBookingsMap.get(booking.parent_booking_id) || [];
        children.push(booking);
        childBookingsMap.set(booking.parent_booking_id, children);
      } else {
        parentBookings.push(booking);
      }
    });

    return { parentBookings, childBookingsMap };
  };

  const { parentBookings, childBookingsMap } = groupedBookings();

  const filteredBookings = parentBookings.filter(
    (booking) =>
      booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.event_types.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For calendar view, include all bookings (not just parents)
  const allFilteredBookings = bookings.filter(
    (booking) =>
      booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.event_types.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSeriesExpanded = (bookingId: string) => {
    setExpandedSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

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

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status: "cancelled" });
      toast.success("Booking cancelled successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status: "completed" });
      toast.success("Booking marked as completed");
      refetch();
    } catch (error) {
      toast.error("Failed to complete booking");
    }
  };

  if (isLoading) {
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
              <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
            </div>
          </Card>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-0 overflow-hidden">
                <SkeletonBooking />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Bookings</h1>
            <p className="text-muted-foreground">View and manage your scheduled meetings</p>
          </div>
          
          {/* View toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="bg-muted p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem
              value="calendar"
              aria-label="Calendar view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar
            </ToggleGroupItem>
          </ToggleGroup>
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

        {viewMode === "calendar" ? (
          <BookingsCalendarView
            bookings={allFilteredBookings}
            currentMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            onBookingClick={handleBookingClick}
          />
        ) : filteredBookings.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={Calendar}
              title={searchTerm ? "No bookings found" : "No bookings yet"}
              description={
                searchTerm
                  ? "Try adjusting your search terms"
                  : "Your scheduled meetings will appear here when someone books with you."
              }
              actionLabel={searchTerm ? undefined : "Share Your Booking Link"}
              actionHref={searchTerm ? undefined : "/settings"}
              tip={searchTerm ? undefined : "Share your booking page link to start receiving bookings"}
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const childBookings = childBookingsMap.get(booking.id) || [];
              const isSeriesParent = booking.recurrence_pattern && childBookings.length > 0;
              const isExpanded = expandedSeries.has(booking.id);
              const totalInSeries = childBookings.length + 1;

              return (
                <div key={booking.id}>
                  <Card className="p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: booking.event_types.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{booking.event_types.title}</h3>
                            {isSeriesParent && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-0 flex items-center gap-1">
                                <Repeat className="w-3 h-3" />
                                Series ({totalInSeries})
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(booking.scheduled_date), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(booking.start_time)} ({booking.event_types.duration}min)
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        <BookingActionsDropdown
                          bookingId={booking.id}
                          status={booking.status}
                          guestName={booking.guest_name}
                          guestEmail={booking.guest_email}
                          eventTitle={booking.event_types.title}
                          scheduledDate={format(parseISO(booking.scheduled_date), "MMM d, yyyy")}
                          startTime={booking.start_time}
                          endTime={booking.end_time}
                          duration={booking.event_types.duration}
                          hostUserId={booking.host_user_id}
                          onStatusChange={() => refetch()}
                          onReschedule={() => setRescheduleBooking(booking)}
                        />
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

                      {booking.guest_timezone && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{getTimezoneLabel(booking.guest_timezone)}</div>
                            <div className="text-xs text-muted-foreground">Guest Timezone</div>
                          </div>
                        </div>
                      )}

                      {booking.guest_notes && (
                        <div className="sm:col-span-2 mt-2">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Notes:</span> {booking.guest_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Expand/collapse series button */}
                    {isSeriesParent && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSeriesExpanded(booking.id)}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide {childBookings.length} more sessions
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show {childBookings.length} more sessions
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* Child bookings (expanded series) */}
                  {isExpanded && childBookings.length > 0 && (
                    <div className="ml-6 mt-2 space-y-2 border-l-2 border-primary/20 pl-4">
                      {childBookings
                        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                        .map((child) => (
                          <Card key={child.id} className="p-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: child.event_types.color }}
                                />
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    {format(parseISO(child.scheduled_date), "MMM d, yyyy")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    {formatTime(child.start_time)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(child.status)} variant="secondary">
                                  {child.status}
                                </Badge>
                                <BookingActionsDropdown
                                  bookingId={child.id}
                                  status={child.status}
                                  guestName={child.guest_name}
                                  guestEmail={child.guest_email}
                                  eventTitle={child.event_types.title}
                                  scheduledDate={format(parseISO(child.scheduled_date), "MMM d, yyyy")}
                                  startTime={child.start_time}
                                  endTime={child.end_time}
                                  duration={child.event_types.duration}
                                  hostUserId={child.host_user_id}
                                  onStatusChange={() => refetch()}
                                  onReschedule={() => setRescheduleBooking(child)}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onCancel={handleCancelBooking}
        onComplete={handleCompleteBooking}
        onReschedule={(booking) => {
          setSelectedBooking(null);
          setRescheduleBooking(booking);
        }}
      />

      {rescheduleBooking && (
        <RescheduleDialog
          open={!!rescheduleBooking}
          onOpenChange={(open) => !open && setRescheduleBooking(null)}
          bookingId={rescheduleBooking.id}
          hostUserId={rescheduleBooking.host_user_id}
          eventTypeId={rescheduleBooking.event_type_id}
          duration={rescheduleBooking.event_types.duration}
          eventTitle={rescheduleBooking.event_types.title}
          guestName={rescheduleBooking.guest_name}
          guestEmail={rescheduleBooking.guest_email}
          currentDate={rescheduleBooking.scheduled_date}
          currentStartTime={rescheduleBooking.start_time}
          onRescheduled={() => refetch()}
          bufferBefore={rescheduleBooking.event_types.buffer_before}
          bufferAfter={rescheduleBooking.event_types.buffer_after}
        />
      )}
    </div>
  );
};

export default Bookings;
