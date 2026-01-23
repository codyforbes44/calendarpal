import { Home, Calendar, Settings, CalendarCheck, CreditCard, Shield } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminRole } from "@/hooks/useAdminRole";

const BottomNavigation = () => {
  const location = useLocation();
  const { data: isAdmin } = useAdminRole();

  const baseNavItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/bookings", label: "Bookings", icon: CalendarCheck },
    { href: "/availability", label: "Availability", icon: Calendar },
    { href: "/subscription", label: "Plan", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // For admins, replace one item with admin link or add it
  const navItems = isAdmin 
    ? [...baseNavItems.slice(0, 4), { href: "/admin", label: "Admin", icon: Shield }]
    : baseNavItems;

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors touch-target",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium leading-tight",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
