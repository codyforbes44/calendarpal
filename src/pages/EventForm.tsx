import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useEventType, useCreateEventType, useUpdateEventType, useDeleteEventType } from "@/hooks/useEventTypes";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EventFormFields from "@/components/event-form/EventFormFields";
import { eventSchema, type EventFormValues } from "@/components/event-form/types";

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
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        duration: data.duration,
        color: data.color,
        is_active: data.is_active,
        location_type: data.location_type,
        buffer_before: data.buffer_before,
        buffer_after: data.buffer_after,
        allow_recurring: data.allow_recurring,
      };

      if (id) {
        await updateEventType.mutateAsync({ id, ...payload });
      } else {
        await createEventType.mutateAsync(payload);
      }
      navigate("/dashboard");
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Are you sure you want to delete this event type?")) return;
    try {
      await deleteEventType.mutateAsync(id);
      navigate("/dashboard");
    } catch {
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
                <EventFormFields form={form} />

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
