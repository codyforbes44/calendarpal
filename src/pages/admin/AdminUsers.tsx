import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Crown, User, Shield, ChevronLeft, ChevronRight } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  subscription_plan: string;
  created_at: string;
  avatar_url: string | null;
}

interface UserRole {
  role: "admin" | "moderator" | "user";
}

const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery, planFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`
        );
      }

      if (planFilter !== "all") {
        query = query.eq("subscription_plan", planFilter);
      }

      const { data, count, error } = await query;

      if (error) throw error;
      return { users: data as UserProfile[], total: count || 0 };
    },
  });

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
    return data as UserRole[];
  };

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedUser) {
        fetchUserRoles(selectedUser.user_id).then(setUserRoles);
      }
    },
    onError: (error) => {
      toast.error("Failed to add role: " + error.message);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (selectedUser) {
        fetchUserRoles(selectedUser.user_id).then(setUserRoles);
      }
    },
    onError: (error) => {
      toast.error("Failed to remove role: " + error.message);
    },
  });

  const handleUserClick = async (user: UserProfile) => {
    setSelectedUser(user);
    const roles = await fetchUserRoles(user.user_id);
    setUserRoles(roles);
  };

  const totalPages = Math.ceil((usersData?.total || 0) / ITEMS_PER_PAGE);

  const getPlanBadge = (plan: string) => {
    if (plan === "pro") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      );
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {usersData?.total || 0} total users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={planFilter}
              onValueChange={(value) => {
                setPlanFilter(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
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
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      usersData?.users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.full_name || "No name"}
                                </p>
                                {user.username && (
                                  <p className="text-xs text-muted-foreground">
                                    @{user.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getPlanBadge(user.subscription_plan)}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUserClick(user)}
                            >
                              Manage
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>
              View and modify user details and roles
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedUser.full_name || "No name"}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.username && (
                    <p className="text-sm text-muted-foreground">
                      @{selectedUser.username}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Subscription</h4>
                {getPlanBadge(selectedUser.subscription_plan)}
              </div>

              <div>
                <h4 className="font-medium mb-2">Roles</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {userRoles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  ) : (
                    userRoles.map((r) => (
                      <Badge
                        key={r.role}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        {r.role}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() =>
                            removeRoleMutation.mutate({
                              userId: selectedUser.user_id,
                              role: r.role,
                            })
                          }
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  {["admin", "moderator"].map((role) => {
                    const hasRole = userRoles.some((r) => r.role === role);
                    if (hasRole) return null;
                    return (
                      <Button
                        key={role}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          addRoleMutation.mutate({
                            userId: selectedUser.user_id,
                            role,
                          })
                        }
                      >
                        Add {role}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Account Info</h4>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd>{format(new Date(selectedUser.created_at), "PPP")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">User ID</dt>
                    <dd className="font-mono text-xs">{selectedUser.user_id}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
