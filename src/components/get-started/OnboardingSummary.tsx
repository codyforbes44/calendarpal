import { User, CalendarDays, Clock, Pencil } from "lucide-react";

interface OnboardingSummaryProps {
  fullName: string;
  username: string;
  eventTitle: string;
  eventDuration: number;
  availability: { day: string; enabled: boolean }[];
  startTime: string;
  endTime: string;
  onEditStep: (step: number) => void;
}

const OnboardingSummary = ({
  fullName,
  username,
  eventTitle,
  eventDuration,
  availability,
  startTime,
  endTime,
  onEditStep,
}: OnboardingSummaryProps) => {
  const enabledDays = availability.filter((d) => d.enabled).map((d) => d.day.slice(0, 3));

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your setup</p>

      <div className="grid gap-2.5">
        {/* Profile */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">bookme.bet/{username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Event */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarDays className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{eventTitle}</p>
              <p className="text-xs text-muted-foreground">{eventDuration} min</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Availability */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{enabledDays.join(", ")}</p>
              <p className="text-xs text-muted-foreground">{startTime} – {endTime}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSummary;
