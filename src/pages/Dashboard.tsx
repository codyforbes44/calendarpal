import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useGuestMode } from "@/hooks/useGuestMode";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import GuestSaveBanner from "@/components/GuestSaveBanner";
import SavePromptModal from "@/components/SavePromptModal";
import { Share2 } from "lucide-react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import UpcomingMeetings from "@/components/dashboard/UpcomingMeetings";
import EventTypesList from "@/components/dashboard/EventTypesList";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import ShareModal from "@/components/ShareModal";
import QuickActions from "@/components/dashboard/QuickActions";
import BookingStatsChart from "@/components/dashboard/BookingStatsChart";
import BookingAnalytics from "@/components/dashboard/BookingAnalytics";
import CalendarHeatmap from "@/components/dashboard/CalendarHeatmap";
import ConversionFunnel from "@/components/dashboard/ConversionFunnel";
import PopularTimesChart from "@/components/dashboard/PopularTimesChart";
import TodaySchedule from "@/components/dashboard/TodaySchedule";
import AIChatbot from "@/components/dashboard/AIChatbot";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
import { supabase } from "@/integrations/supabase/client";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const Dashboard = () => {
  const { user } = useAuth();
  const onboarding = useOnboarding();
  const isGuest = !user;
  const { showSaveModal, setShowSaveModal, promptSave } = useGuestMode();
  const [hasAvailability, setHasAvailability] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: eventTypes, isLoading: eventTypesLoading } = useEventTypes();

  useEffect(() => {
    if (user) {
      checkAvailability();
    } else if (isGuest) {
      const guestAvail = onboarding.availability.some(d => d.enabled);
      setHasAvailability(guestAvail);
    }
  }, [user, isGuest]);

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

  const guestName = isGuest ? (onboarding.fullName || "Explorer") : null;
  const displayName = isGuest ? guestName : (profile?.full_name?.split(" ")[0] || "there");
  const displayUsername = isGuest ? onboarding.username : profile?.username;

  const loading = !isGuest && (profileLoading || eventTypesLoading);
  const hasEventTypes = isGuest ? !!onboarding.eventTitle : (eventTypes?.length || 0) > 0;
  const hasCompleteProfile = isGuest ? !!(onboarding.fullName && onboarding.username) : !!(profile?.full_name && profile?.username);

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
        {isGuest && <GuestSaveBanner onSignUp={promptSave} />}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              {getGreeting()}, {displayName}!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Here's what's happening with your schedule today
            </p>
            {!isGuest && profile?.google_calendar_connected && (
              <p className="text-xs text-primary flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Google Calendar synced
              </p>
            )}
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
        
        <QuickActions 
          username={displayUsername} 
          onShare={() => setShowShareModal(true)}
          hasEventTypes={hasEventTypes}
          hasAvailability={hasAvailability}
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

        <div className="mt-4 sm:mt-6">
          <BookingAnalytics />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <ConversionFunnel />
          <PopularTimesChart />
        </div>
      </div>

      {!isGuest && profile?.username && (
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          username={profile.username}
          fullName={profile.full_name || ""}
        />
      )}

      {!isGuest && profile?.username && (
        <button
          onClick={() => setShowShareModal(true)}
          className="fixed bottom-20 right-4 z-40 flex sm:hidden items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
          aria-label="Share booking link"
        >
          <Share2 className="w-6 h-6" />
        </button>
      )}

      {!isGuest && <AIChatbot />}
      <BottomNavigation />
      {isGuest && <SavePromptModal open={showSaveModal} onOpenChange={setShowSaveModal} />}
    </div>
  );
};

export default Dashboard;
