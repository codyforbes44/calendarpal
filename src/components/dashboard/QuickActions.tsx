import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Plus, Calendar, Share2, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface QuickActionsProps {
  username?: string | null;
  onShare: () => void;
  hasEventTypes?: boolean;
  hasAvailability?: boolean;
}

const QuickActions = ({ username, onShare, hasEventTypes = true, hasAvailability = true }: QuickActionsProps) => {
  const navigate = useNavigate();

  const copyBookingLink = () => {
    if (!username) {
      toast.error("Please set your username first");
      return;
    }
    const link = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(link);
    toast.success("Booking link copied to clipboard!");
  };

  // Smart suggestion based on user state
  const suggestion = !username
    ? { text: "Complete your profile to get a booking link", action: () => navigate("/settings"), label: "Set Up Profile" }
    : !hasEventTypes
    ? { text: "Create your first event type to start accepting bookings", action: () => navigate("/events/new"), label: "Create Event" }
    : !hasAvailability
    ? { text: "Set your availability so guests can book with you", action: () => navigate("/availability"), label: "Set Availability" }
    : null;

  const actions = [
    {
      icon: Plus,
      label: "New Event Type",
      description: "Create a new booking type",
      onClick: () => navigate("/events/new"),
      variant: "default" as const,
    },
    {
      icon: Link2,
      label: "Copy Link",
      description: "Share your booking page",
      onClick: copyBookingLink,
      variant: "outline" as const,
    },
    {
      icon: Share2,
      label: "Share",
      description: "Share via QR or social",
      onClick: onShare,
      variant: "outline" as const,
    },
    {
      icon: Calendar,
      label: "View Bookings",
      description: "See all your meetings",
      onClick: () => navigate("/bookings"),
      variant: "outline" as const,
    },
  ];

  return (
    <Card className="p-4 sm:p-6">
      {suggestion && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Lightbulb className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">{suggestion.text}</p>
          <Button size="sm" variant="outline" onClick={suggestion.action} className="shrink-0">
            {suggestion.label}
          </Button>
        </div>
      )}
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="h-auto flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[72px] sm:min-h-[80px]"
            onClick={action.onClick}
          >
            <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-xs sm:text-sm">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
