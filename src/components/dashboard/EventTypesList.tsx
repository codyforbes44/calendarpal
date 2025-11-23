import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventType {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  color: string;
  is_active: boolean;
}

const EventTypesList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEventTypes();
    }
  }, [user]);

  const loadEventTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEventTypes(data || []);
    } catch (error) {
      console.error("Error loading event types:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Event Types</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Event Types</h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/events/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      {eventTypes.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No event types yet</p>
          <Button variant="hero" onClick={() => navigate("/events/new")}>
            Create Your First Event
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/events/${eventType.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <h3 className="font-semibold">{eventType.title}</h3>
                    {eventType.is_active ? (
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {eventType.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{eventType.duration} minutes</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default EventTypesList;
