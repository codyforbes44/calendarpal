import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEventTypes } from "@/hooks/useEventTypes";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import EventTypesList from "@/components/dashboard/EventTypesList";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import ShareModal from "@/components/ShareModal";
import QuickActions from "@/components/dashboard/QuickActions";
import BookingStatsChart from "@/components/dashboard/BookingStatsChart";
import CalendarHeatmap from "@/components/dashboard/CalendarHeatmap";
import TodaySchedule from "@/components/dashboard/TodaySchedule";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
          <SkeletonDashboard />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Welcome back, {profile?.full_name || "User"}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Here's what's happening with your schedule today
            </p>
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
        
        <QuickActions 
          username={profile?.username} 
          onShare={() => setShowShareModal(true)} 
        />
        
        <div className="mt-6">
          <DashboardStats />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <BookingStatsChart />
          <CalendarHeatmap />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <TodaySchedule />
          <UpcomingMeetings />
        </div>

        <div className="mt-4 sm:mt-6">
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

      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
