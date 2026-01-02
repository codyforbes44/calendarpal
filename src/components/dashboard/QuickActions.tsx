import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Plus, Calendar, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface QuickActionsProps {
  username?: string | null;
  onShare: () => void;
}

const QuickActions = ({ username, onShare }: QuickActionsProps) => {
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
