import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";
import { Link } from "react-router-dom";

export const UpgradePrompt = () => {
  const { isPro, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Don't show for paid users, loading state, or if dismissed
  if (isLoading || dismissed || isPro) {
    return null;
  }

  return (
    <Alert className="relative mb-6 border-2 border-primary/50 bg-primary/5">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Zap className="h-5 w-5 text-primary" />
      
      <AlertTitle className="text-lg font-semibold">
        Unlock Pro Features
      </AlertTitle>
      
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro for unlimited event types, advanced integrations, custom branding, and more.
        </p>
        
        <Button asChild size="sm" className="mt-2">
          <Link to="/pricing">
            <Zap className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};
