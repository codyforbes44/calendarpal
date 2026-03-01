import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import BookingFlow from "@/components/BookingFlow";

const Booking = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        <BookingFlow />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Booking;
