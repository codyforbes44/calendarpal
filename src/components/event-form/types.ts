import { z } from "zod";

export const eventSchema = z.object({
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

export type EventFormValues = z.infer<typeof eventSchema>;

export const EVENT_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Coral", value: "#f97316" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Cyan", value: "#06b6d4" },
];
