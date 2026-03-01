import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, CalendarPlus, CalendarX, CalendarClock, Clock } from "lucide-react";
import { toast } from "sonner";

interface NotificationPrefs {
  booking_created: boolean;
  booking_cancelled: boolean;
  booking_rescheduled: boolean;
  reminder: boolean;
  email_booking_created: boolean;
  email_booking_cancelled: boolean;
  email_booking_rescheduled: boolean;
  email_reminder: boolean;
  slack_booking_created: boolean;
  slack_booking_cancelled: boolean;
  slack_booking_rescheduled: boolean;
}

const defaultPrefs: NotificationPrefs = {
  booking_created: true,
  booking_cancelled: true,
  booking_rescheduled: true,
  reminder: true,
  email_booking_created: true,
  email_booking_cancelled: true,
  email_booking_rescheduled: true,
  email_reminder: true,
  slack_booking_created: true,
  slack_booking_cancelled: true,
  slack_booking_rescheduled: true,
};

const prefItems = [
  {
    inAppKey: "booking_created" as const,
    emailKey: "email_booking_created" as const,
    slackKey: "slack_booking_created" as const,
    label: "New Bookings",
    description: "When someone books a meeting with you",
    icon: CalendarPlus,
    color: "text-success",
  },
  {
    inAppKey: "booking_cancelled" as const,
    emailKey: "email_booking_cancelled" as const,
    slackKey: "slack_booking_cancelled" as const,
    label: "Cancellations",
    description: "When a guest cancels their booking",
    icon: CalendarX,
    color: "text-destructive",
  },
  {
    inAppKey: "booking_rescheduled" as const,
    emailKey: "email_booking_rescheduled" as const,
    slackKey: "slack_booking_rescheduled" as const,
    label: "Reschedules",
    description: "When a guest reschedules their booking",
    icon: CalendarClock,
    color: "text-warning",
  },
  {
    inAppKey: "reminder" as const,
    emailKey: "email_reminder" as const,
    slackKey: undefined,
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
      setPrefs(prefs);
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
        Choose which notifications you want to receive and how
      </p>

      {/* Channel headers */}
      <div className="flex items-center justify-end gap-4 sm:gap-6 mb-3 pr-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Bell className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">In-App</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Email</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Slack</span>
        </div>
      </div>

      <div className="space-y-4">
        {prefItems.map((item) => (
          <div
            key={item.inAppKey}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`mt-0.5 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <Label className="text-sm font-medium">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <Switch
                id={item.inAppKey}
                checked={prefs[item.inAppKey]}
                onCheckedChange={() => handleToggle(item.inAppKey)}
                disabled={saving}
                aria-label={`${item.label} in-app`}
              />
              <Switch
                id={item.emailKey}
                checked={prefs[item.emailKey]}
                onCheckedChange={() => handleToggle(item.emailKey)}
                disabled={saving}
                aria-label={`${item.label} email`}
              />
              {item.slackKey ? (
                <Switch
                  id={item.slackKey}
                  checked={prefs[item.slackKey]}
                  onCheckedChange={() => handleToggle(item.slackKey)}
                  disabled={saving}
                  aria-label={`${item.label} slack`}
                />
              ) : (
                <div className="w-[36px]" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NotificationPreferences;
