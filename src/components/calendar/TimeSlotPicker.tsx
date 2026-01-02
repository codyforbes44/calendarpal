import { format } from "date-fns";
import { Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTimezoneAbbr } from "@/hooks/useTimezone";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  timeSlots: TimeSlot[];
  selectedDate: Date | null;
  timezone?: string;
}

const TimeSlotPicker = ({ 
  selectedTime, 
  onSelectTime, 
  timeSlots, 
  selectedDate,
  timezone 
}: TimeSlotPickerProps) => {
  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">Select a date to see available times</p>
      </div>
    );
  }

  const availableSlots = timeSlots.filter(slot => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">No available times for</p>
        <p className="font-medium mt-1">{format(selectedDate, "MMMM d, yyyy")}</p>
      </div>
    );
  }

  const tzAbbr = timezone ? getTimezoneAbbr(timezone, selectedDate) : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="hidden md:flex items-center justify-between">
        <h4 className="font-semibold text-sm">Available times</h4>
        <span className="text-xs text-muted-foreground">
          {format(selectedDate, "EEE, MMM d")}
        </span>
      </div>

      {tzAbbr && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="w-3 h-3" />
          <span>Times shown in {tzAbbr}</span>
        </div>
      )}
      
      {/* Mobile: Horizontal scrolling grid, Desktop: Vertical list */}
      <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-1 gap-2 max-h-[250px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => onSelectTime(slot.time)}
            className={cn(
              "px-2 sm:px-4 py-3 rounded-lg text-xs sm:text-sm font-medium transition-all text-center md:text-left",
              "border hover:border-primary/50 touch-target",
              selectedTime === slot.time
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background border-border hover:bg-muted"
            )}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
