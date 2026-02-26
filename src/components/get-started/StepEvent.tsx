import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, ArrowRight, ArrowLeft } from "lucide-react";

interface StepEventProps {
  eventTitle: string;
  eventDescription: string;
  eventDuration: number;
  canProceed: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
}

const StepEvent = ({
  eventTitle,
  eventDescription,
  eventDuration,
  canProceed,
  onTitleChange,
  onDescriptionChange,
  onDurationChange,
  onBack,
  onNext,
}: StepEventProps) => (
  <div className="space-y-6 animate-fade-in">
    <div className="text-center mb-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-7 h-7 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Create your first event</h1>
      <p className="text-muted-foreground">Set up a meeting type people can book with you</p>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="eventTitle">Event Name</Label>
        <Input
          id="eventTitle"
          placeholder="30 Minute Meeting"
          value={eventTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="eventDescription">Description (optional)</Label>
        <Textarea
          id="eventDescription"
          placeholder="A quick chat to discuss your needs..."
          value={eventDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="flex gap-2">
          {[15, 30, 45, 60].map((d) => (
            <Button
              key={d}
              type="button"
              variant={eventDuration === d ? "default" : "outline"}
              className="flex-1"
              onClick={() => onDurationChange(d)}
            >
              {d}m
            </Button>
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

export default StepEvent;
