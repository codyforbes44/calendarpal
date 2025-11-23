import Navigation from "@/components/Navigation";
import BookingFlow from "@/components/BookingFlow";

const Booking = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-6 pt-24 pb-12">
        <BookingFlow />
      </div>
    </div>
  );
};

export default Booking;
