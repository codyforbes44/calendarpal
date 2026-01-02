import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useEventType, useCreateEventType, useUpdateEventType, useDeleteEventType } from "@/hooks/useEventTypes";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  duration: z.coerce.number().min(5, "Minimum 5 minutes").max(480, "Maximum 8 hours"),
  color: z.string(),
  is_active: z.boolean(),
  location_type: z.enum(["video", "phone", "in_person"]),
  buffer_before: z.coerce.number().min(0).max(60),
  buffer_after: z.coerce.number().min(0).max(60),
  allow_recurring: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

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
  
  const { data: eventType, isLoading } = useEventType(id);
  const createEventType = useCreateEventType();
  const updateEventType = useUpdateEventType();
  const deleteEventType = useDeleteEventType();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 30,
      color: "#6366f1",
      is_active: true,
      location_type: "video",
      buffer_before: 0,
      buffer_after: 0,
      allow_recurring: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (eventType) {
      form.reset({
        title: eventType.title,
        description: eventType.description || "",
        duration: eventType.duration,
        color: eventType.color || "#6366f1",
        is_active: eventType.is_active,
        location_type: (eventType.location_type || "video") as "video" | "phone" | "in_person",
        buffer_before: eventType.buffer_before || 0,
        buffer_after: eventType.buffer_after || 0,
        allow_recurring: eventType.allow_recurring || false,
      });
    }
  }, [eventType, form]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      if (id) {
        await updateEventType.mutateAsync({
          id,
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          duration: data.duration,
          color: data.color,
          is_active: data.is_active,
          location_type: data.location_type,
          buffer_before: data.buffer_before,
          buffer_after: data.buffer_after,
          allow_recurring: data.allow_recurring,
        });
      } else {
        await createEventType.mutateAsync({
          title: data.title.trim(),
          description: data.description?.trim(),
          duration: data.duration,
          color: data.color,
          is_active: data.is_active,
          location_type: data.location_type,
          buffer_before: data.buffer_before,
          buffer_after: data.buffer_after,
          allow_recurring: data.allow_recurring,
        });
      }
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this event type?")) return;
    
    try {
      await deleteEventType.mutateAsync(id);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isSubmitting = createEventType.isPending || updateEventType.isPending;
  const isDeleting = deleteEventType.isPending;

  if (id && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-32 mb-4 sm:mb-6" />
            <Card className="p-4 sm:p-8 space-y-4 sm:space-y-6">
              <Skeleton className="h-7 sm:h-8 w-48" />
              <Skeleton className="h-5 w-64" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 sm:h-11 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <Card className="p-4 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {id ? "Edit Event Type" : "Create Event Type"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
              {id
                ? "Update your event type settings"
                : "Set up a new meeting type for your schedule"}
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="30 Minute Meeting" 
                          {...field} 
                          className="h-11 sm:h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What is this meeting about?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="5" 
                            max="480" 
                            {...field} 
                            className="h-11 sm:h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 sm:h-10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">Video Call</SelectItem>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Buffer Time Settings */}
                <div className="space-y-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border">
                  <div>
                    <h3 className="font-medium text-sm sm:text-base mb-1">Buffer Time</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Add padding before and after meetings
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buffer_before"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Before meeting</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-10">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buffer_after"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">After meeting</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger className="h-11 sm:h-10">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {colors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => field.onChange(color.value)}
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg transition-all touch-target ${
                                field.value === color.value
                                  ? "ring-2 ring-offset-2 ring-primary scale-110"
                                  : "hover:scale-105"
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <FormLabel className="font-medium text-sm sm:text-base">Active</FormLabel>
                          <FormDescription className="text-xs sm:text-sm">
                            Allow people to book this event
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allow_recurring"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <FormLabel className="font-medium text-sm sm:text-base">Allow Recurring</FormLabel>
                          <FormDescription className="text-xs sm:text-sm">
                            Let guests book repeated sessions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action buttons - stack on mobile */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  {id && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="lg"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full sm:w-auto h-11 sm:h-10"
                    >
                      <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Delete Event</span>
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="flex-1 h-11 sm:h-10"
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Saving..." : id ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
