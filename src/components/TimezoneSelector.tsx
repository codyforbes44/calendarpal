import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_OPTIONS, getTimezoneOffset } from "@/lib/timezones";
import { Globe } from "lucide-react";

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  showIcon?: boolean;
}

const TimezoneSelector = ({ value, onChange, showIcon = true }: TimezoneSelectorProps) => {
  // Group timezones by region
  const groupedTimezones = TIMEZONE_OPTIONS.reduce(
    (acc, tz) => {
      if (!acc[tz.region]) {
        acc[tz.region] = [];
      }
      acc[tz.region].push(tz);
      return acc;
    },
    {} as Record<string, typeof TIMEZONE_OPTIONS>
  );

  const regions = Object.keys(groupedTimezones);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        {showIcon && <Globe className="w-4 h-4 mr-2 text-muted-foreground" />}
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {regions.map((region) => (
          <SelectGroup key={region}>
            <SelectLabel className="text-xs text-muted-foreground">{region}</SelectLabel>
            {groupedTimezones[region].map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                <span className="flex items-center justify-between w-full">
                  <span>{tz.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {getTimezoneOffset(tz.value)}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimezoneSelector;
