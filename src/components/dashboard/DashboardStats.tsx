import { useAuth } from "@/contexts/AuthContext";
import { useBookingStats } from "@/hooks/useBookings";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, TrendingUp } from "lucide-react";

const DashboardStats = () => {
  const { user } = useAuth();
  const { data: stats } = useBookingStats();

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.total || 0,
      icon: Calendar,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Upcoming",
      value: stats?.upcoming || 0,
      icon: Clock,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Completed",
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      title: "Cancelled",
      value: stats?.cancelled !== undefined ? stats.cancelled : 0,
      icon: TrendingUp,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-4 sm:p-6 group hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{stat.value}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">{stat.title}</div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
