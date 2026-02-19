import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Calendar, XCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendCancellationEmail, getHostEmail } from "@/lib/email-service";

interface BookingActionsDropdownProps {
  bookingId: string;
  status: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  scheduledDate: string; // formatted for display e.g. "Feb 25, 2026"
  scheduledDateRaw: string; // ISO format e.g. "2026-02-25" for email/ICS
  startTime: string;
  endTime: string;
  duration: number;
  hostUserId: string;
  onStatusChange: () => void;
  onReschedule: () => void;
}

const BookingActionsDropdown = ({
  bookingId,
  status,
  guestName,
  guestEmail,
  eventTitle,
  scheduledDate,
  scheduledDateRaw,
  startTime,
  endTime,
  duration,
  hostUserId,
  onStatusChange,
  onReschedule,
}: BookingActionsDropdownProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      // Fetch host info for email
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", hostUserId)
        .single();

      // Send cancellation email using the email service
      const emailResult = await sendCancellationEmail({
        id: bookingId,
        guestName,
        guestEmail,
        hostName: hostProfile?.full_name || "Host",
        hostEmail: hostProfile?.email || undefined,
        eventTitle,
        scheduledDate: scheduledDateRaw,
        startTime,
        endTime,
        duration,
      });

      if (emailResult.success) {
        toast.success("Booking cancelled and notifications sent");
      } else {
        toast.success("Booking cancelled");
        console.warn("Email notification could not be sent:", emailResult.error);
      }
      
      onStatusChange();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setLoading(false);
      setShowCancelDialog(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success("Booking marked as completed");
      onStatusChange();
    } catch (error) {
      console.error("Error completing booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setLoading(false);
      setShowCompleteDialog(false);
    }
  };

  const isActive = status === "confirmed";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isActive && (
            <>
              <DropdownMenuItem onClick={onReschedule}>
                <Calendar className="w-4 h-4 mr-2" />
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
                <Check className="w-4 h-4 mr-2" />
                Mark as Completed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCancelDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Booking
              </DropdownMenuItem>
            </>
          )}
          {!isActive && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No actions available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the {eventTitle} with {guestName} on {scheduledDate}{" "}
              at {startTime}? The guest will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the meeting with {guestName} as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={loading}>
              {loading ? "Updating..." : "Mark Completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingActionsDropdown;
