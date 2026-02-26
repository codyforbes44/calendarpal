import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";

interface DayAvailability {
  day: string;
  dayOfWeek: number;
  enabled: boolean;
}

interface StepAvailabilityProps {
  availability: DayAvailability[];
  startTime: string;
  endTime: string;
  canProceed: boolean;
  onToggleDay: (index: number) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const StepAvailability = ({
  availability,
  startTime,
  endTime,
  canProceed,
  onToggleDay,
  onStartTimeChange,
  onEndTimeChange,
  onBack,
  onNext,
}: StepAvailabilityProps) => (
  <div className="space-y-6 animate-fade-in">
    <div className="text-center mb-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Set your availability</h1>
      <p className="text-muted-foreground">When can people book meetings with you?</p>
    </div>

    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label>End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="h-12"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Available Days</Label>
        <div className="grid grid-cols-7 gap-1">
          {availability.map((day, index) => (
            <button
              key={day.day}
              type="button"
              onClick={() => onToggleDay(index)}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                day.enabled
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {day.day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="flex gap-3 pt-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <Button onClick={onNext} disabled={!canProceed} className="flex-1 gap-2">
        Continue <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

export default StepAvailability;
