import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useAvailability } from "@/hooks/useAvailability";

const AvailabilitySettings = () => {
  const {
    availability,
    loading,
    saving,
    toggleDay,
    updateTimeRange,
    addTimeRange,
    removeTimeRange,
    saveAvailability,
  } = useAvailability();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Set Your Availability</h2>
          <p className="text-muted-foreground mt-1">
            Define when you're available for meetings
          </p>
        </div>
        <Button variant="hero" onClick={saveAvailability} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
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
                        onChange={(e) =>
                          updateTimeRange(dayIndex, rangeIndex, "start", e.target.value)
                        }
                        className="w-32"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={range.end}
                        onChange={(e) =>
                          updateTimeRange(dayIndex, rangeIndex, "end", e.target.value)
                        }
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
