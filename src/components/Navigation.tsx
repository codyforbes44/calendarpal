import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">MeetFlow</span>
          </a>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
                <a href="/bookings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Bookings
                </a>
                <a href="/availability" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Availability
                </a>
                <a href="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </a>
              </>
            ) : (
              <>
                <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="/booking" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Book Demo
                </a>
              </>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/auth">Sign In</a>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <a href="/auth">Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
