import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Mail,
  User,
  Globe,
  MessageSquare,
  Video,
  ExternalLink,
  XCircle,
  CheckCircle,
  CalendarClock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getTimezoneLabel } from "@/lib/timezones";
import type { Booking } from "@/hooks/useBookings";
import { cn } from "@/lib/utils";

interface BookingDetailModalProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  onReschedule: (booking: Booking) => void;
}

const BookingDetailModal = ({
  booking,
  open,
  onOpenChange,
  onCancel,
  onComplete,
  onReschedule,
}: BookingDetailModalProps) => {
  if (!booking) return null;

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
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

  const isActionable = booking.status === "confirmed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: booking.event_types.color || "#6366f1" }}
            />
            <DialogTitle className="text-xl">{booking.event_types.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status badge */}
          <Badge className={cn("capitalize", getStatusColor(booking.status))}>
            {booking.status}
          </Badge>

          {/* Date and time */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {format(parseISO(booking.scheduled_date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" />
                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                <span className="text-xs ml-1">({booking.event_types.duration} min)</span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Guest info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Guest Information</h4>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{booking.guest_name}</p>
                <p className="text-xs text-muted-foreground">Guest Name</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <a
                  href={`mailto:${booking.guest_email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {booking.guest_email}
                </a>
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
            </div>

            {booking.guest_timezone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{getTimezoneLabel(booking.guest_timezone)}</p>
                  <p className="text-xs text-muted-foreground">Timezone</p>
                </div>
              </div>
            )}

            {booking.guest_notes && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{booking.guest_notes}</p>
                  <p className="text-xs text-muted-foreground">Notes</p>
                </div>
              </div>
            )}
          </div>

          {/* Meeting link */}
          {booking.meeting_link && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{booking.meeting_link}</p>
                  <p className="text-xs text-muted-foreground">Meeting Link</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(booking.meeting_link!, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {/* Actions */}
          {isActionable && (
            <>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onReschedule(booking);
                    onOpenChange(false);
                  }}
                >
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => {
                    onComplete(booking.id);
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onCancel(booking.id);
                    onOpenChange(false);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailModal;
