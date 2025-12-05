import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { parse, format } from "date-fns";

/**
 * Convert a time string from one timezone to another
 * @param timeStr Time string in HH:mm format
 * @param date The date for the conversion (needed for DST)
 * @param fromTz Source timezone
 * @param toTz Target timezone
 * @returns Time string in HH:mm format in the target timezone
 */
export const convertTime = (
  timeStr: string,
  date: Date,
  fromTz: string,
  toTz: string
): string => {
  try {
    // Create a date in the source timezone
    const dateStr = format(date, "yyyy-MM-dd");
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    
    // Parse as if it's in the source timezone
    const sourceDate = fromZonedTime(new Date(dateTimeStr), fromTz);
    
    // Format in the target timezone
    return formatInTimeZone(sourceDate, toTz, "HH:mm");
  } catch (error) {
    console.error("Error converting time:", error);
    return timeStr;
  }
};

/**
 * Convert a display time (12-hour format) to 24-hour format in a different timezone
 */
export const convertDisplayTime = (
  displayTime: string,
  date: Date,
  fromTz: string,
  toTz: string
): string => {
  // First convert display time to 24-hour format
  const [time, period] = displayTime.split(" ");
  const [hourStr, minute] = time.split(":");
  let hour = parseInt(hourStr);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  const time24 = `${hour.toString().padStart(2, "0")}:${minute}`;
  
  // Convert to target timezone
  return convertTime(time24, date, fromTz, toTz);
};

/**
 * Format a time for display with timezone
 */
export const formatTimeWithTimezone = (
  timeStr: string,
  date: Date,
  timezone: string
): string => {
  try {
    const dateStr = format(date, "yyyy-MM-dd");
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const zonedDate = toZonedTime(new Date(dateTimeStr), timezone);
    
    return formatInTimeZone(zonedDate, timezone, "h:mm a");
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeStr;
  }
};

/**
 * Get the timezone abbreviation for display
 */
export const getTimezoneAbbr = (timezone: string, date: Date = new Date()): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || "";
  } catch {
    return "";
  }
};
