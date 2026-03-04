import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, Save } from "lucide-react";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { supabase } from "@/integrations/supabase/client";
import { persistOnboardingData } from "@/lib/onboarding-persist";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface SavePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SavePromptModal = ({ open, onOpenChange }: SavePromptModalProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!inviteCode.trim()) {
      toast.error("Invitation code is required");
      return;
    }

    setLoading(true);
    try {
      // Validate invite code
      const { data: codeResult, error: codeError } = await supabase.functions.invoke(
        "validate-invite-code",
        { body: { code: inviteCode.trim() } }
      );
      if (codeError || !codeResult?.valid) {
        const reason = codeResult?.reason;
        const msg = reason === "not_found" ? "Invalid invitation code"
          : reason === "already_used" ? "This code has already been used"
          : reason === "expired" ? "This code has expired"
          : "Invalid invitation code";
        toast.error(msg);
        setLoading(false);
        return;
      }

      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) { toast.error(error.message); setLoading(false); return; }

      if (data.user) {
        // Redeem code
        await supabase.functions.invoke("validate-invite-code", {
          body: { code: inviteCode.trim(), action: "redeem", userId: data.user.id },
        });

        // Persist onboarding data
        const raw = localStorage.getItem("bookme_onboarding");
        if (raw) {
          const onboarding = JSON.parse(raw);
          await persistOnboardingData(data.user.id, onboarding);
          localStorage.removeItem("bookme_onboarding");
        }

        toast.success("Account created! Your setup has been saved.");
        onOpenChange(false);
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Save className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Save your setup</DialogTitle>
          <DialogDescription className="text-center">
            Create an account to save everything you've configured and start receiving bookings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="save-email">Email</Label>
            <Input id="save-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="save-password">Password</Label>
            <div className="relative">
              <Input id="save-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {password && <PasswordStrengthMeter password={password} />}

          <div className="space-y-2">
            <Label htmlFor="save-invite">Invitation Code</Label>
            <Input id="save-invite" type="text" placeholder="Enter your invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required className="h-11 font-mono tracking-widest" maxLength={20} />
            <p className="text-xs text-muted-foreground">
              Don't have a code? <a href="mailto:support@bookme.bet" className="text-primary hover:underline">Request one</a>
            </p>
          </div>

          <div className="flex items-start space-x-3 py-1">
            <Checkbox id="save-terms" checked={acceptedTerms} onCheckedChange={(c) => setAcceptedTerms(c as boolean)} className="mt-0.5 h-5 w-5" />
            <label htmlFor="save-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the <a href="/terms" className="text-primary hover:underline">Terms</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </label>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading || !acceptedTerms}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account & Save"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account? <a href="/auth" className="text-primary hover:underline">Sign in</a>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default SavePromptModal;
