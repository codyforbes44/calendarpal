import { useCallback } from "react";
import { toast } from "sonner";

interface ApiError {
  code?: string;
  message: string;
  details?: string;
}

interface ErrorMessages {
  [key: string]: string;
}

const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  "23505": "This item already exists",
  "23503": "Cannot delete - this item is being used elsewhere",
  "42501": "You don't have permission to perform this action",
  "PGRST116": "Item not found",
  "PGRST301": "Connection error - please check your internet",
  "auth/invalid-email": "Invalid email address",
  "auth/user-not-found": "No account found with this email",
  "auth/wrong-password": "Incorrect password",
  "auth/email-already-in-use": "An account with this email already exists",
  "auth/weak-password": "Password is too weak",
  "auth/invalid-login-credentials": "Invalid email or password",
};

export function useApiError() {
  const handleError = useCallback(
    (
      error: unknown,
      customMessages?: ErrorMessages,
      defaultMessage = "Something went wrong. Please try again."
    ): string => {
      console.error("API Error:", error);

      const messages = { ...DEFAULT_ERROR_MESSAGES, ...customMessages };
      let errorMessage = defaultMessage;

      if (error instanceof Error) {
        // Check for Supabase error codes
        const supabaseError = error as any;
        if (supabaseError.code && messages[supabaseError.code]) {
          errorMessage = messages[supabaseError.code];
        } else if (supabaseError.message) {
          // Check if the message contains a known error pattern
          for (const [key, msg] of Object.entries(messages)) {
            if (supabaseError.message.includes(key)) {
              errorMessage = msg;
              break;
            }
          }
          // If no match found, use the error message directly (if it's user-friendly)
          if (errorMessage === defaultMessage && !supabaseError.message.includes("Error:")) {
            errorMessage = supabaseError.message;
          }
        }
      } else if (typeof error === "object" && error !== null) {
        const err = error as ApiError;
        if (err.code && messages[err.code]) {
          errorMessage = messages[err.code];
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      return errorMessage;
    },
    []
  );

  const showError = useCallback(
    (
      error: unknown,
      customMessages?: ErrorMessages,
      defaultMessage?: string
    ) => {
      const message = handleError(error, customMessages, defaultMessage);
      toast.error(message);
      return message;
    },
    [handleError]
  );

  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const showInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  return {
    handleError,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}

// Utility function for creating typed error handlers
export function createErrorHandler(customMessages: ErrorMessages = {}) {
  return (error: unknown, defaultMessage?: string): string => {
    const messages = { ...DEFAULT_ERROR_MESSAGES, ...customMessages };
    let errorMessage = defaultMessage || "Something went wrong";

    if (error instanceof Error) {
      const supabaseError = error as any;
      if (supabaseError.code && messages[supabaseError.code]) {
        errorMessage = messages[supabaseError.code];
      }
    }

    return errorMessage;
  };
}
