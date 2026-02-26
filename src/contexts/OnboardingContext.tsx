import { createContext, useContext, useState, ReactNode } from "react";

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

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { day: "Sunday", dayOfWeek: 0, enabled: false },
  { day: "Monday", dayOfWeek: 1, enabled: true },
  { day: "Tuesday", dayOfWeek: 2, enabled: true },
  { day: "Wednesday", dayOfWeek: 3, enabled: true },
  { day: "Thursday", dayOfWeek: 4, enabled: true },
  { day: "Friday", dayOfWeek: 5, enabled: true },
  { day: "Saturday", dayOfWeek: 6, enabled: false },
];

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [eventTitle, setEventTitle] = useState("30 Minute Meeting");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDuration, setEventDuration] = useState(30);
  const [availability, setAvailability] = useState<DayAvailability[]>(DEFAULT_AVAILABILITY);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const clearOnboardingData = () => {
    setFullName("");
    setUsername("");
    setEventTitle("30 Minute Meeting");
    setEventDescription("");
    setEventDuration(30);
    setAvailability(DEFAULT_AVAILABILITY);
    setStartTime("09:00");
    setEndTime("17:00");
  };

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
