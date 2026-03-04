import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu, Sun, Moon, X, Shield, LayoutDashboard, CalendarCheck, Calendar, Settings, Users, Sparkles } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useAdminRole } from "@/hooks/useAdminRole";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useOnboarding } from "@/contexts/OnboardingContext";
import ThemeLogo from "@/components/ThemeLogo";

interface NavLink {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: isAdmin } = useAdminRole();
  const { data: profile } = useProfile();
  const { hasUnsavedData } = useOnboarding();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isGuestExploring = !user && hasUnsavedData;

  const userInitials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  useEffect(() => { setMounted(true); }, []);

  const isPublicPage = !user && !isGuestExploring && (location.pathname === "/" || location.pathname === "/pricing" || location.pathname === "/support");

  useEffect(() => {
    if (!isPublicPage) { setScrolled(true); return; }
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isPublicPage]);

  const handleSignOut = async () => { await signOut(); window.location.href = "/"; };

  const baseUserLinks: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bookings", label: "Bookings", icon: CalendarCheck },
    { href: "/availability", label: "Availability", icon: Calendar },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const navLinks: NavLink[] = user
    ? isAdmin
      ? [...baseUserLinks, { href: "/admin", label: "Admin", icon: Shield }]
      : baseUserLinks
    : isGuestExploring
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/events", label: "Events", icon: CalendarCheck },
          { href: "/availability", label: "Availability", icon: Calendar },
          { href: "/settings", label: "Settings", icon: Settings },
        ]
      : [
          { href: "/#features", label: "Features" },
          { href: "/pricing", label: "Pricing" },
          { href: "/about", label: "About" },
          { href: "/support", label: "Support" },
        ];

  const isActiveLink = (href: string) => {
    if (href.startsWith("/#")) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-300",
      scrolled
        ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border"
        : "bg-transparent border-transparent"
    )}>
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <ThemeLogo width={140} height={36} className="h-7 md:h-9 w-auto object-contain" />
        </Link>

        <nav className={cn("hidden items-center gap-1", user ? "lg:flex" : "md:flex")}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActiveLink(link.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
              {isActiveLink(link.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-9 w-9">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          {user && <NotificationBell />}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary select-none">
                {userInitials}
              </div>
              <Button variant="ghost" onClick={handleSignOut} size="sm">Sign Out</Button>
            </div>
          ) : isGuestExploring ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/auth">
                <Button size="sm" className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sign Up to Save
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/auth"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/get-started"><Button size="sm">Get Started</Button></Link>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" /><span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation links</SheetDescription>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between pb-4 border-b">
                  <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                    <ThemeLogo width={24} height={24} className="h-6 w-6 rounded-lg object-contain" />
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><X className="h-4 w-4" /></Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-1 py-4 flex-1">
                  {navLinks.map((link) => (
                    <Link key={link.href} to={link.href} onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors touch-target",
                        isActiveLink(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}>
                      {link.icon && <link.icon className="h-4 w-4" />}
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="py-3 border-t">
                  {mounted && (
                    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors touch-target">
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </button>
                  )}
                </div>
                <div className="pt-4 border-t space-y-3">
                  {user ? (
                    <Button variant="outline" className="w-full" onClick={() => { setOpen(false); handleSignOut(); }}>Sign Out</Button>
                  ) : isGuestExploring ? (
                    <Link to="/auth" onClick={() => setOpen(false)} className="block">
                      <Button className="w-full gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Sign Up to Save</Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setOpen(false)} className="block"><Button variant="outline" className="w-full">Sign In</Button></Link>
                      <Link to="/get-started" onClick={() => setOpen(false)} className="block"><Button className="w-full">Get Started</Button></Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
