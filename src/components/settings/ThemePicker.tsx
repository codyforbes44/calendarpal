import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Palette, Upload } from "lucide-react";
import { BOOKING_THEMES } from "@/lib/booking-themes";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ThemePicker = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const [selectedTheme, setSelectedTheme] = useState("default");
  const [customColor, setCustomColor] = useState("");
  const [customWelcome, setCustomWelcome] = useState("");
  const [customLogo, setCustomLogo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedTheme((profile as any).booking_theme || "default");
      setCustomColor((profile as any).custom_brand_color || "");
      setCustomWelcome((profile as any).custom_welcome_message || "");
      setCustomLogo((profile as any).custom_brand_logo || "");
    }
  }, [profile]);

  const handleSaveTheme = async () => {
    const updates: Record<string, any> = {
      booking_theme: selectedTheme,
      custom_brand_color: customColor || null,
      custom_welcome_message: customWelcome || null,
      custom_brand_logo: customLogo || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Failed to save theme");
    } else {
      toast.success("Theme saved!");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/brand-logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      setCustomLogo(urlData.publicUrl);
      toast.success("Logo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
        <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
        Booking Page Theme
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        Customize how your public booking page looks to guests.
      </p>

      {/* Preset themes */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {BOOKING_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
              selectedTheme === theme.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            {selectedTheme === theme.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <div className="flex gap-1.5 mb-2">
              <div
                className="w-5 h-5 rounded-full border border-border/50"
                style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
              />
              <div
                className="w-5 h-5 rounded-full border border-border/50"
                style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
              />
              <div
                className="w-5 h-5 rounded-full border border-border/50"
                style={{ backgroundColor: `hsl(${theme.colors.muted})` }}
              />
            </div>
            <p className="text-sm font-medium">{theme.name}</p>
            <p className="text-xs text-muted-foreground">{theme.description}</p>
          </button>
        ))}
      </div>

      {/* Custom branding - available to all users */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Custom Branding</h3>

        <div>
          <Label className="text-sm">Brand Color (HSL)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="e.g. 260 80% 55%"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-10"
            />
            {customColor && (
              <div
                className="w-10 h-10 rounded-md border border-border shrink-0"
                style={{ backgroundColor: `hsl(${customColor})` }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Overrides the preset theme's primary color.
          </p>
        </div>

        <div>
          <Label className="text-sm">Brand Logo</Label>
          <div className="flex items-center gap-3 mt-1">
            {customLogo && (
              <img
                src={customLogo}
                alt="Brand logo"
                className="w-10 h-10 rounded-md object-contain border border-border"
              />
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-1.5" />
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </span>
              </Button>
            </label>
            {customLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomLogo("")}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label className="text-sm">Welcome Message</Label>
          <Textarea
            placeholder="Welcome! Pick a time that works for you."
            value={customWelcome}
            onChange={(e) => setCustomWelcome(e.target.value)}
            rows={2}
            className="mt-1 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shown at the top of your booking page.
          </p>
        </div>
      </div>

      <Button
        variant="hero"
        className="mt-6 w-full sm:w-auto"
        onClick={handleSaveTheme}
      >
        Save Theme
      </Button>
    </Card>
  );
};

export default ThemePicker;
