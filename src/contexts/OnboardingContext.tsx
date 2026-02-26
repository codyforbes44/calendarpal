import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface DayAvailability {
  day: string;
  dayOfWeek: number;
  enabled: boolean;
}

interface OnboardingData {
  fullName: string;
  username: string;
  eventTitle: string;
  eventDescription: string;
  eventDuration: number;
  availability: DayAvailability[];
  startTime: string;
  endTime: string;
}

interface OnboardingContextType extends OnboardingData {
  setFullName: (v: string) => void;
  setUsername: (v: string) => void;
  setEventTitle: (v: string) => void;
  setEventDescription: (v: string) => void;
  setEventDuration: (v: number) => void;
  setAvailability: React.Dispatch<React.SetStateAction<DayAvailability[]>>;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  clearOnboardingData: () => void;
}

export const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { day: "Sunday", dayOfWeek: 0, enabled: false },
  { day: "Monday", dayOfWeek: 1, enabled: true },
  { day: "Tuesday", dayOfWeek: 2, enabled: true },
  { day: "Wednesday", dayOfWeek: 3, enabled: true },
  { day: "Thursday", dayOfWeek: 4, enabled: true },
  { day: "Friday", dayOfWeek: 5, enabled: true },
  { day: "Saturday", dayOfWeek: 6, enabled: false },
];

const STORAGE_KEY = "bookme_onboarding";

function loadSaved(): Partial<OnboardingData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const saved = loadSaved();

  const [fullName, setFullName] = useState(saved?.fullName ?? "");
  const [username, setUsername] = useState(saved?.username ?? "");
  const [eventTitle, setEventTitle] = useState(saved?.eventTitle ?? "30 Minute Meeting");
  const [eventDescription, setEventDescription] = useState(saved?.eventDescription ?? "");
  const [eventDuration, setEventDuration] = useState(saved?.eventDuration ?? 30);
  const [availability, setAvailability] = useState<DayAvailability[]>(saved?.availability ?? DEFAULT_AVAILABILITY);
  const [startTime, setStartTime] = useState(saved?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(saved?.endTime ?? "17:00");

  // Persist to localStorage on every change
  useEffect(() => {
    const data: OnboardingData = {
      fullName, username, eventTitle, eventDescription,
      eventDuration, availability, startTime, endTime,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded — ignore */ }
  }, [fullName, username, eventTitle, eventDescription, eventDuration, availability, startTime, endTime]);

  const clearOnboardingData = useCallback(() => {
    setFullName("");
    setUsername("");
    setEventTitle("30 Minute Meeting");
    setEventDescription("");
    setEventDuration(30);
    setAvailability(DEFAULT_AVAILABILITY);
    setStartTime("09:00");
    setEndTime("17:00");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        fullName, setFullName,
        username, setUsername,
        eventTitle, setEventTitle,
        eventDescription, setEventDescription,
        eventDuration, setEventDuration,
        availability, setAvailability,
        startTime, setStartTime,
        endTime, setEndTime,
        clearOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
