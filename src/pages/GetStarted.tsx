import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import SEO from "@/components/SEO";
import { siteConfig } from "@/lib/seo-config";
import { fireConfetti } from "@/lib/confetti";
import { persistOnboardingData } from "@/lib/onboarding-persist";

import StepProfile from "@/components/get-started/StepProfile";
import StepEvent from "@/components/get-started/StepEvent";
import StepAvailability from "@/components/get-started/StepAvailability";
import StepAccount from "@/components/get-started/StepAccount";
import SuccessScreen from "@/components/get-started/SuccessScreen";

const GetStarted = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const onboarding = useOnboarding();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Step 4 local state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registeredViaForm, setRegisteredViaForm] = useState(false);

  // Refs for cleanup
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const confettiCleanupRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      confettiCleanupRef.current?.();
    };
  }, []);

  // --- Persistence ---

  const persistAndRedirect = useCallback(
    async (userId: string) => {
      setLoading(true);
      try {
        await persistOnboardingData(userId, {
          fullName: onboarding.fullName,
          username: onboarding.username,
          eventTitle: onboarding.eventTitle,
          eventDescription: onboarding.eventDescription,
          eventDuration: onboarding.eventDuration,
          availability: onboarding.availability,
          startTime: onboarding.startTime,
          endTime: onboarding.endTime,
        });

        onboarding.clearOnboardingData();

        confettiCleanupRef.current = fireConfetti();
        setShowSuccess(true);
        redirectTimerRef.current = setTimeout(
          () => navigate("/dashboard", { replace: true }),
          2800
        );
      } catch (error: any) {
        toast.error(error.message || "Failed to complete setup");
      } finally {
        setLoading(false);
      }
    },
    [onboarding, navigate]
  );

  // OAuth callback: if user lands on step 4 already authenticated, persist automatically
  useEffect(() => {
    if (user && step === 4 && !registeredViaForm) {
      persistAndRedirect(user.id);
    }
  }, [user, step, registeredViaForm, persistAndRedirect]);

  // --- Username check ---

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
    onboarding.setUsername(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  useEffect(() => {
    if (onboarding.username.length >= 3) {
      const timer = setTimeout(() => checkUsernameAvailability(onboarding.username), 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [onboarding.username, checkUsernameAvailability]);

  // --- Day toggle ---

  const toggleDay = (index: number) => {
    onboarding.setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, enabled: !day.enabled } : day))
    );
  };

  // --- Registration ---

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

  // --- Validation ---

  const canProceedStep1 =
    onboarding.fullName.trim().length >= 2 &&
    onboarding.username.length >= 3 &&
    usernameAvailable === true;
  const canProceedStep2 = onboarding.eventTitle.trim().length >= 3;
  const canProceedStep3 = onboarding.availability.some((d) => d.enabled);

  // --- Keyboard navigation ---

  useEffect(() => {
    if (showSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Enter" && !isInput) {
        e.preventDefault();
        if (step === 1 && canProceedStep1) setStep(2);
        else if (step === 2 && canProceedStep2) setStep(3);
        else if (step === 3 && canProceedStep3) setStep(4);
        // Step 4 uses form submit, handled natively
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
        else if (step === 4) setStep(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, showSuccess, canProceedStep1, canProceedStep2, canProceedStep3]);

  // --- Render ---

  return (
    <>
      <SEO
        title="Get Started | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ"
        description="Set up your Bᴏᴏᴋᴍᴇ.ʙᴇᴛ account in minutes — no signup required to start."
        canonical={`${siteConfig.url}/get-started`}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 sm:p-6">
        {showSuccess ? (
          <SuccessScreen />
        ) : (
          <Card className="w-full max-w-lg p-6 sm:p-8 animate-scale-in">
            <div className="mb-4">
              <a href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to home
              </a>
            </div>

            {/* Progress indicator with labels */}
            <div className="flex items-center justify-between gap-1 mb-8 px-2">
              {[
                { num: 1, label: "Profile" },
                { num: 2, label: "Event" },
                { num: 3, label: "Hours" },
                { num: 4, label: "Account" },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`h-2 w-full max-w-12 rounded-full transition-all duration-300 ${
                      s.num === step ? "bg-primary" : s.num < step ? "bg-primary/40" : "bg-muted"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      s.num === step ? "text-primary" : s.num < step ? "text-primary/50" : "text-muted-foreground/60"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <StepProfile
                fullName={onboarding.fullName}
                username={onboarding.username}
                checkingUsername={checkingUsername}
                usernameAvailable={usernameAvailable}
                canProceed={canProceedStep1}
                onFullNameChange={onboarding.setFullName}
                onUsernameChange={handleUsernameChange}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepEvent
                eventTitle={onboarding.eventTitle}
                eventDescription={onboarding.eventDescription}
                eventDuration={onboarding.eventDuration}
                canProceed={canProceedStep2}
                onTitleChange={onboarding.setEventTitle}
                onDescriptionChange={onboarding.setEventDescription}
                onDurationChange={onboarding.setEventDuration}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <StepAvailability
                availability={onboarding.availability}
                startTime={onboarding.startTime}
                endTime={onboarding.endTime}
                canProceed={canProceedStep3}
                onToggleDay={toggleDay}
                onStartTimeChange={onboarding.setStartTime}
                onEndTimeChange={onboarding.setEndTime}
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
              />
            )}

            {step === 4 && (
              <StepAccount
                email={email}
                password={password}
                showPassword={showPassword}
                acceptedTerms={acceptedTerms}
                loading={loading}
                fullName={onboarding.fullName}
                username={onboarding.username}
                eventTitle={onboarding.eventTitle}
                eventDuration={onboarding.eventDuration}
                availability={onboarding.availability}
                startTime={onboarding.startTime}
                endTime={onboarding.endTime}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onToggleShowPassword={() => setShowPassword(!showPassword)}
                onAcceptedTermsChange={setAcceptedTerms}
                onSubmit={handleRegister}
                onBack={() => setStep(3)}
                onEditStep={(s) => setStep(s)}
              />
            )}
          </Card>
        )}
      </div>
    </>
  );
};

export default GetStarted;
