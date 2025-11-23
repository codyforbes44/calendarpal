import Navigation from "@/components/Navigation";
import AvailabilitySettings from "@/components/calendar/AvailabilitySettings";

const Availability = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <AvailabilitySettings />
        </div>
      </div>
    </div>
  );
};

export default Availability;
