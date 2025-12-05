import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import EventTypesList from "@/components/dashboard/EventTypesList";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasEventTypes, setHasEventTypes] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [profileRes, eventTypesRes, availabilityRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single(),
        supabase
          .from("event_types")
          .select("id")
          .eq("user_id", user?.id)
          .limit(1),
        supabase
          .from("availability")
          .select("id")
          .eq("user_id", user?.id)
          .limit(1),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      setHasEventTypes((eventTypesRes.data?.length || 0) > 0);
      setHasAvailability((availabilityRes.data?.length || 0) > 0);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasCompleteProfile = profile?.full_name && profile?.username;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="p-6 border border-border rounded-lg space-y-4">
              <Skeleton className="h-6 w-40" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <div className="p-6 border border-border rounded-lg space-y-4">
              <Skeleton className="h-6 w-32" />
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.full_name || "User"}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your schedule today
            </p>
          </div>
          <Button variant="hero" size="lg" onClick={() => navigate("/events/new")}>
            <Plus className="w-5 h-5 mr-2" />
            New Event Type
          </Button>
        </div>

        {showOnboarding && (
          <OnboardingWizard
            hasProfile={!!hasCompleteProfile}
            hasEventTypes={hasEventTypes}
            hasAvailability={hasAvailability}
            onDismiss={() => setShowOnboarding(false)}
          />
        )}

        <DashboardStats />
        
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <UpcomingMeetings />
          <EventTypesList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
