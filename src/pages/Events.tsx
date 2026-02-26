import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import EventTypesList from "@/components/dashboard/EventTypesList";
import SEO from "@/components/SEO";

const Events = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO
        title="Event Types | BookMe.Bet"
        description="Manage your event types. Create, edit, and share booking links for your meetings."
        noindex
      />
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Event Types
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage the types of meetings you offer
          </p>
        </div>

        <EventTypesList />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Events;
