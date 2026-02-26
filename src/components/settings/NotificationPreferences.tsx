import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, CalendarPlus, CalendarX, CalendarClock, Clock } from "lucide-react";
import { toast } from "sonner";

interface NotificationPrefs {
  booking_created: boolean;
  booking_cancelled: boolean;
  booking_rescheduled: boolean;
  reminder: boolean;
}

const defaultPrefs: NotificationPrefs = {
  booking_created: true,
  booking_cancelled: true,
  booking_rescheduled: true,
  reminder: true,
};

const prefItems = [
  {
    key: "booking_created" as const,
    label: "New Bookings",
    description: "When someone books a meeting with you",
    icon: CalendarPlus,
    color: "text-success",
  },
  {
    key: "booking_cancelled" as const,
    label: "Cancellations",
    description: "When a guest cancels their booking",
    icon: CalendarX,
    color: "text-destructive",
  },
  {
    key: "booking_rescheduled" as const,
    label: "Reschedules",
    description: "When a guest reschedules their booking",
    icon: CalendarClock,
    color: "text-warning",
  },
  {
    key: "reminder" as const,
    label: "Reminders",
    description: "Upcoming meeting reminders",
    icon: Clock,
    color: "text-info",
  },
];

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_preferences) {
          setPrefs({ ...defaultPrefs, ...(data.notification_preferences as unknown as NotificationPrefs) });
        }
      });
  }, [user]);

  const handleToggle = async (key: keyof NotificationPrefs) => {
    if (!user) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ notification_preferences: updated } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      setPrefs(prefs); // revert
      toast.error("Failed to save preference");
    } else {
      toast.success("Preference updated");
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        Notification Preferences
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-5">
        Choose which notifications you want to receive
      </p>

      <div className="space-y-4">
        {prefItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
            <Switch
              id={item.key}
              checked={prefs[item.key]}
              onCheckedChange={() => handleToggle(item.key)}
              disabled={saving}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NotificationPreferences;
