import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import TimeSlotPicker from "@/components/calendar/TimeSlotPicker";
import { useTimeSlots, convertTo24Hour, calculateEndTime } from "@/hooks/useTimeSlots";
import { Calendar, Clock, Video, User, Mail, MessageSquare, ArrowLeft, Check, MapPin, Globe } from "lucide-react";
import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { toast } from "sonner";
import TimezoneSelector from "@/components/TimezoneSelector";
import { getLocalTimezone, getTimezoneLabel } from "@/lib/timezones";
import { getTimezoneAbbr } from "@/hooks/useTimezone";
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

const EmbedBooking = () => {
  const { username } = useParams();
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
  const [formData, setFormData] = useState({ name: "", email: "", notes: "", meetingLink: "" });

  // Custom questions state
  const [customQuestions, setCustomQuestions] = useState<BookingQuestion[]>([]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});

  const { timeSlots, loading: slotsLoading } = useTimeSlots({
    userId: profile?.user_id || "",
    eventTypeId: selectedEvent?.id || "",
    selectedDate,
    duration: selectedEvent?.duration || 30,
    bufferBefore: selectedEvent?.buffer_before || 0,
    bufferAfter: selectedEvent?.buffer_after || 0,
  });

  useEffect(() => {
    if (username) loadProfileAndEvents();
  }, [username]);

  useEffect(() => {
    if (eventTypes.length > 0) {
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
        }
      }
    }
  }, [eventTypes, searchParams]);

  useEffect(() => {
    if (profile?.user_id) loadAvailableDates();
  }, [profile?.user_id]);

  const loadProfileAndEvents = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) { setLoading(false); return; }

      setProfile(profileData as Profile);

      const { data: eventsData, error: eventsError } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", profileData.user_id)
        .eq("is_active", true);

      if (eventsError) throw eventsError;
      setEventTypes(eventsData || []);
    } catch (error) {
      console.error("Error loading embed booking:", error);
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
      const availableDays = [...new Set(data?.map((d) => d.day_of_week) || [])];
      const dates: Date[] = [];
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        if (availableDays.includes(date.getDay())) dates.push(date);
      }
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error loading available dates:", error);
    }
  };

  // Fetch custom questions when event is selected
  useEffect(() => {
    if (!selectedEvent?.id) return;
    supabase
      .from("booking_questions")
      .select("*")
      .eq("event_type_id", selectedEvent.id)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const questions = (data || []).map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
        })) as BookingQuestion[];
        setCustomQuestions(questions);
        setCustomAnswers({});
        setOtherValues({});
      });
  }, [selectedEvent?.id]);

  const resolveCustomAnswers = () => {
    const resolved: Record<string, string | string[]> = {};
    for (const [qId, val] of Object.entries(customAnswers)) {
      if (typeof val === "string" && val === "__other__") {
        resolved[qId] = otherValues[qId] || "Other";
      } else if (Array.isArray(val)) {
        resolved[qId] = val.map((v) => (v === "__other__" ? otherValues[qId] || "Other" : v));
      } else {
        resolved[qId] = val;
      }
    }
    return resolved;
  };

  const validateCustomQuestions = (): boolean => {
    for (const q of customQuestions) {
      if (!q.is_required) continue;
      const answer = customAnswers[q.id];
      if (!answer || (typeof answer === "string" && !answer.trim()) || (Array.isArray(answer) && answer.length === 0)) {
        toast.error(`Please answer: "${q.label}"`);
        return false;
      }
    }
    return true;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedEvent || !profile) return;
    if (!validateCustomQuestions()) return;

    setSubmitting(true);
    try {
      const startTime = convertTo24Hour(selectedTime);
      const endTime = calculateEndTime(startTime, selectedEvent.duration);
      const hostTimezone = profile.timezone || "America/New_York";

      // If paid event, redirect to Stripe Checkout
      if (selectedEvent.price_amount && selectedEvent.price_amount > 0) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking-payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventTypeId: selectedEvent.id,
              hostUserId: profile.user_id,
              scheduledDate: format(selectedDate, "yyyy-MM-dd"),
              startTime,
              endTime,
              guestName: formData.name,
              guestEmail: formData.email,
              guestNotes: formData.notes || null,
              meetingLink: formData.meetingLink.trim() || null,
              hostTimezone,
              guestTimezone,
              priceAmount: selectedEvent.price_amount,
              priceCurrency: selectedEvent.price_currency || "USD",
              eventTitle: selectedEvent.title,
              duration: selectedEvent.duration,
            }),
          }
        );

        const result = await response.json();
        if (result.url) {
          window.location.href = result.url;
          return;
        } else {
          throw new Error(result.error || "Failed to create payment session");
        }
      }

      // Free event: direct booking
      const { data: booking, error } = await supabase.from("bookings").insert({
        host_user_id: profile.user_id,
        event_type_id: selectedEvent.id,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_notes: formData.notes || null,
        meeting_link: formData.meetingLink.trim() || null,
        status: "confirmed",
        host_timezone: hostTimezone,
        guest_timezone: guestTimezone,
      }).select("id, cancellation_token").single();

      if (error) throw error;

      // Send confirmation email
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", profile.user_id)
        .single();

      const manageUrl = `${window.location.origin}/booking/${booking.id}/manage?token=${booking.cancellation_token}`;
      
      await sendConfirmationEmail({
        id: booking.id,
        guestName: formData.name,
        guestEmail: formData.email,
        hostName: profile.full_name || "Host",
        hostEmail: hostProfile?.email || undefined,
        eventTitle: selectedEvent.title,
        scheduledDate: format(selectedDate, "yyyy-MM-dd"),
        startTime,
        endTime,
        duration: selectedEvent.duration,
        guestTimezone,
        hostTimezone,
        meetingLink: formData.meetingLink.trim() || undefined,
        manageUrl,
      });

      setStep("confirmed");

      // Notify parent window
      window.parent.postMessage({
        type: "calendarpal-booking-confirmed",
        booking: {
          id: booking.id,
          guestName: formData.name,
          guestEmail: formData.email,
          eventTitle: selectedEvent.title,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
        },
      }, "*");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to book. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getLocationDisplay = (type: string | null) => {
    switch (type) {
      case "video": return { icon: Video, text: "Video Call" };
      case "phone": return { icon: MapPin, text: "Phone Call" };
      default: return { icon: Video, text: "Video Call" };
    }
  };

  // Theme
  const bookingTheme = profile ? getThemeById(profile.booking_theme || "default") : null;
  const themeCSSVars = bookingTheme ? buildThemeCSSVars(bookingTheme, profile?.custom_brand_color) : {};
  const themeStyle = Object.entries(themeCSSVars).reduce(
    (acc, [key, val]) => {
      acc[key.replace("--booking-", "--")] = val;
      return acc;
    },
    {} as Record<string, string>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  // Confirmed
  if (step === "confirmed") {
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ backgroundColor: `hsl(${themeStyle["--background"] || "var(--background)"})` }}>
        <Card className="max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `hsl(${themeStyle["--primary"] || "var(--primary)"} / 0.1)` }}>
            <Check className="w-6 h-6" style={{ color: `hsl(${themeStyle["--primary"] || "var(--primary)"})` }} />
          </div>
          <h2 className="text-xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your meeting with {profile.full_name} has been scheduled.
          </p>
          <div className="bg-muted rounded-lg p-3 text-left space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{selectedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span>{selectedEvent?.title}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            A confirmation email has been sent to {formData.email}
          </p>
        </Card>
      </div>
    );
  }

  // Event selection
  if (step === "event") {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: `hsl(${themeStyle["--background"] || "var(--background)"})` }}>
        <div className="max-w-md mx-auto">
          {/* Compact header */}
          <div className="text-center mb-6">
            {profile.custom_brand_logo && (
              <img src={profile.custom_brand_logo} alt="Logo" className="h-6 w-auto mx-auto mb-3 object-contain" />
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `hsl(${themeStyle["--primary"] || "var(--primary)"} / 0.15)` }}>
                  <span className="text-sm font-bold" style={{ color: `hsl(${themeStyle["--primary"] || "var(--primary)"})` }}>
                    {profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                  </span>
                </div>
              )}
              <div className="text-left">
                <h1 className="text-lg font-bold">{profile.full_name || username}</h1>
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            {profile.custom_welcome_message && (
              <p className="text-sm text-muted-foreground">{profile.custom_welcome_message}</p>
            )}
          </div>

          {eventTypes.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">No meeting types available.</p>
          ) : (
            <div className="space-y-2">
              {eventTypes.map((event) => {
                const location = getLocationDisplay(event.location_type);
                const LocationIcon = location.icon;
                return (
                  <button
                    key={event.id}
                    onClick={() => { setSelectedEvent(event); setStep("selection"); }}
                    className="w-full text-left rounded-xl border border-border bg-card hover:shadow-md transition-all p-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.color || `hsl(${themeStyle["--primary"] || "var(--primary)"})` }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.description && <p className="text-xs text-muted-foreground truncate">{event.description}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.duration}min</span>
                          <span className="flex items-center gap-1"><LocationIcon className="w-3 h-3" />{location.text}</span>
                          {event.price_amount && event.price_amount > 0 && (
                            <span className="font-medium text-foreground">
                              {new Intl.NumberFormat("en-US", { style: "currency", currency: event.price_currency || "USD" }).format(event.price_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <strong>CalendarPal</strong>
          </p>
        </div>
      </div>
    );
  }

  // Date/time selection
  if (step === "selection") {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: `hsl(${themeStyle["--background"] || "var(--background)"})` }}>
        <div className="max-w-md mx-auto">
          <button onClick={() => { setSelectedEvent(null); setStep("event"); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h2 className="text-lg font-bold mb-1">{selectedEvent?.title}</h2>
          <p className="text-xs text-muted-foreground mb-4">{selectedEvent?.duration} min • {getLocationDisplay(selectedEvent?.location_type || null).text}</p>

          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Your timezone</Label>
            <TimezoneSelector value={guestTimezone} onChange={setGuestTimezone} />
          </div>

          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Select a date</Label>
            <CalendarGrid
              selectedDate={selectedDate}
              onSelectDate={(date) => { setSelectedDate(date); setSelectedTime(null); }}
              availableDates={availableDates}
            />
          </div>

          {selectedDate && (
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">
                Available times — {format(selectedDate, "EEE, MMM d")}
              </Label>
              <TimeSlotPicker
                timeSlots={timeSlots}
                selectedTime={selectedTime}
                onSelectTime={setSelectedTime}
                selectedDate={selectedDate}
                timezone={guestTimezone}
              />
            </div>
          )}

          {selectedDate && selectedTime && (
            <Button variant="hero" className="w-full" onClick={() => setStep("details")}>
              Continue
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Details form
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: `hsl(${themeStyle["--background"] || "var(--background)"})` }}>
      <div className="max-w-md mx-auto">
        <button onClick={() => setStep("selection")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <Card className="p-5">
          <h2 className="text-lg font-bold mb-4">Your Details</h2>
          <div className="bg-muted rounded-lg p-3 mb-4 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{selectedDate && format(selectedDate, "EEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{selectedTime} ({getTimezoneAbbr(guestTimezone)})</span>
            </div>
            {selectedEvent?.price_amount && selectedEvent.price_amount > 0 && (
              <div className="flex items-center gap-2 font-medium">
                <span>💳</span>
                <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: selectedEvent.price_currency || "USD" }).format(selectedEvent.price_amount)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleBooking} className="space-y-3">
            <div>
              <Label className="text-sm">Name *</Label>
              <Input required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="h-10" />
            </div>
            <div>
              <Label className="text-sm">Email *</Label>
              <Input type="email" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="h-10" />
            </div>
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={2} className="resize-none" />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
              {submitting ? "Processing..." : selectedEvent?.price_amount && selectedEvent.price_amount > 0 ? "Continue to Payment" : "Confirm Booking"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by <strong>CalendarPal</strong>
        </p>
      </div>
    </div>
  );
};

export default EmbedBooking;
