import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

interface GuestSaveBannerProps {
  onSignUp?: () => void;
}

const GuestSaveBanner = ({ onSignUp }: GuestSaveBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          You're exploring as a guest
        </p>
        <p className="text-xs text-muted-foreground">
          Sign up to save your setup and start receiving bookings
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onSignUp ? (
          <Button size="sm" onClick={onSignUp} className="h-8 text-xs">
            Save & Sign Up
          </Button>
        ) : (
          <Link to="/auth">
            <Button size="sm" className="h-8 text-xs">
              Save & Sign Up
            </Button>
          </Link>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GuestSaveBanner;
