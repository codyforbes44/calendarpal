import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, X } from "lucide-react";
import { Link } from "react-router-dom";

const FREE_PLAN_LIMIT = 10;
const WARNING_THRESHOLD = 7;

export const UpgradePrompt = () => {
  const { user } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const loadUsageData = async () => {
      if (!user) return;

      try {
        // Get user's subscription plan
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_plan")
          .eq("user_id", user.id)
          .single();

        setSubscriptionPlan(profile?.subscription_plan || "free");

        // Get booking count for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const bookingsResult = await (supabase as any)
          .from("bookings")
          .select("id")
          .eq("host_id", user.id)
          .gte("created_at", startOfMonth.toISOString());

        setBookingCount(bookingsResult.data?.length || 0);
      } catch (error) {
        console.error("Error loading usage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsageData();
  }, [user]);

  // Don't show for paid users, loading state, or if dismissed
  if (loading || dismissed || subscriptionPlan !== "free") {
    return null;
  }

  // Don't show if under warning threshold
  if (bookingCount < WARNING_THRESHOLD) {
    return null;
  }

  const remainingBookings = FREE_PLAN_LIMIT - bookingCount;
  const usagePercentage = (bookingCount / FREE_PLAN_LIMIT) * 100;
  const isAtLimit = bookingCount >= FREE_PLAN_LIMIT;

  return (
    <Alert 
      className={`relative mb-6 border-2 ${
        isAtLimit 
          ? "border-destructive bg-destructive/10" 
          : "border-primary/50 bg-primary/5"
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Zap className={`h-5 w-5 ${isAtLimit ? "text-destructive" : "text-primary"}`} />
      
      <AlertTitle className="text-lg font-semibold">
        {isAtLimit 
          ? "You've reached your monthly limit" 
          : `${remainingBookings} booking${remainingBookings === 1 ? "" : "s"} left this month`
        }
      </AlertTitle>
      
      <AlertDescription className="mt-2 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{bookingCount} of {FREE_PLAN_LIMIT} bookings used</span>
            <span className="font-medium">{Math.round(usagePercentage)}%</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>
        
        <p className="text-sm text-muted-foreground">
          {isAtLimit 
            ? "Upgrade to Pro for unlimited bookings and premium features."
            : "Upgrade to Pro for unlimited bookings, advanced integrations, and more."
          }
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
