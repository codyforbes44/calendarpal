import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/useBookings";
import { useSubscription } from "@/hooks/useSubscription";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Mail, Calendar, ArrowUpDown, Lock } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface ClientRecord {
  email: string;
  name: string;
  totalMeetings: number;
  lastMeeting: string;
  firstMeeting: string;
}

type SortField = "name" | "totalMeetings" | "lastMeeting";

const Clients = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { data: bookings, isLoading } = useBookings();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("lastMeeting");
  const [sortAsc, setSortAsc] = useState(false);

  const clients = useMemo(() => {
    if (!bookings) return [];
    const map = new Map<string, ClientRecord>();

    bookings.forEach((b) => {
      const key = b.guest_email.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.totalMeetings += 1;
        if (b.scheduled_date > existing.lastMeeting) existing.lastMeeting = b.scheduled_date;
        if (b.scheduled_date < existing.firstMeeting) existing.firstMeeting = b.scheduled_date;
        if (b.guest_name && b.guest_name.length > existing.name.length) existing.name = b.guest_name;
      } else {
        map.set(key, {
          email: b.guest_email,
          name: b.guest_name,
          totalMeetings: 1,
          lastMeeting: b.scheduled_date,
          firstMeeting: b.scheduled_date,
        });
      }
    });

    return Array.from(map.values());
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? clients.filter(
          (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
        )
      : clients;

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "totalMeetings") cmp = a.totalMeetings - b.totalMeetings;
      else cmp = a.lastMeeting.localeCompare(b.lastMeeting);
      return sortAsc ? cmp : -cmp;
    });
  }, [clients, search, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const repeatClients = clients.filter((c) => c.totalMeetings > 1).length;

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
          <Card className="max-w-lg mx-auto p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Client Directory</h1>
            <p className="text-muted-foreground">
              Upgrade to Pro to access your client directory with booking history, repeat client tracking, and more.
            </p>
            <Link to="/subscription">
              <Button>Upgrade to Pro</Button>
            </Link>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO title="Clients | CalendarPal" description="Your client directory" />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Clients</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your client directory with booking history
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Clients</span>
            </div>
            <p className="text-2xl font-bold">{clients.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Repeat Clients</span>
            </div>
            <p className="text-2xl font-bold">{repeatClients}</p>
          </Card>
          <Card className="p-4 hidden sm:block">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Repeat Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {clients.length > 0 ? Math.round((repeatClients / clients.length) * 100) : 0}%
            </p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Client <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("totalMeetings")}>
                    Meetings <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("lastMeeting")}>
                    Last Meeting <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {search ? "No clients match your search" : "No clients yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.email}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.totalMeetings > 1 ? "default" : "secondary"} className="text-xs">
                        {client.totalMeetings}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(client.lastMeeting), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Clients;
