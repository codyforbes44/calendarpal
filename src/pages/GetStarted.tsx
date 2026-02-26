import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar, Check, User, Clock, ArrowRight, ArrowLeft,
  Loader2, Eye, EyeOff, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import confetti from "canvas-confetti";
import SEO from "@/components/SEO";
import { siteConfig } from "@/lib/seo-config";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import SocialLoginButton from "@/components/auth/SocialLoginButton";

const GetStarted = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const onboarding = useOnboarding();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Step 4: Registration
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Track whether registration was initiated via the form (to avoid double-persist)
  const [registeredViaForm, setRegisteredViaForm] = useState(false);

  // If user is already authenticated (e.g. OAuth callback), persist data and redirect
  // Skip if registeredViaForm is true — handleRegister already calls persistAndRedirect
  useEffect(() => {
    if (user && step === 4 && !registeredViaForm) {
      persistAndRedirect(user.id);
    }
  }, [user]);

  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (value.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", value)
        .maybeSingle();
      if (error) throw error;
      setUsernameAvailable(!data);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onboarding.setUsername(sanitized);
  };

  useEffect(() => {
    if (onboarding.username.length >= 3) {
      const timer = setTimeout(() => checkUsernameAvailability(onboarding.username), 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [onboarding.username, checkUsernameAvailability]);

  const toggleDay = (index: number) => {
    onboarding.setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, enabled: !day.enabled } : day))
    );
  };

  const persistAndRedirect = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: onboarding.fullName.trim(),
          username: onboarding.username.trim(),
        })
        .eq("user_id", userId);
      if (profileError) throw profileError;

      // 2. Create event type
      const { error: eventError } = await supabase.from("event_types").insert({
        user_id: userId,
        title: onboarding.eventTitle.trim(),
        description: onboarding.eventDescription.trim() || null,
        duration: onboarding.eventDuration,
        is_active: true,
      });
      if (eventError) throw eventError;

      // 3. Save availability
      const enabledDays = onboarding.availability.filter((d) => d.enabled);
      if (enabledDays.length > 0) {
        await supabase.from("availability").delete().eq("user_id", userId);
        const records = enabledDays.map((day) => ({
          user_id: userId,
          day_of_week: day.dayOfWeek,
          start_time: onboarding.startTime,
          end_time: onboarding.endTime,
        }));
        const { error: availError } = await supabase.from("availability").insert(records);
        if (availError) throw availError;
      }

      onboarding.clearOnboardingData();

      // Fire confetti celebration
      const duration = 2000;
      const end = Date.now() + duration;
      const colors = ["hsl(245, 82%, 67%)", "hsl(200, 90%, 60%)", "hsl(340, 80%, 60%)", "hsl(50, 95%, 60%)"];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // Show success screen, then redirect
      setShowSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2800);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(true);
    try {
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }).parse({ email, password });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/get-started`,
          data: {
            full_name: onboarding.fullName.trim(),
            username: onboarding.username.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        setRegisteredViaForm(true);
        await persistAndRedirect(data.user.id);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = onboarding.fullName.trim().length >= 2 && onboarding.username.length >= 3 && usernameAvailable === true;
  const canProceedStep2 = onboarding.eventTitle.trim().length >= 3;
  const canProceedStep3 = onboarding.availability.some((d) => d.enabled);

  return (
    <>
      <SEO
        title="Get Started | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ"
        description="Set up your Bᴏᴏᴋᴍᴇ.ʙᴇᴛ account in minutes — no signup required to start."
        canonical={`${siteConfig.url}/get-started`}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 sm:p-6">
        {showSuccess ? (
          <div className="text-center space-y-6 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold font-display">You're all set!</h1>
              <p className="text-muted-foreground text-base sm:text-lg">Taking you to your dashboard…</p>
            </div>
          </div>
        ) : (
        <Card className="w-full max-w-lg p-6 sm:p-8 animate-scale-in">
          {/* Back link */}
          <div className="mb-4">
            <a href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to home
            </a>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? "w-8 bg-primary" : s < step ? "w-8 bg-primary/40" : "w-2 bg-muted"
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
                    value={onboarding.fullName}
                    onChange={(e) => onboarding.setFullName(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={onboarding.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`h-12 pr-10 ${
                        onboarding.username.length >= 3
                          ? usernameAvailable
                            ? "border-green-500 focus-visible:ring-green-500"
                            : usernameAvailable === false
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                          : ""
                      }`}
                    />
                    {onboarding.username.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingUsername ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : usernameAvailable ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : usernameAvailable === false ? (
                          <span className="text-xs text-destructive font-medium">Taken</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground break-all">
                    Your booking URL: {window.location.host}/book/{onboarding.username || "username"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
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
                    value={onboarding.eventTitle}
                    onChange={(e) => onboarding.setEventTitle(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Description (optional)</Label>
                  <Textarea
                    id="eventDescription"
                    placeholder="A quick chat to discuss your needs..."
                    value={onboarding.eventDescription}
                    onChange={(e) => onboarding.setEventDescription(e.target.value)}
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
                        variant={onboarding.eventDuration === d ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => onboarding.setEventDuration(d)}
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
                <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1 gap-2">
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
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={onboarding.startTime}
                      onChange={(e) => onboarding.setStartTime(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={onboarding.endTime}
                      onChange={(e) => onboarding.setEndTime(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Available Days</Label>
                  <div className="grid grid-cols-7 gap-1">
                    {onboarding.availability.map((day, index) => (
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
                <Button onClick={() => setStep(4)} disabled={!canProceedStep3} className="flex-1 gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Create Account */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Create your account</h1>
                <p className="text-muted-foreground">Last step — secure your profile</p>
              </div>

              {/* Social Login */}
              <SocialLoginButton provider="google" disabled={loading} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {password && <PasswordStrengthMeter password={password} />}

                <div className="flex items-start space-x-3 py-1">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-0.5 h-5 w-5"
                  />
                  <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full h-12"
                  disabled={loading || !acceptedTerms}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </Button>
              </form>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(3)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex-1 text-center text-sm text-muted-foreground self-center">
                  Already have an account?{" "}
                  <a href="/auth" className="text-primary font-medium hover:underline">Sign in</a>
                </div>
              </div>
            </div>
          )}
        </Card>
        )}
      </div>
    </>
  );
};

export default GetStarted;
