import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEventTypes } from "@/hooks/useEventTypes";
import Navigation from "@/components/Navigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import EventTypesList from "@/components/dashboard/EventTypesList";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import ShareModal from "@/components/ShareModal";
import { Button } from "@/components/ui/button";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
import { Plus, Share2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasAvailability, setHasAvailability] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes();

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      toast.success("Welcome to Pro! Your subscription is now active.");
      searchParams.delete("checkout");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user) {
      checkAvailability();
    }
  }, [user]);

  const checkAvailability = async () => {
    try {
      const { data } = await supabase
        .from("availability")
        .select("id")
        .eq("user_id", user?.id)
        .limit(1);
      
      setHasAvailability((data?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  const loading = profileLoading || eventTypesLoading;
  const hasEventTypes = (eventTypes?.length || 0) > 0;
  const hasCompleteProfile = profile?.full_name && profile?.username;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <SkeletonDashboard />
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
          <div className="flex gap-3">
            {profile?.username && (
              <Button variant="outline" size="lg" onClick={() => setShowShareModal(true)}>
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            )}
            <Button variant="hero" size="lg" onClick={() => navigate("/events/new")}>
              <Plus className="w-5 h-5 mr-2" />
              New Event Type
            </Button>
          </div>
        </div>

        {showOnboarding && (
          <OnboardingWizard
            hasProfile={!!hasCompleteProfile}
            hasEventTypes={hasEventTypes}
            hasAvailability={hasAvailability}
            onDismiss={() => setShowOnboarding(false)}
          />
        )}

        <UpgradePrompt />
        <DashboardStats />
        
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <UpcomingMeetings />
          <EventTypesList />
        </div>
      </div>

      {profile?.username && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          username={profile.username}
          fullName={profile.full_name || ""}
        />
      )}
    </div>
  );
};

export default Dashboard;
