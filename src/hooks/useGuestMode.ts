import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useState } from "react";

const STORAGE_KEY = "bookme_onboarding";

export function useGuestMode() {
  const { user } = useAuth();
  const [showSaveModal, setShowSaveModal] = useState(false);

  const isGuest = !user;

  const hasUnsavedData = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return !!(data.fullName || data.username || data.eventTitle !== "30 Minute Meeting");
    } catch {
      return false;
    }
  }, []);

  const getGuestData = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const promptSave = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  return {
    isGuest,
    hasUnsavedData,
    getGuestData,
    showSaveModal,
    setShowSaveModal,
    promptSave,
  };
}
