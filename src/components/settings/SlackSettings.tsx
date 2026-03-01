import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Hash, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";

const SlackSettings = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("slack_notifications_enabled, slack_channel_id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setEnabled(data.slack_notifications_enabled ?? false);
          setChannelId(data.slack_channel_id ?? "");
        }
        setLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        slack_notifications_enabled: enabled,
        slack_channel_id: channelId || null,
      } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save Slack settings");
    } else {
      toast.success("Slack settings saved");
    }
  };

  const handleTestNotification = async () => {
    if (!user || !channelId) return;
    setTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke("slack-notify", {
        body: {
          type: "booking_confirmed",
          booking: {
            id: "test-notification",
            guestName: "Test Guest",
            guestEmail: "test@example.com",
            hostName: "You",
            eventTitle: "Test Notification",
            scheduledDate: new Date().toISOString().split("T")[0],
            startTime: "10:00",
            duration: 30,
          },
          hostUserId: user.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Test notification sent! Check your Slack channel.");
      } else {
        toast.error(data?.reason || data?.error || "Failed to send test notification");
      }
    } catch (err) {
      toast.error("Failed to send test notification");
    } finally {
      setTesting(false);
    }
  };

  if (!loaded) return null;

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
        Slack Notifications
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-5">
        Get real-time booking alerts in your Slack workspace
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Enable Slack Alerts</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive booking notifications in a Slack channel
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Enable Slack notifications"
          />
        </div>

        {enabled && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div>
              <Label htmlFor="slack-channel" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Channel ID
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                The Slack channel ID where notifications will be sent (e.g. C01ABCDEF23)
              </p>
              <Input
                id="slack-channel"
                placeholder="C01ABCDEF23"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value.trim())}
                className="h-10 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Right-click a channel in Slack → "View channel details" → copy the Channel ID
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !channelId}
                variant="hero"
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Save Slack Settings"}
              </Button>
              <Button
                onClick={handleTestNotification}
                disabled={testing || !channelId}
                variant="outline"
                className="w-full sm:w-auto gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {testing ? "Sending..." : "Send Test Notification"}
              </Button>
            </div>
          </div>
        )}

        {!enabled && (
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default SlackSettings;
