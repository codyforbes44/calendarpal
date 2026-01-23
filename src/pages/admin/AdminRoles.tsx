import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { Shield, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";

interface RoleAssignment {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const roleConfig = {
  admin: {
    icon: ShieldAlert,
    color: "text-red-500 bg-red-500/10",
    description: "Full access to all admin features",
  },
  moderator: {
    icon: ShieldCheck,
    color: "text-blue-500 bg-blue-500/10",
    description: "Can manage users and content",
  },
  user: {
    icon: Shield,
    color: "text-gray-500 bg-gray-500/10",
    description: "Standard user permissions",
  },
};

const AdminRoles = () => {
  const [deleteConfirm, setDeleteConfirm] = useState<RoleAssignment | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["admin-roles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each user
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      return data.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id),
      })) as RoleAssignment[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-roles-list"] });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error("Failed to remove role: " + error.message);
    },
  });

  const groupedByRole = roles?.reduce(
    (acc, role) => {
      if (!acc[role.role]) acc[role.role] = [];
      acc[role.role].push(role);
      return acc;
    },
    {} as Record<string, RoleAssignment[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
        <p className="text-muted-foreground">
          View and manage user role assignments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon;
          const count = groupedByRole?.[role]?.length || 0;
          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {role}s
                </CardTitle>
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Role Assignments</CardTitle>
          <CardDescription>
            Complete list of users with special roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No role assignments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles?.map((role) => {
                      const config = roleConfig[role.role];
                      const Icon = config.icon;
                      return (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {role.profile?.full_name || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {role.profile?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${config.color} border-0`}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {role.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(role.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(role)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the{" "}
              <strong>{deleteConfirm?.role}</strong> role from{" "}
              <strong>{deleteConfirm?.profile?.full_name || "this user"}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRoles;
