import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TimeRange {
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  enabled: boolean;
  ranges: TimeRange[];
}

const defaultAvailability: DayAvailability[] = [
  { day: "Monday", enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Tuesday", enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Wednesday", enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Thursday", enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Friday", enabled: true, ranges: [{ start: "09:00", end: "17:00" }] },
  { day: "Saturday", enabled: false, ranges: [{ start: "10:00", end: "14:00" }] },
  { day: "Sunday", enabled: false, ranges: [{ start: "10:00", end: "14:00" }] },
];

const AvailabilitySettings = () => {
  const [availability, setAvailability] = useState<DayAvailability[]>(defaultAvailability);

  const toggleDay = (index: number) => {
    setAvailability(prev => prev.map((day, i) => 
      i === index ? { ...day, enabled: !day.enabled } : day
    ));
  };

  const updateTimeRange = (dayIndex: number, rangeIndex: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => prev.map((day, i) => {
      if (i === dayIndex) {
        const newRanges = [...day.ranges];
        newRanges[rangeIndex] = { ...newRanges[rangeIndex], [field]: value };
        return { ...day, ranges: newRanges };
      }
      return day;
    }));
  };

  const addTimeRange = (dayIndex: number) => {
    setAvailability(prev => prev.map((day, i) => {
      if (i === dayIndex) {
        return {
          ...day,
          ranges: [...day.ranges, { start: "09:00", end: "17:00" }]
        };
      }
      return day;
    }));
  };

  const removeTimeRange = (dayIndex: number, rangeIndex: number) => {
    setAvailability(prev => prev.map((day, i) => {
      if (i === dayIndex && day.ranges.length > 1) {
        return {
          ...day,
          ranges: day.ranges.filter((_, idx) => idx !== rangeIndex)
        };
      }
      return day;
    }));
  };

  const handleSave = () => {
    toast.success("Availability settings saved!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Set Your Availability</h2>
          <p className="text-muted-foreground mt-1">
            Define when you're available for meetings
          </p>
        </div>
        <Button variant="hero" onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <div className="space-y-4">
        {availability.map((day, dayIndex) => (
          <Card key={day.day} className="p-6">
            <div className="space-y-4">
              {/* Day toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={() => toggleDay(dayIndex)}
                    id={`day-${dayIndex}`}
                  />
                  <Label 
                    htmlFor={`day-${dayIndex}`} 
                    className="text-base font-semibold cursor-pointer"
                  >
                    {day.day}
                  </Label>
                </div>
                {day.enabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addTimeRange(dayIndex)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Hours
                  </Button>
                )}
              </div>

              {/* Time ranges */}
              {day.enabled && (
                <div className="space-y-3 ml-10">
                  {day.ranges.map((range, rangeIndex) => (
                    <div key={rangeIndex} className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={range.start}
                        onChange={(e) => updateTimeRange(dayIndex, rangeIndex, 'start', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={range.end}
                        onChange={(e) => updateTimeRange(dayIndex, rangeIndex, 'end', e.target.value)}
                        className="w-32"
                      />
                      {day.ranges.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AvailabilitySettings;
