import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import AvailabilitySettings from "@/components/calendar/AvailabilitySettings";

const Availability = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        <div className="max-w-4xl mx-auto">
          <AvailabilitySettings />
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Availability;
