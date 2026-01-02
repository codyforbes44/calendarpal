import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availableDates?: Date[];
}

const CalendarGrid = ({ selectedDate, onSelectDate, availableDates }: CalendarGridProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = startOfDay(new Date());

  const isDateAvailable = (date: Date) => {
    if (!availableDates || availableDates.length === 0) return true;
    return availableDates.some(availableDate => 
      isSameDay(availableDate, date)
    );
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || !isDateAvailable(date);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Abbreviated day names for mobile
  const dayNames = {
    full: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    short: ["S", "M", "T", "W", "T", "F", "S"]
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-9 w-9 sm:h-8 sm:w-8 touch-target"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-9 w-9 sm:h-8 sm:w-8 touch-target"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
        {dayNames.full.map((day, index) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1 sm:py-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{dayNames.short[index]}</span>
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isDisabled = isDateDisabled(day);

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onSelectDate(day)}
              disabled={isDisabled}
              className={cn(
                "aspect-square min-h-[40px] sm:min-h-0 p-1 sm:p-2 text-sm rounded-lg transition-all relative",
                "hover:bg-muted disabled:cursor-not-allowed touch-target",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && !isDisabled && "font-medium",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
                isTodayDate && !isSelected && "border-2 border-primary",
                isDisabled && "opacity-40 hover:bg-transparent"
              )}
            >
              {format(day, "d")}
              {!isDisabled && isCurrentMonth && !isSelected && (
                <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
