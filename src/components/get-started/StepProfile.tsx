import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Check, ArrowRight, Loader2 } from "lucide-react";

interface StepProfileProps {
  fullName: string;
  username: string;
  checkingUsername: boolean;
  usernameAvailable: boolean | null;
  canProceed: boolean;
  onFullNameChange: (v: string) => void;
  onUsernameChange: (v: string) => void;
  onNext: () => void;
}

const StepProfile = ({
  fullName,
  username,
  checkingUsername,
  usernameAvailable,
  canProceed,
  onFullNameChange,
  onUsernameChange,
  onNext,
}: StepProfileProps) => (
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
          onChange={(e) => onFullNameChange(e.target.value)}
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
            onChange={(e) => onUsernameChange(e.target.value)}
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
          {username.length >= 3 && (
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
          Your booking URL: {window.location.host}/book/{username || "username"}
        </p>
      </div>
    </div>

    <div className="flex gap-3 pt-4">
      <Button onClick={onNext} disabled={!canProceed} className="flex-1 gap-2">
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

export default StepProfile;
