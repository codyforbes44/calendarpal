import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Globe, AlertTriangle } from "lucide-react";
import { BLOCKED_COUNTRIES } from "@/lib/blocked-countries";

interface BlockedLog {
  id: string;
  country_code: string;
  ip_hash: string | null;
  user_agent: string | null;
  path_attempted: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

const AdminBlockedLogs = () => {
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["admin-blocked-logs", countryFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("blocked_access_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (countryFilter !== "all") {
        query = query.eq("country_code", countryFilter);
      }

      const { data, count, error } = await query;

      if (error) throw error;
      return { logs: data as BlockedLog[], total: count || 0 };
    },
  });

  const { data: countryStats } = useQuery({
    queryKey: ["admin-blocked-logs-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_access_logs")
        .select("country_code");

      if (error) throw error;

      const stats = data.reduce(
        (acc, log) => {
          acc[log.country_code] = (acc[log.country_code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return stats;
    },
  });

  const totalPages = Math.ceil((logsData?.total || 0) / ITEMS_PER_PAGE);

  const getCountryName = (code: string) => {
    const country = BLOCKED_COUNTRIES.find((c) => c.code === code);
    return country?.name || code;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blocked Access Logs</h1>
        <p className="text-muted-foreground">
          Monitor access attempts from blocked regions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logsData?.total || 0}</div>
            <p className="text-xs text-muted-foreground">All time attempts</p>
          </CardContent>
        </Card>

        {Object.entries(countryStats || {})
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([code, count]) => (
            <Card key={code}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {getCountryName(code)}
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">Blocked attempts</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Log</CardTitle>
          <CardDescription>
            Detailed log of blocked access attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select
              value={countryFilter}
              onValueChange={(value) => {
                setCountryFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {BLOCKED_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
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
                      <TableHead>Country</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>IP Hash</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData?.logs?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No blocked access logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logsData?.logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {getCountryName(log.country_code)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.path_attempted || "/"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {log.ip_hash?.slice(0, 16) || "N/A"}...
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
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
    </div>
  );
};

export default AdminBlockedLogs;
