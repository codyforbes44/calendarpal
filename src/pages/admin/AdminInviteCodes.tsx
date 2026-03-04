import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket, Copy, Download, Loader2, Check } from "lucide-react";
import { format } from "date-fns";

interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  batch_id: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const AdminInviteCodes = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [expiryDays, setExpiryDays] = useState<number | "">("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    const { data, error } = await supabase
      .from("invitation_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      toast.error("Failed to load codes");
    } else {
      setCodes((data as InviteCode[]) || []);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!user || count < 1 || count > 100) return;
    setGenerating(true);

    const batchId = crypto.randomUUID();
    const expiresAt = expiryDays
      ? new Date(Date.now() + Number(expiryDays) * 86400000).toISOString()
      : null;

    const newCodes = Array.from({ length: count }, () => ({
      code: generateCode(),
      created_by: user.id,
      batch_id: batchId,
      expires_at: expiresAt,
    }));

    const { error } = await supabase.from("invitation_codes").insert(newCodes);

    if (error) {
      console.error(error);
      toast.error("Failed to generate codes");
    } else {
      toast.success(`Generated ${count} invitation codes`);
      loadCodes();
    }
    setGenerating(false);
  };

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const copyAll = async () => {
    const unused = codes.filter((c) => !c.used_by).map((c) => c.code);
    await navigator.clipboard.writeText(unused.join("\n"));
    toast.success(`Copied ${unused.length} unused codes`);
  };

  const exportCSV = () => {
    const header = "Code,Status,Created,Used At,Expires At\n";
    const rows = codes.map((c) =>
      [
        c.code,
        c.used_by ? "Used" : "Available",
        format(new Date(c.created_at), "yyyy-MM-dd"),
        c.used_at ? format(new Date(c.used_at), "yyyy-MM-dd") : "",
        c.expires_at ? format(new Date(c.expires_at), "yyyy-MM-dd") : "",
      ].join(",")
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invite-codes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCodes = codes.length;
  const usedCodes = codes.filter((c) => c.used_by).length;
  const availableCodes = totalCodes - usedCodes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invitation Codes</h1>
        <p className="text-muted-foreground">Generate and manage invitation codes for new users.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Generated</p>
          <p className="text-2xl font-bold">{totalCodes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Used</p>
          <p className="text-2xl font-bold">{usedCodes}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-primary">{availableCodes}</p>
        </Card>
      </div>

      {/* Generate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Generate Codes
          </CardTitle>
          <CardDescription>Create a batch of invitation codes to distribute.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-sm">Number of codes</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-24 mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Expire after (days, optional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="Never"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : "")}
                className="w-28 mt-1"
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate {count} Codes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Codes</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll} disabled={availableCodes === 0}>
                <Copy className="w-4 h-4 mr-1" /> Copy Unused
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={totalCodes === 0}>
                <Download className="w-4 h-4 mr-1" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : codes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No codes generated yet. Create your first batch above.</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                      <TableCell>
                        {code.used_by ? (
                          <Badge variant="secondary">Used</Badge>
                        ) : code.expires_at && new Date(code.expires_at) < new Date() ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(code.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {code.expires_at ? format(new Date(code.expires_at), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(code.code, code.id)}
                          disabled={!!code.used_by}
                        >
                          {copiedId === code.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInviteCodes;
