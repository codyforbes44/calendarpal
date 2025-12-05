import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  duration: z.number().min(5).max(480),
  buffer_before: z.number().min(0).max(60),
  buffer_after: z.number().min(0).max(60),
});

const colors = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Coral", value: "#f97316" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Cyan", value: "#06b6d4" },
];

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 30,
    color: "#6366f1",
    is_active: true,
    location_type: "video" as "video" | "phone" | "in_person",
    buffer_before: 0,
    buffer_after: 0,
  });

  useEffect(() => {
    if (id) {
      loadEventType();
    }
  }, [id]);

  const loadEventType = async () => {
    try {
      const { data, error } = await supabase
        .from("event_types")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          title: data.title,
          description: data.description || "",
          duration: data.duration,
          color: data.color,
          is_active: data.is_active,
          location_type: (data.location_type || "video") as "video" | "phone" | "in_person",
          buffer_before: data.buffer_before || 0,
          buffer_after: data.buffer_after || 0,
        });
      }
    } catch (error) {
      console.error("Error loading event type:", error);
      toast.error("Failed to load event type");
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      eventSchema.parse({
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        buffer_before: formData.buffer_before,
        buffer_after: formData.buffer_after,
      });

      if (id) {
        // Update existing
        const { error } = await supabase
          .from("event_types")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            duration: formData.duration,
            color: formData.color,
            is_active: formData.is_active,
            location_type: formData.location_type,
            buffer_before: formData.buffer_before,
            buffer_after: formData.buffer_after,
          })
          .eq("id", id)
          .eq("user_id", user?.id);

        if (error) throw error;
        toast.success("Event type updated!");
      } else {
        // Create new
        const { error } = await supabase
          .from("event_types")
          .insert({
            user_id: user?.id,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            duration: formData.duration,
            color: formData.color,
            is_active: formData.is_active,
            location_type: formData.location_type,
            buffer_before: formData.buffer_before,
            buffer_after: formData.buffer_after,
          });

        if (error) throw error;
        toast.success("Event type created!");
      }

      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error saving event type:", error);
        toast.error("Failed to save event type");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this event type?")) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("event_types")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast.success("Event type deleted");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting event type:", error);
      toast.error("Failed to delete event type");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-2">
              {id ? "Edit Event Type" : "Create Event Type"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {id
                ? "Update your event type settings"
                : "Set up a new meeting type for your schedule"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="30 Minute Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this meeting about?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_type">Location Type</Label>
                  <Select
                    value={formData.location_type}
                    onValueChange={(value: any) => setFormData({ ...formData, location_type: value })}
                  >
                    <SelectTrigger id="location_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Buffer Time Settings */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <h3 className="font-medium mb-1">Buffer Time</h3>
                  <p className="text-sm text-muted-foreground">
                    Add padding before and after meetings to give yourself a break
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buffer_before">Before meeting (minutes)</Label>
                    <Select
                      value={formData.buffer_before.toString()}
                      onValueChange={(value) => setFormData({ ...formData, buffer_before: parseInt(value) })}
                    >
                      <SelectTrigger id="buffer_before">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No buffer</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buffer_after">After meeting (minutes)</Label>
                    <Select
                      value={formData.buffer_after.toString()}
                      onValueChange={(value) => setFormData({ ...formData, buffer_after: parseInt(value) })}
                    >
                      <SelectTrigger id="buffer_after">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No buffer</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.color === color.value
                          ? "ring-2 ring-offset-2 ring-primary scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="font-medium">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow people to book this event type
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : id ? "Update Event" : "Create Event"}
                </Button>

                {id && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
