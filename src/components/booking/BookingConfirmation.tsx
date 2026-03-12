import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Calendar,
  Clock,
  Video,
  Globe,
  Download,
  Share2,
  Copy,
  ExternalLink,
  CalendarPlus,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { getTimezoneLabel } from "@/lib/timezones";
import { cn } from "@/lib/utils";

interface BookingConfirmationProps {
  hostName: string | null;
  eventTitle: string;
  scheduledDate: string; // "EEEE, MMMM d, yyyy" or ISO date
  startTime: string; // display format like "2:30 PM" or "14:30"
  endTime?: string;
  duration?: number;
  guestTimezone?: string;
  guestEmail?: string;
  meetingLink?: string | null;
  manageUrl?: string | null;
  isPaid?: boolean;
  /** Raw date/time for ICS generation */
  icsData?: {
    dateISO: string; // "2026-03-15"
    startTime24: string; // "14:30"
    endTime24: string; // "15:00"
    hostTimezone: string;
  };
}

const BookingConfirmation = ({
  hostName,
  eventTitle,
  scheduledDate,
  startTime,
  endTime,
  duration,
  guestTimezone,
  guestEmail,
  meetingLink,
  manageUrl,
  isPaid,
  icsData,
}: BookingConfirmationProps) => {
  const formatTime = (time: string) => {
    if (time.includes("AM") || time.includes("PM")) return time;
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
  };

  const displayDate = scheduledDate.includes("-")
    ? format(parseISO(scheduledDate), "EEEE, MMMM d, yyyy")
    : scheduledDate;

  const generateIcsContent = () => {
    if (!icsData) return null;
    const dateStr = icsData.dateISO.replace(/-/g, "");
    const start = `${dateStr}T${icsData.startTime24.replace(":", "")}00`;
    const end = `${dateStr}T${icsData.endTime24.replace(":", "")}00`;
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BookMe.Bet//EN",
      "BEGIN:VEVENT",
      `DTSTART;TZID=${icsData.hostTimezone}:${start}`,
      `DTEND;TZID=${icsData.hostTimezone}:${end}`,
      `SUMMARY:${eventTitle} with ${hostName || "Host"}`,
      `DESCRIPTION:Booked via Bᴏᴏᴋᴍᴇ.ʙᴇᴛ`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  };

  const downloadIcs = () => {
    const content = generateIcsContent();
    if (!content) return;
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGoogleCalendarUrl = () => {
    if (!icsData) return "#";
    const dateStr = icsData.dateISO.replace(/-/g, "");
    const start = `${dateStr}T${icsData.startTime24.replace(":", "")}00`;
    const end = `${dateStr}T${icsData.endTime24.replace(":", "")}00`;
    const title = encodeURIComponent(`${eventTitle} with ${hostName || "Host"}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${encodeURIComponent("Booked via Bᴏᴏᴋᴍᴇ.ʙᴇᴛ")}`;
  };

  const getOutlookCalendarUrl = () => {
    if (!icsData) return "#";
    const start = `${icsData.dateISO}T${icsData.startTime24}:00`;
    const end = `${icsData.dateISO}T${icsData.endTime24}:00`;
    const title = encodeURIComponent(`${eventTitle} with ${hostName || "Host"}`);
    return `https://outlook.live.com/calendar/0/action/compose?subject=${title}&startdt=${start}&enddt=${end}&body=${encodeURIComponent("Booked via Bᴏᴏᴋᴍᴇ.ʙᴇᴛ")}`;
  };

  const shareBooking = async () => {
    const text = `I just booked "${eventTitle}" with ${hostName || "someone"} on ${displayDate} at ${formatTime(startTime)}!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Booking Confirmed", text });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const tweetUrl = () => {
    const text = encodeURIComponent(
      `Just booked a meeting with ${hostName || "an expert"} via @BookMeBet! 🗓️`
    );
    return `https://twitter.com/intent/tweet?text=${text}`;
  };

  return (
    <Card className="max-w-lg w-full p-0 overflow-hidden animate-scale-in">
      {/* Success header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-8 pt-10 pb-8 text-center">
        <div className="w-18 h-18 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-success/10">
          <div className="w-14 h-14 bg-success/20 rounded-full flex items-center justify-center">
            <Check className="w-7 h-7 text-success" strokeWidth={3} />
          </div>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1.5">
          {isPaid ? "Payment & Booking Confirmed!" : "Booking Confirmed!"}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Your meeting with <span className="font-medium text-foreground">{hostName || "the host"}</span> is scheduled.
        </p>
      </div>

      {/* Event details card */}
      <div className="px-6 sm:px-8 -mt-3">
        <div className="bg-muted/60 border border-border rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">{eventTitle}</p>
              {duration && <p className="text-xs text-muted-foreground">{duration} minutes</p>}
            </div>
            {isPaid && (
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                Paid ✓
              </span>
            )}
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm">{displayDate}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <span className="text-sm">
                {formatTime(startTime)}
                {endTime && ` – ${formatTime(endTime)}`}
              </span>
            </div>
          </div>
          {guestTimezone && (
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{getTimezoneLabel(guestTimezone)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Calendar actions */}
      {icsData && (
        <div className="px-6 sm:px-8 mt-5">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <CalendarPlus className="w-3.5 h-3.5" />
            Add to Calendar
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="w-full h-10" onClick={downloadIcs}>
              <Download className="w-4 h-4 mr-1.5" />
              .ics File
            </Button>
            <Button variant="outline" size="sm" className="w-full h-10" asChild>
              <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                <Calendar className="w-4 h-4 mr-1.5" />
                Google
              </a>
            </Button>
            <Button variant="outline" size="sm" className="w-full h-10" asChild>
              <a href={getOutlookCalendarUrl()} target="_blank" rel="noopener noreferrer">
                <Mail className="w-4 h-4 mr-1.5" />
                Outlook
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Share */}
      <div className="px-6 sm:px-8 mt-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full h-10" onClick={shareBooking}>
            <Copy className="w-4 h-4 mr-1.5" />
            Copy Details
          </Button>
          <Button variant="outline" size="sm" className="w-full h-10" asChild>
            <a href={tweetUrl()} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Share on X
            </a>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 sm:px-8 pt-5 pb-8 mt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          <span>
            Confirmation sent to{" "}
            <span className="font-medium text-foreground">{guestEmail || "your email"}</span>
          </span>
        </div>
        {manageUrl && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.open(manageUrl, "_blank")}
            >
              Need to reschedule or cancel? →
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookingConfirmation;
