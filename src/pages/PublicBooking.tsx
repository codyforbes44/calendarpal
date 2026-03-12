import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import TimeSlotPicker from "@/components/calendar/TimeSlotPicker";
import { useTimeSlots, convertTo24Hour, calculateEndTime } from "@/hooks/useTimeSlots";
import { Calendar, Clock, Video, User, Mail, MessageSquare, ArrowLeft, Check, MapPin, Globe, Repeat, AlertTriangle } from "lucide-react";
import { format, addWeeks, addMonths } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { toast } from "sonner";
import TimezoneSelector from "@/components/TimezoneSelector";
import { getLocalTimezone, getTimezoneLabel } from "@/lib/timezones";
import { getTimezoneAbbr } from "@/hooks/useTimezone";
import SEO from "@/components/SEO";
import { siteConfig } from "@/lib/seo-config";
import { sendConfirmationEmail } from "@/lib/email-service";
import { getThemeById, buildThemeCSSVars } from "@/lib/booking-themes";
import CustomQuestionsForm from "@/components/booking/CustomQuestionsForm";
import type { BookingQuestion } from "@/hooks/useBookingQuestions";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone: string | null;
  bio: string | null;
  booking_theme: string;
  custom_brand_color: string | null;
  custom_brand_logo: string | null;
  custom_welcome_message: string | null;
}

interface EventType {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration: number;
  location_type: string | null;
  color: string | null;
  is_active: boolean;
  buffer_before: number;
  buffer_after: number;
  allow_recurring: boolean;
  price_amount: number | null;
  price_currency: string;
}

const PublicBooking = () => {
  const { username, eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"event" | "selection" | "details" | "confirmed">("event");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [guestTimezone, setGuestTimezone] = useState(getLocalTimezone());

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [cancellationToken, setCancellationToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: "",
    meetingLink: "",
  });

  // Recurring booking state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [endType, setEndType] = useState<"count" | "date">("count");
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const { timeSlots, loading: slotsLoading } = useTimeSlots({
    userId: profile?.user_id || "",
    eventTypeId: selectedEvent?.id || "",
    selectedDate,
    duration: selectedEvent?.duration || 30,
    bufferBefore: selectedEvent?.buffer_before || 0,
    bufferAfter: selectedEvent?.buffer_after || 0,
  });

  // Generate a stable session ID for page view tracking
  const [viewerSessionId] = useState(() => {
    const stored = sessionStorage.getItem("calendarpal_session");
    if (stored) return stored;
    const id = crypto.randomUUID();
    sessionStorage.setItem("calendarpal_session", id);
    return id;
  });

  useEffect(() => {
    if (username) {
      loadProfileAndEvents();
    }
  }, [username]);

  // Handle URL parameters for direct event selection
  useEffect(() => {
    if (eventTypes.length === 0) return;
    
    // Priority: 1. eventSlug from path, 2. type query param, 3. duration query param
    if (eventSlug) {
      const event = eventTypes.find(
        (e) => e.title.toLowerCase().replace(/\s+/g, "-") === eventSlug
      );
      if (event) {
        setSelectedEvent(event);
        setStep("selection");
        return;
      }
    }

    // Check for type query parameter (matches by title slug or exact title)
    const typeParam = searchParams.get("type");
    if (typeParam) {
      const event = eventTypes.find(
        (e) => 
          e.title.toLowerCase().replace(/\s+/g, "-") === typeParam.toLowerCase() ||
          e.title.toLowerCase() === typeParam.toLowerCase()
      );
      if (event) {
        setSelectedEvent(event);
        setStep("selection");
        return;
      }
    }

    // Check for duration query parameter (matches by duration in minutes)
    const durationParam = searchParams.get("duration");
    if (durationParam) {
      const duration = parseInt(durationParam, 10);
      if (!isNaN(duration)) {
        const event = eventTypes.find((e) => e.duration === duration);
        if (event) {
          setSelectedEvent(event);
          setStep("selection");
          return;
        }
      }
    }

    // Check for event ID query parameter
    const eventIdParam = searchParams.get("event");
    if (eventIdParam) {
      const event = eventTypes.find((e) => e.id === eventIdParam);
      if (event) {
        setSelectedEvent(event);
        setStep("selection");
        return;
      }
    }
  }, [eventSlug, eventTypes, searchParams]);

  useEffect(() => {
    if (profile?.user_id) {
      loadAvailableDates();
    }
  }, [profile?.user_id]);

  const loadProfileAndEvents = async () => {
    try {
      // Load profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast.error("User not found");
        navigate("/");
        return;
      }

      setProfile(profileData);

      // Load active event types for this user
      const { data: eventsData, error: eventsError } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", profileData.user_id)
        .eq("is_active", true);

      if (eventsError) throw eventsError;
      setEventTypes(eventsData || []);
    } catch (error) {
      console.error("Error loading booking page:", error);
      toast.error("Failed to load booking page");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from("availability")
        .select("day_of_week")
        .eq("user_id", profile?.user_id);

      if (error) throw error;

      // Get unique days of week with availability
      const availableDays = [...new Set(data?.map((d) => d.day_of_week) || [])];

      // Generate dates for the next 60 days that match available days
      const dates: Date[] = [];
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (availableDays.includes(date.getDay())) {
          dates.push(date);
        }
      }
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error loading available dates:", error);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  // Track page view when profile loads
  useEffect(() => {
    if (profile?.user_id) {
      supabase.functions.invoke("track-page-view", {
        body: {
          hostUserId: profile.user_id,
          sessionId: viewerSessionId,
          step: "page_view",
        },
      }).catch(() => {}); // fire-and-forget
    }
  }, [profile?.user_id]);

  const handleEventSelect = (event: EventType) => {
    setSelectedEvent(event);
    setStep("selection");
    // Track time slot click
    if (profile?.user_id) {
      supabase.functions.invoke("track-page-view", {
        body: {
          hostUserId: profile.user_id,
          eventTypeId: event.id,
          sessionId: viewerSessionId,
          step: "time_slot_click",
        },
      }).catch(() => {});
    }
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    setStep("details");
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("selection");
    } else if (step === "selection") {
      setSelectedEvent(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setStep("event");
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedEvent || !profile) return;

    setSubmitting(true);
    try {
      const startTime = convertTo24Hour(selectedTime);
      const endTime = calculateEndTime(startTime, selectedEvent.duration);
      const hostTimezone = profile.timezone || "America/New_York";

      // If event has a price, redirect to Stripe Checkout instead of creating booking directly
      if (selectedEvent.price_amount && selectedEvent.price_amount > 0) {
        const { data, error } = await supabase.functions.invoke("create-booking-payment", {
          body: {
            eventTypeId: selectedEvent.id,
            hostUserId: profile.user_id,
            scheduledDate: format(selectedDate, "yyyy-MM-dd"),
            startTime,
            endTime,
            guestName: formData.name,
            guestEmail: formData.email,
            guestNotes: formData.notes || null,
            meetingLink: formData.meetingLink.trim() || null,
            guestTimezone,
            hostTimezone,
            priceAmount: selectedEvent.price_amount,
            priceCurrency: selectedEvent.price_currency || "usd",
            eventTitle: selectedEvent.title,
            username: profile.username,
          },
        });

        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error("No checkout URL returned");
      }

      // Calculate all dates for recurring bookings
      const bookingDates: Date[] = [selectedDate];
      
      if (isRecurring && selectedEvent.allow_recurring) {
        let currentDate = selectedDate;
        const maxOccurrences = endType === "count" ? recurrenceCount : 52; // Max 1 year of weekly
        const endDateLimit = endType === "date" && recurrenceEndDate 
          ? new Date(recurrenceEndDate) 
          : addMonths(selectedDate, 12);

        for (let i = 1; i < maxOccurrences; i++) {
          if (recurrencePattern === "weekly") {
            currentDate = addWeeks(selectedDate, i);
          } else if (recurrencePattern === "biweekly") {
            currentDate = addWeeks(selectedDate, i * 2);
          } else {
            currentDate = addMonths(selectedDate, i);
          }

          if (currentDate > endDateLimit) break;
          bookingDates.push(currentDate);
        }
      }

      // Create the first (parent) booking
      const { data: parentBooking, error: parentError } = await supabase.from("bookings").insert({
        host_user_id: profile.user_id,
        event_type_id: selectedEvent.id,
        scheduled_date: format(bookingDates[0], "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_notes: formData.notes || null,
        meeting_link: formData.meetingLink.trim() || null,
        status: "confirmed",
        host_timezone: hostTimezone,
        guest_timezone: guestTimezone,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_count: isRecurring && endType === "count" ? bookingDates.length : null,
        recurrence_end_date: isRecurring && endType === "date" ? recurrenceEndDate : null,
      }).select("id, cancellation_token").single();

      if (parentError) throw parentError;

      // Fetch host email from profiles table
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", profile.user_id)
        .single();

      const hostEmail = hostProfile?.email || undefined;
      const hostName = profile.full_name || "Host";

      // Send confirmation email for parent booking
      const manageUrl = `${window.location.origin}/booking/${parentBooking.id}/manage?token=${parentBooking.cancellation_token}`;
      
      const emailResult = await sendConfirmationEmail({
        id: parentBooking.id,
        guestName: formData.name,
        guestEmail: formData.email,
        hostName,
        hostEmail,
        eventTitle: selectedEvent.title,
        scheduledDate: format(bookingDates[0], "yyyy-MM-dd"),
        startTime: startTime,
        endTime: endTime,
        duration: selectedEvent.duration,
        guestTimezone: guestTimezone,
        hostTimezone: hostTimezone,
        meetingLink: formData.meetingLink.trim() || undefined,
        manageUrl: manageUrl,
      });

      if (!emailResult.success) {
        console.warn("Confirmation email could not be sent for parent booking:", emailResult.error);
      }

      // Create remaining recurring bookings and send individual emails for each
      if (bookingDates.length > 1) {
        const childBookings = bookingDates.slice(1).map(date => ({
          host_user_id: profile.user_id,
          event_type_id: selectedEvent.id,
          scheduled_date: format(date, "yyyy-MM-dd"),
          start_time: startTime,
          end_time: endTime,
          guest_name: formData.name,
          guest_email: formData.email,
          guest_notes: formData.notes || null,
          meeting_link: formData.meetingLink.trim() || null,
          status: "confirmed",
          host_timezone: hostTimezone,
          guest_timezone: guestTimezone,
          parent_booking_id: parentBooking.id,
          recurrence_pattern: recurrencePattern,
        }));

        const { data: insertedChildren, error: childError } = await supabase
          .from("bookings")
          .insert(childBookings)
          .select("id, cancellation_token, scheduled_date");
        if (childError) throw childError;

        // Send a confirmation email for each child booking
        if (insertedChildren) {
          await Promise.all(
            insertedChildren.map((child) => {
              const childManageUrl = `${window.location.origin}/booking/${child.id}/manage?token=${child.cancellation_token}`;
              return sendConfirmationEmail({
                id: child.id,
                guestName: formData.name,
                guestEmail: formData.email,
                hostName,
                hostEmail,
                eventTitle: selectedEvent.title,
                scheduledDate: child.scheduled_date,
                startTime: startTime,
                endTime: endTime,
                duration: selectedEvent.duration,
                guestTimezone: guestTimezone,
                hostTimezone: hostTimezone,
                meetingLink: formData.meetingLink.trim() || undefined,
                manageUrl: childManageUrl,
              });
            })
          );
        }
      }

      setCreatedBookingId(parentBooking.id);
      setCancellationToken(parentBooking.cancellation_token);
      setStep("confirmed");
      toast.success(bookingDates.length > 1 
        ? `${bookingDates.length} meetings booked successfully!` 
        : "Meeting booked successfully!");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to book meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getLocationDisplay = (type: string | null) => {
    switch (type) {
      case "video":
        return { icon: Video, text: "Video Call" };
      case "phone":
        return { icon: MapPin, text: "Phone Call" };
      default:
        return { icon: Video, text: "Video Call" };
    }
  };

  /**
   * Convert a display time (e.g. "4:30 PM") from the host's timezone to the guest's timezone.
   * Returns an object with the converted time string and whether it falls on a different date.
   */
  const getGuestLocalTime = (): { timeStr: string; dateDiff: number } | null => {
    if (!selectedDate || !selectedTime || !profile?.timezone) return null;
    try {
      const hostTz = profile.timezone;
      // Parse the display time (e.g. "4:30 PM") into 24-hour parts
      const [timePart, period] = selectedTime.split(" ");
      const [hourStr, minuteStr] = timePart.split(":");
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      // Build a Date in the host's timezone
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const hostLocalDt = new Date(
        `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
      );
      const utcDt = fromZonedTime(hostLocalDt, hostTz);

      const convertedTime = formatInTimeZone(utcDt, guestTimezone, "h:mm a");
      const convertedDate = formatInTimeZone(utcDt, guestTimezone, "yyyy-MM-dd");
      const hostDate = format(selectedDate, "yyyy-MM-dd");
      const dateDiff =
        new Date(convertedDate).getDate() - new Date(hostDate).getDate();

      return { timeStr: convertedTime, dateDiff };
    } catch {
      return null;
    }
  };

  const guestLocalTime = getGuestLocalTime();

  // Build theme CSS variables for the booking page
  const bookingTheme = profile ? getThemeById(profile.booking_theme || "default") : null;
  const themeCSSVars = bookingTheme
    ? buildThemeCSSVars(bookingTheme, profile?.custom_brand_color)
    : {};
  const themeStyle = Object.entries(themeCSSVars).reduce(
    (acc, [key, val]) => {
      // Map --booking-* vars to actual CSS vars used by Tailwind
      const cssKey = key.replace("--booking-", "--");
      acc[cssKey] = val;
      return acc;
    },
    {} as Record<string, string>
  );

  const welcomeMessage =
    profile?.custom_welcome_message ||
    "Welcome! Pick a meeting type below to get started.";

  const dynamicTitle = profile?.full_name 
    ? `Book with ${profile.full_name} | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ` 
    : "Book a Meeting | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ";
  
  const dynamicDescription = profile?.full_name
    ? `Schedule a meeting with ${profile.full_name}. Choose your preferred time slot and book instantly.`
    : "Schedule a meeting. Choose your preferred time slot and book instantly.";

  if (loading) {
    return (
      <>
        <SEO title={dynamicTitle} description={dynamicDescription} />
        <div className="min-h-screen bg-gradient-subtle py-12 px-4 sm:px-6">
          <div className="max-w-xl mx-auto">
            {/* Skeleton profile header */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-8 mb-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-muted animate-pulse mb-4" />
                <div className="h-7 w-40 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4" />
                <div className="h-4 w-56 bg-muted animate-pulse rounded" />
              </div>
            </div>
            {/* Skeleton event cards */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded mb-3" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                    <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Generate .ics calendar file content
  const generateIcsContent = () => {
    if (!selectedDate || !selectedTime || !selectedEvent || !profile) return null;
    const startTime24 = convertTo24Hour(selectedTime);
    const endTime24 = calculateEndTime(startTime24, selectedEvent.duration);
    const dateStr = format(selectedDate, "yyyyMMdd");
    const start = `${dateStr}T${startTime24.replace(":", "")}00`;
    const end = `${dateStr}T${endTime24.replace(":", "")}00`;
    
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BookMe.Bet//EN",
      "BEGIN:VEVENT",
      `DTSTART;TZID=${profile.timezone || "UTC"}:${start}`,
      `DTEND;TZID=${profile.timezone || "UTC"}:${end}`,
      `SUMMARY:${selectedEvent.title} with ${profile.full_name || "Host"}`,
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
    a.download = `booking-${selectedEvent?.title?.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGoogleCalendarUrl = () => {
    if (!selectedDate || !selectedTime || !selectedEvent || !profile) return "#";
    const startTime24 = convertTo24Hour(selectedTime);
    const endTime24 = calculateEndTime(startTime24, selectedEvent.duration);
    const dateStr = format(selectedDate, "yyyyMMdd");
    const start = `${dateStr}T${startTime24.replace(":", "")}00`;
    const end = `${dateStr}T${endTime24.replace(":", "")}00`;
    const title = encodeURIComponent(`${selectedEvent.title} with ${profile.full_name || "Host"}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${encodeURIComponent("Booked via Bᴏᴏᴋᴍᴇ.ʙᴇᴛ")}`;
  };

  // Confirmed step
  if (step === "confirmed") {
    const manageUrl = createdBookingId && cancellationToken
      ? `${window.location.origin}/booking/${createdBookingId}/manage?token=${cancellationToken}`
      : null;

    return (
      <>
        <SEO title={dynamicTitle} description={dynamicDescription} />
        <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
          <Card className="max-w-lg w-full p-8 text-center animate-scale-in">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Your meeting with {profile?.full_name} has been scheduled.
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>{selectedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span>{selectedEvent?.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{getTimezoneLabel(guestTimezone)}</span>
            </div>
          </div>

          {/* Add to calendar buttons */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={downloadIcs}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Download .ics
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                <Calendar className="w-4 h-4 mr-1.5" />
                Google Calendar
              </a>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            A confirmation email has been sent to {formData.email}
          </p>
          {manageUrl && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Need to make changes?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(manageUrl, "_blank")}
              >
                Reschedule or Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
      </>
    );
  }

  // Event selection step — public profile page
  if (step === "event") {
    const initials = profile?.full_name
      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "?";

    return (
      <>
        <SEO title={dynamicTitle} description={dynamicDescription} />
        <div className="min-h-screen py-12 px-4 sm:px-6" style={{ ...themeStyle, backgroundColor: `hsl(${themeStyle["--background"] || "var(--background)"})`, color: `hsl(${themeStyle["--foreground"] || "var(--foreground)"})` }}>
          <div className="max-w-xl mx-auto">

            {/* Profile header card */}
            <div className="rounded-2xl border shadow-sm p-8 mb-6 text-center" style={{ borderColor: `hsl(${themeStyle["--border"] || "var(--border)"})`, backgroundColor: `hsl(${themeStyle["--card"] || "var(--card)"})` }}>
              {/* Custom brand logo */}
              {profile?.custom_brand_logo && (
                <img
                  src={profile.custom_brand_logo}
                  alt="Brand logo"
                  className="h-8 w-auto mx-auto mb-4 object-contain"
                />
              )}
              {/* Avatar */}
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || ""}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                  style={{ boxShadow: `0 0 0 4px hsl(${themeStyle["--primary"] || "var(--primary)"} / 0.2)` }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: `linear-gradient(to bottom right, hsl(${themeStyle["--primary"] || "var(--primary)"} / 0.3), hsl(${themeStyle["--primary"] || "var(--primary)"} / 0.1))`,
                    boxShadow: `0 0 0 4px hsl(${themeStyle["--primary"] || "var(--primary)"} / 0.2)`,
                  }}
                >
                  <span className="text-2xl font-bold" style={{ color: `hsl(${themeStyle["--primary"] || "var(--primary)"})` }}>{initials}</span>
                </div>
              )}

              {/* Name */}
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {profile?.full_name || username}
              </h1>

              {/* Username handle */}
              <p className="text-sm text-muted-foreground mb-3">@{profile?.username}</p>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-foreground/80 leading-relaxed mb-3 max-w-xs mx-auto">
                  {profile.bio}
                </p>
              )}

              {/* Divider */}
              <div className="w-10 h-px bg-border mx-auto mb-3" />

              {/* Prompt */}
              <p className="text-sm" style={{ color: `hsl(${themeStyle["--muted-foreground"] || "var(--muted-foreground)"})` }}>
                {welcomeMessage}
              </p>
            </div>

            {/* Event type cards */}
            <div className="mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
                Available meeting types
              </h2>

              {eventTypes.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                  No meeting types are currently available.
                </div>
              ) : (
                <div className="space-y-3">
                  {eventTypes.map((event) => {
                    const location = getLocationDisplay(event.location_type);
                    const LocationIcon = location.icon;
                    const accentColor = event.color || "hsl(var(--primary))";

                    return (
                      <button
                        key={event.id}
                        onClick={() => handleEventSelect(event)}
                        className="w-full text-left rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/30 hover:shadow-md transition-all duration-200 group overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex items-stretch">
                          {/* Color accent bar */}
                          <div
                            className="w-1.5 shrink-0 rounded-l-xl"
                            style={{ background: accentColor }}
                          />

                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground text-base leading-snug mb-1 group-hover:text-primary transition-colors">
                                  {event.title}
                                </h3>
                                {event.description && (
                                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full font-medium">
                                    <Clock className="w-3 h-3" />
                                    {event.duration} min
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <LocationIcon className="w-3.5 h-3.5" />
                                    {location.text}
                                  </span>
                                  {event.allow_recurring && (
                                    <span className="flex items-center gap-1.5 text-primary">
                                      <Repeat className="w-3 h-3" />
                                      Recurring available
                                    </span>
                                  )}
                                  {event.price_amount && event.price_amount > 0 && (
                                    <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                      ${(event.price_amount / 100).toFixed(2)} {(event.price_currency || "usd").toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Arrow */}
                              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Powered by footer */}
            <p className="text-center text-xs text-muted-foreground mt-8">
              Powered by{" "}
              <a href="/" className="text-primary hover:underline font-medium">
                Bᴏᴏᴋᴍᴇ.ʙᴇᴛ
              </a>
            </p>
          </div>
        </div>
      </>
    );
  }

  // Details step
  if (step === "details") {
    return (
      <>
        <SEO title={dynamicTitle} description={dynamicDescription} />
        <div className="min-h-screen bg-gradient-subtle py-12 px-6">
        <Card className="max-w-2xl mx-auto overflow-hidden border-border shadow-lg">
          <div className="p-8">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Enter Your Details</h2>
              <p className="text-muted-foreground">
                You're booking a {selectedEvent?.duration}-minute {selectedEvent?.title}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
              {/* Timezone confirmation banner on details step */}
              {guestLocalTime && (
                <div className={`flex items-start gap-2 mt-3 rounded-lg px-3 py-2.5 text-sm ${
                  guestLocalTime.dateDiff !== 0
                    ? "bg-destructive/10 border border-destructive/30 text-destructive"
                    : "bg-primary/8 border border-primary/20 text-foreground"
                }`}>
                  {guestLocalTime.dateDiff !== 0 ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                  ) : (
                    <Globe className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">
                      {guestLocalTime.dateDiff !== 0
                        ? "⚠️ Note: This is a different day in your timezone"
                        : "Your local time"}
                    </p>
                    <p className={guestLocalTime.dateDiff !== 0 ? "text-destructive/80" : "text-muted-foreground"}>
                      {guestLocalTime.timeStr}{" "}
                      {guestLocalTime.dateDiff > 0
                        ? "(next day)"
                        : guestLocalTime.dateDiff < 0
                        ? "(previous day)"
                        : ""}{" "}
                      · {getTimezoneLabel(guestTimezone)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleBooking} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name *
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Anything you'd like to discuss?"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingLink" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Meeting Link (Optional)
                </Label>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="https://meet.google.com/... or Zoom link"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meetingLink: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a Google Meet, Zoom, or any video call link. This will be included in the confirmation email.
                </p>
              </div>

              {selectedEvent?.allow_recurring && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-primary" />
                      <Label htmlFor="recurring" className="font-medium">Make this recurring</Label>
                    </div>
                    <Switch
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={setIsRecurring}
                    />
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 pt-4 border-t border-border animate-fade-in">
                      <div className="space-y-2">
                        <Label>Repeat</Label>
                        <Select
                          value={recurrencePattern}
                          onValueChange={(value: "weekly" | "biweekly" | "monthly") => setRecurrencePattern(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Every week</SelectItem>
                            <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                            <SelectItem value="monthly">Every month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ends</Label>
                        <Select
                          value={endType}
                          onValueChange={(value: "count" | "date") => setEndType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="count">After number of sessions</SelectItem>
                            <SelectItem value="date">On a specific date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {endType === "count" ? (
                        <div className="space-y-2">
                          <Label htmlFor="count">Number of sessions</Label>
                          <Input
                            id="count"
                            type="number"
                            min="2"
                            max="52"
                            value={recurrenceCount}
                            onChange={(e) => setRecurrenceCount(Math.min(52, Math.max(2, parseInt(e.target.value) || 2)))}
                          />
                          <p className="text-xs text-muted-foreground">Maximum 52 sessions</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            min={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
                            value={recurrenceEndDate}
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
      </>
    );
  }

  // Selection step (calendar + time)
  return (
    <>
      <SEO title={dynamicTitle} description={dynamicDescription} />
      <div className="min-h-screen bg-gradient-subtle py-8 sm:py-12 px-4 sm:px-6">
      <Card className="max-w-5xl mx-auto overflow-hidden border-border shadow-lg">
        <div className="flex flex-col md:grid md:grid-cols-[2fr,1fr] md:divide-x divide-border">
          <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{selectedEvent?.title}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Select a date and time with {profile?.full_name}
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6">
              <div className="space-y-3 pb-4 sm:pb-6 border-b border-border">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedEvent?.duration} minutes</div>
                    <div className="text-muted-foreground text-xs">Meeting duration</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {getLocationDisplay(selectedEvent?.location_type || null).text}
                    </div>
                    <div className="text-muted-foreground text-xs">Meeting link provided</div>
                  </div>
                </div>
              </div>

              <CalendarGrid
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                availableDates={availableDates}
              />

              {/* Timezone Selector */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Your timezone</span>
                </div>
                <TimezoneSelector
                  value={guestTimezone}
                  onChange={setGuestTimezone}
                  showIcon={false}
                />
              </div>
            </div>
          </div>

          {/* Time slots section - shown below calendar on mobile */}
          <div className="p-4 sm:p-8 bg-muted/30 border-t md:border-t-0 border-border">
            {/* Mobile: Show selected date header */}
            {selectedDate && (
              <div className="md:hidden mb-4 pb-3 border-b border-border">
                <p className="text-sm font-medium text-muted-foreground">
                  Available times for {format(selectedDate, "MMM d")}
                </p>
              </div>
            )}
            
            {slotsLoading ? (
              <div className="flex items-center justify-center h-32 md:h-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <TimeSlotPicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                timeSlots={timeSlots}
                timezone={guestTimezone}
              />
            )}

            {selectedDate && selectedTime && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border animate-fade-in space-y-3">
                {/* Timezone warning */}
                {guestLocalTime && (
                  <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    guestLocalTime.dateDiff !== 0
                      ? "bg-destructive/10 border border-destructive/30 text-destructive"
                      : "bg-primary/8 border border-primary/20 text-foreground"
                  }`}>
                    {guestLocalTime.dateDiff !== 0 ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                    ) : (
                      <Globe className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">
                        {guestLocalTime.dateDiff !== 0
                          ? "⚠️ This time is on a different day in your timezone"
                          : "This time in your timezone"}
                      </p>
                      <p className={guestLocalTime.dateDiff !== 0 ? "text-destructive/80" : "text-muted-foreground"}>
                        {guestLocalTime.timeStr}{" "}
                        {guestLocalTime.dateDiff > 0
                          ? "(next day)"
                          : guestLocalTime.dateDiff < 0
                          ? "(previous day)"
                          : ""}{" "}
                        · {getTimezoneLabel(guestTimezone)}
                      </p>
                    </div>
                  </div>
                )}
                <Button variant="hero" size="lg" className="w-full" onClick={handleConfirm}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
    </>
  );
};

export default PublicBooking;
