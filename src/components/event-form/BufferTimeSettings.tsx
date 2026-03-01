import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { EventFormValues } from "./types";

const BUFFER_OPTIONS = [
  { value: "0", label: "No buffer" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
];

interface BufferTimeSettingsProps {
  form: UseFormReturn<EventFormValues>;
}

const BufferTimeSettings = ({ form }: BufferTimeSettingsProps) => {
  return (
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
                  {BUFFER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
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
                  {BUFFER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default BufferTimeSettings;
