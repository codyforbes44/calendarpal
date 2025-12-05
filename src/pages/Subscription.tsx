import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Zap,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";

interface SubscriptionData {
  subscribed: boolean;
  plan: string;
  subscription_end: string | null;
  current_period_start: string | null;
  cancel_at_period_end: boolean;
  price_amount: number | null;
  interval: string | null;
}

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error loading subscription:", error);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatPrice = (amount: number | null, interval: string | null) => {
    if (!amount) return "N/A";
    const price = (amount / 100).toFixed(2);
    return `$${price}/${interval === "year" ? "year" : "month"}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-6 pt-24 pb-12 max-w-4xl">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isPro = subscription?.subscribed;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Current Plan Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPro ? (
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                ) : (
                  <div className="p-2 bg-muted rounded-lg">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">
                    {isPro ? "Pro Plan" : "Free Plan"}
                  </CardTitle>
                  <CardDescription>
                    {isPro ? "Full access to all features" : "Basic features included"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={isPro ? "default" : "secondary"} className="text-sm">
                {isPro ? "Active" : "Current Plan"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isPro && subscription ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Billing Amount</p>
                      <p className="font-semibold">
                        {formatPrice(subscription.price_amount, subscription.interval)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {subscription.cancel_at_period_end ? "Expires On" : "Next Billing Date"}
                      </p>
                      <p className="font-semibold">
                        {subscription.subscription_end 
                          ? format(new Date(subscription.subscription_end), "MMM d, yyyy")
                          : "N/A"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-600">Subscription Ending</p>
                      <p className="text-sm text-muted-foreground">
                        Your subscription will end on {format(new Date(subscription.subscription_end!), "MMMM d, yyyy")}. 
                        You can reactivate it anytime before then.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={openCustomerPortal}
                    disabled={portalLoading}
                    className="flex-1"
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opening Portal...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={loadSubscription}
                    className="flex-1 sm:flex-none"
                  >
                    Refresh Status
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Upgrade to Pro</p>
                    <p className="text-sm text-muted-foreground">
                      Get unlimited bookings, advanced integrations, team features, and more.
                    </p>
                  </div>
                </div>
                
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/pricing">
                    <Zap className="w-4 h-4 mr-2" />
                    View Pricing Plans
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-muted-foreground">Free Plan</h4>
                <ul className="space-y-2">
                  {[
                    "1 event type",
                    "10 bookings per month",
                    "Basic calendar integration",
                    "Email notifications",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-primary">Pro Plan</h4>
                <ul className="space-y-2">
                  {[
                    "Unlimited event types",
                    "Unlimited bookings",
                    "Google Calendar sync",
                    "Custom branding",
                    "Priority support",
                    "Team scheduling",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
