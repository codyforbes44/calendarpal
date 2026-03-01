import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, DollarSign } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AIGenerateButton from "./AIGenerateButton";
import BufferTimeSettings from "./BufferTimeSettings";
import { EVENT_COLORS, type EventFormValues } from "./types";
import { useSubscription } from "@/hooks/useSubscription";

function getLocationLabel(type: string) {
  return type === "video" ? "video call" : type === "phone" ? "phone call" : "in-person meeting";
}

interface EventFormFieldsProps {
  form: UseFormReturn<EventFormValues>;
}

const EventFormFields = ({ form }: EventFormFieldsProps) => {
  const { isPro } = useSubscription();

  return (
    <>
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Event Title *</FormLabel>
              <AIGenerateButton
                label="AI Suggest"
                regenerateLabel="Regenerate"
                getCurrentValue={() => form.getValues("title")}
                onGenerated={(v) => form.setValue("title", v, { shouldDirty: true })}
                buildPrompt={() => {
                  const duration = form.getValues("duration");
                  const loc = getLocationLabel(form.getValues("location_type"));
                  return `Suggest 1 short, professional event title (3-5 words max) for a ${duration}-minute ${loc} on a scheduling platform. Just return the title text, nothing else. No quotes, no explanation.`;
                }}
              />
            </div>
            <FormControl>
              <Input placeholder="30 Minute Meeting" {...field} className="h-11 sm:h-10" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Description</FormLabel>
              <AIGenerateButton
                label="AI Generate"
                regenerateLabel="Regenerate"
                getCurrentValue={() => form.getValues("description") || ""}
                onGenerated={(v) => form.setValue("description", v, { shouldDirty: true })}
                validate={() => {
                  const title = form.getValues("title");
                  return title.trim() ? null : "Enter an event title first.";
                }}
                buildPrompt={() => {
                  const title = form.getValues("title");
                  const duration = form.getValues("duration");
                  const loc = getLocationLabel(form.getValues("location_type"));
                  return `Write a short, professional booking page description (2-3 sentences, under 80 words) for a ${duration}-minute ${loc} called "${title}". Make it welcoming and tell the guest what to expect. Do not use markdown. Do not include the title or duration in the description.`;
                }}
              />
            </div>
            <FormControl>
              <Textarea placeholder="What is this meeting about?" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Duration & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes) *</FormLabel>
              <FormControl>
                <Input type="number" min="5" max="480" {...field} className="h-11 sm:h-10" />
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

      {/* Buffer Time */}
      <BufferTimeSettings form={form} />

      {/* Color Picker */}
      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {EVENT_COLORS.map((color) => (
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

      {/* Toggle Switches */}
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
                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Pricing (Pro only) */}
      <div className={`space-y-4 p-3 sm:p-4 rounded-lg border border-border ${!isPro ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span className="font-medium text-sm">Session Pricing</span>
          {!isPro && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Crown className="w-3 h-3" /> Pro
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="price_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Price (cents)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    disabled={!isPro}
                    {...field}
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  e.g. 2500 = $25.00
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price_currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isPro}
                >
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {!isPro && (
          <p className="text-xs text-muted-foreground">Upgrade to Pro to charge for sessions.</p>
        )}
      </div>
    </>
  );
};

export default EventFormFields;
