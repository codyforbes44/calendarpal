import { useState } from "react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, CalendarPlus, CalendarX, CalendarClock, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  booking_created: CalendarPlus,
  booking_cancelled: CalendarX,
  booking_rescheduled: CalendarClock,
  reminder: Bell,
};

const typeColors: Record<string, string> = {
  booking_created: "text-success",
  booking_cancelled: "text-destructive",
  booking_rescheduled: "text-warning",
  reminder: "text-info",
};

const typeLabels: Record<string, string> = {
  booking_created: "New Booking",
  booking_cancelled: "Cancelled",
  booking_rescheduled: "Rescheduled",
  reminder: "Reminder",
};

type FilterType = "all" | "unread" | "booking_created" | "booking_cancelled" | "booking_rescheduled" | "reminder";

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((n) => n.id)));
    }
  };

  const markSelectedRead = async () => {
    const ids = Array.from(selected).filter((id) =>
      notifications.find((n) => n.id === id && !n.is_read)
    );
    if (ids.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    if (!error) {
      toast.success(`Marked ${ids.length} as read`);
      setSelected(new Set());
      refetch();
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", Array.from(selected));

    if (!error) {
      toast.success(`Deleted ${selected.size} notification${selected.size > 1 ? "s" : ""}`);
      setSelected(new Set());
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO title="Notifications | Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" description="View your booking notifications" noindex />
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="booking_created">New Bookings</SelectItem>
                <SelectItem value="booking_cancelled">Cancelled</SelectItem>
                <SelectItem value="booking_rescheduled">Rescheduled</SelectItem>
                <SelectItem value="reminder">Reminders</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs">
              {filtered.length}
            </Badge>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
              <Button variant="outline" size="sm" onClick={markSelectedRead}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Read
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={deleteSelected}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* List */}
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {filter !== "all" ? "Try changing the filter" : "You'll see booking updates here"}
              </p>
            </div>
          ) : (
            <>
              {/* Select all header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={selectAll}
                  aria-label="Select all"
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>

              <div className="divide-y divide-border">
                {filtered.map((n) => {
                  const Icon = typeIcons[n.type] || Bell;
                  const colorClass = typeColors[n.type] || "text-muted-foreground";
                  const label = typeLabels[n.type] || n.type;

                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <Checkbox
                        checked={selected.has(n.id)}
                        onCheckedChange={() => toggleSelect(n.id)}
                        className="mt-1"
                        aria-label={`Select notification: ${n.title}`}
                      />
                      <div className={cn("mt-0.5 shrink-0", colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm font-medium", !n.is_read && "text-foreground")}>
                            {n.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {label}
                          </Badge>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                        <span className="text-xs text-muted-foreground/60 mt-1 block">
                          {format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")} ·{" "}
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 min-h-[44px] min-w-[44px] shrink-0 mt-0.5"
                          onClick={() => markAsRead(n.id)}
                          aria-label="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Notifications;
