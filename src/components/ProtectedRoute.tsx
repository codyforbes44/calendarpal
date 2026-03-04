import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SavePromptModal from "@/components/SavePromptModal";
import { useGuestMode } from "@/hooks/useGuestMode";

interface ProtectedRouteProps {
  children: ReactNode;
  guestAllowed?: boolean;
}

const ProtectedRoute = ({ children, guestAllowed = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isGuest, showSaveModal, setShowSaveModal, promptSave } = useGuestMode();

  useEffect(() => {
    if (!loading && !user && !guestAllowed) {
      navigate("/auth");
    }
  }, [user, loading, navigate, guestAllowed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !guestAllowed) {
    return null;
  }

  if (!user && guestAllowed) {
    return (
      <>
        {children}
        <SavePromptModal open={showSaveModal} onOpenChange={setShowSaveModal} />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
