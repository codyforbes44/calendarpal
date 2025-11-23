import { format } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  timeSlots: TimeSlot[];
  selectedDate: Date | null;
}

const TimeSlotPicker = ({ selectedTime, onSelectTime, timeSlots, selectedDate }: TimeSlotPickerProps) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Available times</h4>
        <span className="text-xs text-muted-foreground">
          {format(selectedDate, "EEE, MMM d")}
        </span>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => onSelectTime(slot.time)}
            className={cn(
              "w-full px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
              "border hover:border-primary/50",
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
