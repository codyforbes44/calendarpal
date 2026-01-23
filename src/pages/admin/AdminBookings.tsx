import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, Calendar, ChevronLeft, ChevronRight, Clock, User, Mail } from "lucide-react";

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_notes: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link: string | null;
  created_at: string;
  event_types: {
    title: string;
    duration: number;
  } | null;
  host_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const ITEMS_PER_PAGE = 15;

const statusColors: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-600 border-green-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
  completed: "bg-blue-500/10 text-blue-600 border-blue-200",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
};

const AdminBookings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["admin-bookings", searchQuery, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(
          `
          id,
          guest_name,
          guest_email,
          guest_notes,
          scheduled_date,
          start_time,
          end_time,
          status,
          meeting_link,
          created_at,
          host_user_id,
          event_types (
            title,
            duration
          )
        `,
          { count: "exact" }
        )
        .order("scheduled_date", { ascending: false })
        .order("start_time", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(
          `guest_name.ilike.%${searchQuery}%,guest_email.ilike.%${searchQuery}%`
        );
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Fetch host profiles
      const hostIds = [...new Set(data?.map((b: any) => b.host_user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", hostIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      const bookingsWithHosts = data?.map((b: any) => ({
        ...b,
        host_profile: profileMap.get(b.host_user_id),
      }));

      return { bookings: bookingsWithHosts as Booking[], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((bookingsData?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform bookings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            {bookingsData?.total || 0} total bookings on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsData?.bookings?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      bookingsData?.bookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.guest_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.guest_email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {booking.event_types?.title || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.event_types?.duration} min
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.host_profile?.full_name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">
                                  {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusColors[booking.status] || ""}
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Full details of the selected booking
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={statusColors[selectedBooking.status] || ""}
                >
                  {selectedBooking.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(selectedBooking.created_at), "PPP")}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedBooking.guest_name}</p>
                    <p className="text-sm text-muted-foreground">Guest</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedBooking.guest_email}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedBooking.scheduled_date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">Date</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {selectedBooking.start_time.slice(0, 5)} -{" "}
                      {selectedBooking.end_time.slice(0, 5)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.event_types?.title} ({selectedBooking.event_types?.duration}{" "}
                      min)
                    </p>
                  </div>
                </div>
              </div>

              {selectedBooking.guest_notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Guest Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.guest_notes}
                  </p>
                </div>
              )}

              {selectedBooking.meeting_link && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Meeting Link</p>
                  <a
                    href={selectedBooking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {selectedBooking.meeting_link}
                  </a>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Host</p>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.host_profile?.full_name || "Unknown"} (
                  {selectedBooking.host_profile?.email})
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
