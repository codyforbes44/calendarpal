// Common timezones grouped by region
export const TIMEZONE_OPTIONS = [
  // Americas
  { value: "America/New_York", label: "Eastern Time (ET)", region: "Americas" },
  { value: "America/Chicago", label: "Central Time (CT)", region: "Americas" },
  { value: "America/Denver", label: "Mountain Time (MT)", region: "Americas" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", region: "Americas" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", region: "Americas" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", region: "Americas" },
  { value: "America/Toronto", label: "Toronto (ET)", region: "Americas" },
  { value: "America/Vancouver", label: "Vancouver (PT)", region: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City (CST)", region: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)", region: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)", region: "Americas" },

  // Europe
  { value: "Europe/London", label: "London (GMT/BST)", region: "Europe" },
  { value: "Europe/Paris", label: "Paris (CET)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (CET)", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (CET)", region: "Europe" },
  { value: "Europe/Rome", label: "Rome (CET)", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich (CET)", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm (CET)", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", region: "Europe" },

  // Asia & Pacific
  { value: "Asia/Dubai", label: "Dubai (GST)", region: "Asia & Pacific" },
  { value: "Asia/Kolkata", label: "India (IST)", region: "Asia & Pacific" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", region: "Asia & Pacific" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", region: "Asia & Pacific" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", region: "Asia & Pacific" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", region: "Asia & Pacific" },
  { value: "Asia/Seoul", label: "Seoul (KST)", region: "Asia & Pacific" },
  { value: "Australia/Sydney", label: "Sydney (AEST)", region: "Asia & Pacific" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)", region: "Asia & Pacific" },
  { value: "Australia/Perth", label: "Perth (AWST)", region: "Asia & Pacific" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)", region: "Asia & Pacific" },

  // Africa & Middle East
  { value: "Africa/Cairo", label: "Cairo (EET)", region: "Africa & Middle East" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", region: "Africa & Middle East" },
  { value: "Africa/Lagos", label: "Lagos (WAT)", region: "Africa & Middle East" },
  { value: "Asia/Jerusalem", label: "Jerusalem (IST)", region: "Africa & Middle East" },
];

// Get user's local timezone
export const getLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
};

// Get timezone label
export const getTimezoneLabel = (timezone: string): string => {
  const option = TIMEZONE_OPTIONS.find((tz) => tz.value === timezone);
  return option?.label || timezone;
};

// Get current UTC offset for a timezone
export const getTimezoneOffset = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || "";
  } catch {
    return "";
  }
};
