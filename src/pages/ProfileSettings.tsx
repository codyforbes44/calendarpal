import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Link, Copy, Check, ExternalLink } from "lucide-react";

const ProfileSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data?.full_name || "",
        username: data?.username || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .neq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(!data);
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setProfile((prev) => ({ ...prev, username: sanitized }));
    
    // Debounce the availability check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (profile.username && profile.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Username is not available");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          username: profile.username || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.code === "23505") {
        toast.error("Username is already taken");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const copyBookingLink = () => {
    const url = `${window.location.origin}/book/${profile.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Booking link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile and booking page settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Your full name"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="yourname"
                      value={profile.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="pr-10"
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!checkingUsername && profile.username && usernameAvailable !== null && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameAvailable ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-destructive">Taken</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be your booking page URL: meetflow.app/book/{profile.username || "yourname"}
                  </p>
                </div>
              </div>

              <Button
                variant="hero"
                className="mt-6"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Card>

            {/* Booking Link */}
            {profile.username && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Your Booking Link
                </h2>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm">
                    {window.location.origin}/book/{profile.username}
                  </div>
                  <Button variant="outline" size="icon" onClick={copyBookingLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(`/book/${profile.username}`, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-3">
                  Share this link with others so they can book meetings with you.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
