import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { Booking } from "@/hooks/useBookings";

interface BookingsCalendarViewProps {
  bookings: Booking[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onBookingClick: (booking: Booking) => void;
}

const BookingsCalendarView = ({
  bookings,
  currentMonth,
  onMonthChange,
  onBookingClick,
}: BookingsCalendarViewProps) => {
  const today = new Date();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((booking) => {
      const dateKey = booking.scheduled_date;
      const existing = map.get(dateKey) || [];
      existing.push(booking);
      map.set(dateKey, existing);
    });
    return map;
  }, [bookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabelsMobile = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card className="p-4 sm:p-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => onMonthChange(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((day, i) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1 sm:py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{dayLabelsMobile[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            const hasBookings = dayBookings.length > 0;
            const confirmedBookings = dayBookings.filter(
              (b) => b.status === "confirmed"
            );

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "min-h-[70px] sm:min-h-[100px] p-1 border rounded-lg transition-colors",
                  isCurrentMonth ? "bg-background" : "bg-muted/30",
                  isToday && "ring-2 ring-primary",
                  hasBookings && isCurrentMonth && "hover:border-primary/50"
                )}
              >
                {/* Day number */}
                <div
                  className={cn(
                    "text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>

                {/* Bookings */}
                <div className="space-y-0.5">
                  <TooltipProvider>
                    {dayBookings.slice(0, 2).map((booking) => (
                      <Tooltip key={booking.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onBookingClick(booking)}
                            className={cn(
                              "w-full text-left px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs truncate transition-colors",
                              "hover:opacity-80 cursor-pointer",
                              booking.status === "confirmed" &&
                                "bg-green-500/10 text-green-700 dark:text-green-400",
                              booking.status === "cancelled" &&
                                "bg-red-500/10 text-red-700 dark:text-red-400 line-through",
                              booking.status === "completed" &&
                                "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            )}
                          >
                            <span className="font-medium hidden sm:inline">
                              {formatTime(booking.start_time)}
                            </span>{" "}
                            <span className="sm:hidden">{booking.guest_name.split(" ")[0].charAt(0)}</span>
                            <span className="hidden sm:inline">{booking.guest_name.split(" ")[0]}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-popover text-popover-foreground border shadow-md z-50"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold">
                              {booking.event_types.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              {booking.guest_name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTime(booking.start_time)} -{" "}
                              {formatTime(booking.end_time)}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                booking.status === "confirmed" &&
                                  "bg-green-500/10 text-green-600",
                                booking.status === "cancelled" &&
                                  "bg-red-500/10 text-red-600",
                                booking.status === "completed" &&
                                  "bg-blue-500/10 text-blue-600"
                              )}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>

                  {/* More indicator */}
                  {dayBookings.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground px-1 sm:px-1.5">
                      +{dayBookings.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
          <span>Cancelled</span>
        </div>
      </div>
    </Card>
  );
};

export default BookingsCalendarView;
