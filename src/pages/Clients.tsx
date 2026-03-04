import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Users, Mail, Calendar, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

interface ClientRecord {
  email: string;
  name: string;
  total_meetings: number;
  last_meeting: string;
  first_meeting: string;
}

type SortField = "name" | "total_meetings" | "last_meeting";

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("last_meeting");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .rpc("get_client_directory", { p_user_id: user.id })
        .then(({ data, error }) => {
          if (!error && data) setClients(data as ClientRecord[]);
          setIsLoading(false);
        });
    }
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      : clients;
    return list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "total_meetings") cmp = a.total_meetings - b.total_meetings;
      else cmp = a.last_meeting.localeCompare(b.last_meeting);
      return sortAsc ? cmp : -cmp;
    });
  }, [clients, search, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const repeatClients = clients.filter((c) => c.total_meetings > 1).length;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEO title="Clients | CalendarPal" description="Your client directory" />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Clients</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your client directory with booking history</p>
        </div>

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

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

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
                  <button className="flex items-center gap-1" onClick={() => toggleSort("total_meetings")}>
                    Meetings <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("last_meeting")}>
                    Last Meeting <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading clients...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{search ? "No clients match your search" : "No clients yet"}</TableCell></TableRow>
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
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{client.email}</TableCell>
                    <TableCell>
                      <Badge variant={client.total_meetings > 1 ? "default" : "secondary"} className="text-xs">{client.total_meetings}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(client.last_meeting), "MMM d, yyyy")}</TableCell>
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
