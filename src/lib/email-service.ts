import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookingEmailData {
  id: string;
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail?: string;
  eventTitle: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  guestTimezone?: string;
  hostTimezone?: string;
  meetingLink?: string;
  manageUrl?: string;
}

export interface EmailResult {
  success: boolean;
  guestEmailSent?: boolean;
  hostEmailSent?: boolean;
  error?: string;
}

type EmailType = "booking_confirmed" | "booking_cancelled" | "booking_rescheduled";

/**
 * Send booking notification emails with consistent error handling
 */
export async function sendBookingEmail(
  type: EmailType,
  booking: BookingEmailData,
  oldDateTime?: { date: string; time: string }
): Promise<EmailResult> {
  try {
    const payload: {
      type: EmailType;
      booking: BookingEmailData;
      oldDateTime?: { date: string; time: string };
    } = { type, booking };

    if (oldDateTime) {
      payload.oldDateTime = oldDateTime;
    }

    const { data, error } = await supabase.functions.invoke("send-booking-email", {
      body: payload,
    });

    if (error) {
      console.error(`[EmailService] Failed to send ${type} email:`, error);
      return {
        success: false,
        error: error.message || "Failed to send email notification",
      };
    }

    return {
      success: true,
      guestEmailSent: data?.guestEmailSent ?? false,
      hostEmailSent: data?.hostEmailSent ?? false,
    };
  } catch (error: any) {
    console.error(`[EmailService] Error sending ${type} email:`, error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Send confirmation email with error handling and optional toast feedback
 */
export async function sendConfirmationEmail(
  booking: BookingEmailData,
  showToast = false
): Promise<EmailResult> {
  const result = await sendBookingEmail("booking_confirmed", booking);
  
  if (showToast) {
    if (result.success) {
      if (result.guestEmailSent && result.hostEmailSent) {
        toast.success("Confirmation emails sent to guest and host");
      } else if (result.guestEmailSent) {
        toast.success("Confirmation email sent to guest");
      } else if (result.hostEmailSent) {
        toast.success("Confirmation email sent to host");
      }
    } else {
      toast.warning("Booking confirmed, but email notification could not be sent");
    }
  }
  
  return result;
}

/**
 * Send cancellation email with error handling and optional toast feedback
 */
export async function sendCancellationEmail(
  booking: BookingEmailData,
  showToast = false
): Promise<EmailResult> {
  const result = await sendBookingEmail("booking_cancelled", booking);
  
  if (showToast) {
    if (result.success) {
      if (result.guestEmailSent && result.hostEmailSent) {
        toast.success("Cancellation emails sent to guest and host");
      } else if (result.guestEmailSent) {
        toast.success("Cancellation email sent to guest");
      } else if (result.hostEmailSent) {
        toast.success("Cancellation email sent to host");
      }
    } else {
      console.warn("Cancellation email could not be sent:", result.error);
      // Don't show error toast for cancellation - the cancellation itself succeeded
    }
  }
  
  return result;
}

/**
 * Send reschedule email with error handling and optional toast feedback
 */
export async function sendRescheduleEmail(
  booking: BookingEmailData,
  oldDateTime: { date: string; time: string },
  showToast = false
): Promise<EmailResult> {
  const result = await sendBookingEmail("booking_rescheduled", booking, oldDateTime);
  
  if (showToast) {
    if (result.success) {
      if (result.guestEmailSent && result.hostEmailSent) {
        toast.success("Reschedule emails sent to guest and host");
      } else if (result.guestEmailSent) {
        toast.success("Reschedule email sent to guest");
      } else if (result.hostEmailSent) {
        toast.success("Reschedule email sent to host");
      }
    } else {
      console.warn("Reschedule email could not be sent:", result.error);
      // Don't show error toast - the reschedule itself succeeded
    }
  }
  
  return result;
}

/**
 * Helper to fetch host email from profile
 */
export async function getHostEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("[EmailService] Failed to fetch host email:", error);
      return null;
    }

    return data?.email || null;
  } catch (error) {
    console.error("[EmailService] Error fetching host email:", error);
    return null;
  }
}
