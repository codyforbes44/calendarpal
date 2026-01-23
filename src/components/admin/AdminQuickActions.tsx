import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, FileText, BarChart3 } from "lucide-react";

const quickActions = [
  {
    title: "Manage Users",
    description: "View and manage platform users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Review Appeals",
    description: "Handle geo-block appeals",
    href: "/admin/appeals",
    icon: AlertTriangle,
  },
  {
    title: "View Logs",
    description: "Blocked access attempts",
    href: "/admin/logs",
    icon: FileText,
  },
  {
    title: "Analytics",
    description: "Deep dive into metrics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Jump to common tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.href}
              variant="outline"
              className="h-auto flex-col items-start gap-1 p-3"
              asChild
            >
              <Link to={action.href}>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">{action.title}</span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
