import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Globe,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Appeal {
  id: string;
  email: string;
  full_name: string;
  country_code: string;
  reason: string;
  status: string;
  verified_at: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
}

type ActionType = "approve" | "reject";

const AdminAppeals = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("verified");
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");

  const { data: appeals, isLoading, refetch } = useQuery({
    queryKey: ["admin-appeals", statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-appeals", {
        body: { action: "list", status: statusFilter },
      });

      if (error) throw error;
      return data.appeals as Appeal[];
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ appealId, action, notes }: { appealId: string; action: ActionType; notes: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-appeals", {
        body: {
          action,
          appealId,
          reviewerNotes: notes,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Appeal ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-appeals"] });
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process appeal");
    },
  });

  const closeDialog = () => {
    setSelectedAppeal(null);
    setActionType(null);
    setReviewerNotes("");
  };

  const openActionDialog = (appeal: Appeal, action: ActionType) => {
    setSelectedAppeal(appeal);
    setActionType(action);
    setReviewerNotes("");
  };

  const handleAction = () => {
    if (!selectedAppeal || !actionType) return;
    actionMutation.mutate({
      appealId: selectedAppeal.id,
      action: actionType,
      notes: reviewerNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "email_sent":
        return <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" />Email Sent</Badge>;
      case "verified":
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Geo-Block Appeals</h1>
          <p className="text-muted-foreground">
            Review and manage access appeals from blocked regions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Appeals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="email_sent">Email Sent</SelectItem>
                  <SelectItem value="verified">Verified (Ready for Review)</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {appeals && (
              <Badge variant="outline" className="ml-auto">
                {appeals.length} appeal{appeals.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appeals Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : appeals && appeals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appeals.map((appeal) => (
                  <TableRow key={appeal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appeal.full_name}</p>
                        <p className="text-sm text-muted-foreground">{appeal.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="w-3 h-3" />
                        {appeal.country_code}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(appeal.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(appeal.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openActionDialog(appeal, "approve")}
                          disabled={appeal.status === "approved" || appeal.status === "rejected"}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {appeal.status === "verified" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => openActionDialog(appeal, "approve")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openActionDialog(appeal, "reject")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p>No appeals found</p>
              <p className="text-sm">Try changing the status filter</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedAppeal} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {actionType === "approve" ? "Approve Appeal" : "Reject Appeal"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Approve this user's access request. They will receive an email notification."
                : "Reject this access request. The user will be notified of the decision."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{selectedAppeal.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm">{selectedAppeal.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Region</span>
                  <span className="text-sm">{selectedAppeal.country_code}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Reason for appeal:</p>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                  {selectedAppeal.reason}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Reviewer Notes {actionType === "reject" && "(recommended)"}
                </label>
                <Textarea
                  placeholder={
                    actionType === "approve"
                      ? "Add any notes for this approval (optional)"
                      : "Explain why this appeal was rejected"
                  }
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppeals;
