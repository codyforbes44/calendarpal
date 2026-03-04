import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  ImageIcon,
  Ticket,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: { title: string; href: string }[];
}

const mainNavItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
];

const managementNavItems: NavItem[] = [
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    children: [
      { title: "All Users", href: "/admin/users" },
      { title: "Roles", href: "/admin/roles" },
    ],
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
  },
];

const complianceNavItems: NavItem[] = [
  {
    title: "Geo Appeals",
    href: "/admin/appeals",
    icon: AlertTriangle,
  },
  {
    title: "Blocked Logs",
    href: "/admin/logs",
    icon: FileText,
  },
];

const insightsNavItems: NavItem[] = [
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: "Invite Codes",
    href: "/admin/invite-codes",
    icon: Ticket,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "OG Images",
    href: "/admin/og-images",
    icon: ImageIcon,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    if (item.children && !isCollapsed) {
      const hasActiveChild = item.children.some((child) =>
        location.pathname === child.href
      );

      return (
        <Collapsible
          key={item.href}
          defaultOpen={hasActiveChild}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={cn(
                  "w-full justify-between",
                  hasActiveChild && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={child.href}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={location.pathname === child.href}
                    >
                      <Link to={child.href}>{child.title}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
          <Link to={item.href}>
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
            {item.badge && (
              <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Admin Portal</span>
              <span className="text-xs text-muted-foreground">Bookme.bet</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{managementNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Compliance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{complianceNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{insightsNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{settingsNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span>Back to App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
