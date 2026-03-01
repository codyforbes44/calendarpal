import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";

import OnboardingSummary from "@/components/get-started/OnboardingSummary";

interface StepAccountProps {
  email: string;
  password: string;
  showPassword: boolean;
  acceptedTerms: boolean;
  loading: boolean;
  fullName: string;
  username: string;
  eventTitle: string;
  eventDuration: number;
  availability: { day: string; enabled: boolean }[];
  startTime: string;
  endTime: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onToggleShowPassword: () => void;
  onAcceptedTermsChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
}

const StepAccount = ({
  email,
  password,
  showPassword,
  acceptedTerms,
  loading,
  fullName,
  username,
  eventTitle,
  eventDuration,
  availability,
  startTime,
  endTime,
  onEmailChange,
  onPasswordChange,
  onToggleShowPassword,
  onAcceptedTermsChange,
  onSubmit,
  onBack,
  onEditStep,
}: StepAccountProps) => (
  <div className="space-y-5 animate-fade-in">
    <div className="text-center mb-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
        <Shield className="w-7 h-7 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-1">Create your account</h1>
      <p className="text-muted-foreground text-sm">Review your setup, then sign up</p>
    </div>

    <OnboardingSummary
      fullName={fullName}
      username={username}
      eventTitle={eventTitle}
      eventDuration={eventDuration}
      availability={availability}
      startTime={startTime}
      endTime={endTime}
      onEditStep={onEditStep}
    />

    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
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
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className="h-12 pr-12"
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
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
          onCheckedChange={(checked) => onAcceptedTermsChange(checked as boolean)}
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
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account & Go to Dashboard"}
      </Button>
    </form>

    <div className="flex gap-3">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <div className="flex-1 text-center text-sm text-muted-foreground self-center">
        Already have an account?{" "}
        <a href="/auth" className="text-primary font-medium hover:underline">Sign in</a>
      </div>
    </div>
  </div>
);

export default StepAccount;
