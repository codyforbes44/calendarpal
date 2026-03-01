import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const GoogleCalendarSettings = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = profile?.google_calendar_connected || false;

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "get_auth_url" },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Google OAuth in a popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          data.url,
          "google-calendar-auth",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for the callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === "google-calendar-callback" && event.data?.code) {
            window.removeEventListener("message", handleMessage);
            popup?.close();

            // Exchange the code for tokens
            const { error: callbackError } = await supabase.functions.invoke(
              "google-calendar-auth",
              {
                body: {
                  action: "callback",
                  code: event.data.code,
                  userId: user.id,
                },
              }
            );

            if (callbackError) {
              toast.error("Failed to connect Google Calendar");
            } else {
              toast.success("Google Calendar connected successfully!");
              queryClient.invalidateQueries({ queryKey: ["profile"] });
            }
            setConnecting(false);
          }
        };

        window.addEventListener("message", handleMessage);

        // Check if popup was blocked
        if (!popup) {
          window.removeEventListener("message", handleMessage);
          toast.error("Popup blocked. Please allow popups for this site.");
          setConnecting(false);
          return;
        }

        // Handle popup close without completing
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            window.removeEventListener("message", handleMessage);
            setConnecting(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Google Calendar connect error:", error);
      toast.error("Failed to start Google Calendar connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "disconnect" },
      });

      if (error) throw error;

      toast.success("Google Calendar disconnected");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (error) {
      console.error("Google Calendar disconnect error:", error);
      toast.error("Failed to disconnect Google Calendar");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          Google Calendar
        </h2>
        <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
          {isConnected ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Not connected
            </span>
          )}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {isConnected
          ? "Your Google Calendar is connected. New bookings will automatically appear as calendar events, and your existing events will be checked for conflicts."
          : "Connect your Google Calendar to automatically sync bookings and prevent double-bookings by checking your existing events."}
      </p>

      {isConnected ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                New bookings create Google Calendar events
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                Cancelled bookings remove calendar events
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                Existing calendar events block time slots
              </li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full sm:w-auto"
          >
            {disconnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Disconnect Calendar
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="w-full sm:w-auto"
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          Connect Google Calendar
        </Button>
      )}
    </Card>
  );
};

export default GoogleCalendarSettings;
