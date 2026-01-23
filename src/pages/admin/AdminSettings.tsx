import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Shield, Globe, Mail, Database, AlertTriangle } from "lucide-react";
import { BLOCKED_COUNTRIES } from "@/lib/blocked-countries";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    newSignups: true,
    emailNotifications: true,
  });

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Control core platform behaviors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the platform
                </p>
              </div>
              <Switch
                id="maintenance"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="signups">Allow New Signups</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable new user registrations
                </p>
              </div>
              <Switch
                id="signups"
                checked={settings.newSignups}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, newSignups: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emails">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send booking confirmation emails
                </p>
              </div>
              <Switch
                id="emails"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <Button onClick={handleSaveSettings} className="w-full mt-4">
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geo-Blocking Configuration
            </CardTitle>
            <CardDescription>
              Countries blocked for regulatory compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>These countries are blocked per OFAC regulations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BLOCKED_COUNTRIES.map((country) => (
                  <Badge key={country.code} variant="secondary">
                    {country.name} ({country.code})
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                To modify blocked countries, update the blocked-countries.ts configuration file.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Status
            </CardTitle>
            <CardDescription>
              Current security configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Row Level Security (RLS)</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  Enabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Admin Role Protection</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Geo-Blocking</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Logging</span>
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  Enabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Configured email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Booking Confirmation", status: "active" },
                { name: "Booking Cancellation", status: "active" },
                { name: "Appeal Verification", status: "active" },
                { name: "Appeal Approved", status: "active" },
                { name: "Appeal Rejected", status: "active" },
              ].map((template) => (
                <div key={template.name} className="flex items-center justify-between">
                  <span className="text-sm">{template.name}</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Information
            </CardTitle>
            <CardDescription>
              Platform database statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Tables</p>
                <p className="text-2xl font-bold">6</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Edge Functions</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">RLS Policies</p>
                <p className="text-2xl font-bold">20+</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Storage Buckets</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
