import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Menu, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsPro(false);
        return;
      }
      
      try {
        const { data } = await supabase.functions.invoke("check-subscription");
        setIsPro(data?.subscribed || false);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/bookings", label: "Bookings" },
        { href: "/availability", label: "Availability" },
        { href: "/subscription", label: "Subscription" },
        { href: "/settings", label: "Settings" },
      ]
    : [
        { href: "/#features", label: "Features" },
        { href: "/pricing", label: "Pricing" },
        { href: "/book/codyforbes", label: "Book Demo" },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CalendarPal</span>
          </a>

          {/* Desktop Navigation links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {isPro && (
                  <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80 gap-1">
                    <Crown className="w-3 h-3" />
                    Pro
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
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

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">CalendarPal</span>
                  </div>
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex-1 py-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>

                {/* Mobile CTA Buttons */}
                <div className="p-4 border-t border-border space-y-2">
                  {user ? (
                    <>
                      {isPro && (
                        <div className="flex justify-center mb-2">
                          <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80 gap-1">
                            <Crown className="w-3 h-3" />
                            Pro Member
                          </Badge>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          handleSignOut();
                          setOpen(false);
                        }}
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/auth" onClick={() => setOpen(false)}>
                          Sign In
                        </a>
                      </Button>
                      <Button variant="hero" className="w-full" asChild>
                        <a href="/auth" onClick={() => setOpen(false)}>
                          Get Started Free
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
