import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, Check, User, Clock, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { pageSEO, siteConfig } from "@/lib/seo-config";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_AVAILABILITY = [
  { day: "Sunday", dayOfWeek: 0, enabled: false },
  { day: "Monday", dayOfWeek: 1, enabled: true },
  { day: "Tuesday", dayOfWeek: 2, enabled: true },
  { day: "Wednesday", dayOfWeek: 3, enabled: true },
  { day: "Thursday", dayOfWeek: 4, enabled: true },
  { day: "Friday", dayOfWeek: 5, enabled: true },
  { day: "Saturday", dayOfWeek: 6, enabled: false },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Step 1: Profile
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  // Step 2: Event Type
  const [eventTitle, setEventTitle] = useState("30 Minute Meeting");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDuration, setEventDuration] = useState(30);

  // Step 3: Availability
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Pre-fill name from user metadata
    const name = user.user_metadata?.full_name || "";
    setFullName(name);
  }, [user, navigate]);

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", value)
        .neq("user_id", user?.id || "")
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(!data);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
    
    // Debounce the availability check
    const timer = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);
    
    return () => clearTimeout(timer);
  };

  const toggleDay = (index: number) => {
    setAvailability((prev) =>
      prev.map((day, i) =>
        i === index ? { ...day, enabled: !day.enabled } : day
      )
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Create event type
      const { error: eventError } = await supabase.from("event_types").insert({
        user_id: user.id,
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        duration: eventDuration,
        is_active: true,
      });

      if (eventError) throw eventError;

      // Save availability
      const enabledDays = availability.filter((d) => d.enabled);
      if (enabledDays.length > 0) {
        // Delete existing availability
        await supabase.from("availability").delete().eq("user_id", user.id);

        // Insert new availability
        const availabilityRecords = enabledDays.map((day) => ({
          user_id: user.id,
          day_of_week: day.dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        }));

        const { error: availError } = await supabase
          .from("availability")
          .insert(availabilityRecords);

        if (availError) throw availError;
      }

      toast.success("You're all set! Welcome to CalendarPal 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const canProceedStep1 = fullName.trim().length >= 2 && username.length >= 3 && usernameAvailable === true;
  const canProceedStep2 = eventTitle.trim().length >= 3;
  const canProceedStep3 = availability.some((d) => d.enabled);

  return (
    <>
      <SEO
        title={pageSEO.onboarding?.title || "Get Started | CalendarPal"}
        description={pageSEO.onboarding?.description || "Set up your CalendarPal account in minutes"}
        canonical={`${siteConfig.url}/onboarding`}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-6">
        <Card className="w-full max-w-lg p-8 animate-scale-in">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-primary"
                    : s < step
                    ? "w-8 bg-primary/40"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Create your profile</h1>
                <p className="text-muted-foreground">Let's personalize your scheduling experience</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`h-12 pr-10 ${
                        username.length >= 3
                          ? usernameAvailable
                            ? "border-green-500 focus-visible:ring-green-500"
                            : usernameAvailable === false
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                          : ""
                      }`}
                    />
                    {username.length >= 3 && !checkingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameAvailable ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : usernameAvailable === false ? (
                          <span className="text-xs text-destructive">Taken</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your booking URL: calendarpal.com/book/{username || "username"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={handleSkip} className="flex-1">
                  Skip for now
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="flex-1 gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Event Type */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Create your first event</h1>
                <p className="text-muted-foreground">Set up a meeting type people can book with you</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Event Name</Label>
                  <Input
                    id="eventTitle"
                    placeholder="30 Minute Meeting"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Description (optional)</Label>
                  <Textarea
                    id="eventDescription"
                    placeholder="A quick chat to discuss your needs..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant={eventDuration === d ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setEventDuration(d)}
                      >
                        {d}m
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Set your availability</h1>
                <p className="text-muted-foreground">When can people book meetings with you?</p>
              </div>

              <div className="space-y-4">
                {/* Working hours */}
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Days */}
                <div className="space-y-2">
                  <Label>Available Days</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {availability.map((day, index) => (
                      <button
                        key={day.day}
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                          day.enabled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {day.day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!canProceedStep3 || loading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    "Setting up..."
                  ) : (
                    <>
                      Complete Setup <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default Onboarding;
