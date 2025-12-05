import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { toast } from "sonner";
import TimezoneSelector from "@/components/TimezoneSelector";
import { getLocalTimezone, getTimezoneLabel } from "@/lib/timezones";
import { getTimezoneAbbr } from "@/hooks/useTimezone";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  timezone: string | null;
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
}

const PublicBooking = () => {
  const { username, eventSlug } = useParams();
  const navigate = useNavigate();
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
  });

  const { timeSlots, loading: slotsLoading } = useTimeSlots({
    userId: profile?.user_id || "",
    eventTypeId: selectedEvent?.id || "",
    selectedDate,
    duration: selectedEvent?.duration || 30,
    bufferBefore: selectedEvent?.buffer_before || 0,
    bufferAfter: selectedEvent?.buffer_after || 0,
  });

  useEffect(() => {
    if (username) {
      loadProfileAndEvents();
    }
  }, [username]);

  useEffect(() => {
    if (eventSlug && eventTypes.length > 0) {
      const event = eventTypes.find(
        (e) => e.title.toLowerCase().replace(/\s+/g, "-") === eventSlug
      );
      if (event) {
        setSelectedEvent(event);
        setStep("selection");
      }
    }
  }, [eventSlug, eventTypes]);

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

  const handleEventSelect = (event: EventType) => {
    setSelectedEvent(event);
    setStep("selection");
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

      const { data, error } = await supabase.from("bookings").insert({
        host_user_id: profile.user_id,
        event_type_id: selectedEvent.id,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        guest_name: formData.name,
        guest_email: formData.email,
        guest_notes: formData.notes || null,
        status: "confirmed",
        host_timezone: hostTimezone,
        guest_timezone: guestTimezone,
      }).select("id, cancellation_token").single();

      if (error) throw error;

      setCreatedBookingId(data.id);
      setCancellationToken(data.cancellation_token);
      setStep("confirmed");
      toast.success("Meeting booked successfully!");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    );
  }

  // Confirmed step
  if (step === "confirmed") {
    const manageUrl = createdBookingId && cancellationToken
      ? `${window.location.origin}/booking/${createdBookingId}/manage?token=${cancellationToken}`
      : null;

    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
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
    );
  }

  // Event selection step
  if (step === "event") {
    return (
      <div className="min-h-screen bg-gradient-subtle py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
            <p className="text-muted-foreground">Select a meeting type</p>
          </div>

          {eventTypes.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No event types available</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {eventTypes.map((event) => {
                const location = getLocationDisplay(event.location_type);
                return (
                  <Card
                    key={event.id}
                    className="p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4"
                    style={{ borderLeftColor: event.color || "hsl(var(--primary))" }}
                    onClick={() => handleEventSelect(event)}
                  >
                    <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-muted-foreground text-sm mb-4">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <location.icon className="w-4 h-4" />
                        <span>{location.text}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Details step
  if (step === "details") {
    return (
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

              <div className="flex items-center gap-4 mt-4 p-4 bg-muted rounded-lg">
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
                  rows={4}
                />
              </div>

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
    );
  }

  // Selection step (calendar + time)
  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-6">
      <Card className="max-w-5xl mx-auto overflow-hidden border-border shadow-lg">
        <div className="grid md:grid-cols-[2fr,1fr] divide-x divide-border">
          <div className="p-8 space-y-6">
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedEvent?.title}</h2>
              <p className="text-muted-foreground">
                Select a date and time with {profile?.full_name}
              </p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-3 pb-6 border-b border-border">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedEvent?.duration} minutes</div>
                    <div className="text-muted-foreground text-xs">Meeting duration</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-accent" />
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

          <div className="p-8 bg-muted/30">
            {slotsLoading ? (
              <div className="flex items-center justify-center h-full">
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
              <div className="mt-6 pt-6 border-t border-border animate-fade-in">
                <Button variant="hero" size="lg" className="w-full" onClick={handleConfirm}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PublicBooking;
