import { ResponsiveModal } from "@/components/ui/responsive-modal";
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
  ClipboardList,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getTimezoneLabel } from "@/lib/timezones";
import type { Booking } from "@/hooks/useBookings";
import { useBookingAnswers } from "@/hooks/useBookingQuestions";
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
  const { data: bookingAnswers } = useBookingAnswers(booking?.id);

  if (!booking) return null;
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
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
            style={{ backgroundColor: booking.event_types.color || "#6366f1" }}
          />
          <span className="text-lg sm:text-xl">{booking.event_types.title}</span>
        </div>
      }
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Status badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("capitalize", getStatusColor(booking.status))}>
            {booking.status}
          </Badge>
          {booking.payment_status === "paid" && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              💰 Paid
            </Badge>
          )}
        </div>

        {/* Date and time */}
        <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base">
              {format(parseISO(booking.scheduled_date), "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5 sm:mt-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              <span className="text-xs ml-1">({booking.event_types.duration} min)</span>
            </p>
          </div>
        </div>

        <Separator />

        {/* Guest info */}
        <div className="space-y-2.5 sm:space-y-3">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Guest Information</h4>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base truncate">{booking.guest_name}</p>
              <p className="text-xs text-muted-foreground">Guest Name</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <a
                href={`mailto:${booking.guest_email}`}
                className="font-medium text-sm sm:text-base text-primary hover:underline truncate block"
              >
                {booking.guest_email}
              </a>
              <p className="text-xs text-muted-foreground">Email</p>
            </div>
          </div>

          {booking.guest_timezone && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">{getTimezoneLabel(booking.guest_timezone)}</p>
                <p className="text-xs text-muted-foreground">Timezone</p>
              </div>
            </div>
          )}

          {booking.guest_notes && (
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm">{booking.guest_notes}</p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
            </div>
          )}
        </div>

        {/* Custom question answers */}
        {bookingAnswers && bookingAnswers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2.5 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Custom Responses
              </h4>
              {bookingAnswers.map((a) => {
                let displayAnswer: string;
                try {
                  const parsed = JSON.parse(a.answer as string);
                  displayAnswer = Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
                } catch {
                  displayAnswer = String(a.answer);
                }
                return (
                  <div key={a.id} className="p-2.5 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {a.booking_questions?.label || "Question"}
                    </p>
                    <p className="text-sm font-medium">{displayAnswer}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Meeting link */}
        {booking.meeting_link && (
          <>
            <Separator />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{booking.meeting_link}</p>
                <p className="text-xs text-muted-foreground">Meeting Link</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 min-w-[44px] min-h-[44px]"
                onClick={() => window.open(booking.meeting_link!, "_blank")}
                aria-label="Open meeting link"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="w-full text-sm min-h-[44px]"
                onClick={() => {
                  onReschedule(booking);
                  onOpenChange(false);
                }}
              >
                <CalendarClock className="w-4 h-4 mr-1.5 sm:mr-2" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 text-sm min-h-[44px]"
                onClick={() => {
                  onComplete(booking.id);
                  onOpenChange(false);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1.5 sm:mr-2" />
                Complete
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 text-sm min-h-[44px]"
                onClick={() => {
                  onCancel(booking.id);
                  onOpenChange(false);
                }}
              >
                <XCircle className="w-4 h-4 mr-1.5 sm:mr-2" />
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default BookingDetailModal;
