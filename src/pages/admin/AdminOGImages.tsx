import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Image, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { siteConfig } from "@/lib/seo-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OGPage = "home" | "pricing" | "support";
type HeroPage = "home" | "about" | "pricing" | "support" | "auth";

interface ImageState {
  status: "idle" | "generating" | "done" | "error";
  publicUrl?: string;
  error?: string;
  copied?: boolean;
}

const ogPageConfig: Record<OGPage, { label: string; description: string; currentUrl: string }> = {
  home: {
    label: "Home",
    description: "Hero layout — Scheduling Made Simple headline with UI cards",
    currentUrl: siteConfig.ogImages.home,
  },
  pricing: {
    label: "Pricing",
    description: "Three pricing tier cards — Free, Pro, Enterprise",
    currentUrl: siteConfig.ogImages.pricing,
  },
  support: {
    label: "Support",
    description: "Help & FAQ chat illustration — We're here to help",
    currentUrl: siteConfig.ogImages.support,
  },
};

const heroPageConfig: Record<HeroPage, { label: string; description: string }> = {
  home: { label: "Home", description: "Scheduling automation — calendar/time flowing shapes" },
  about: { label: "About", description: "Connection/teamwork — interconnected nodes" },
  pricing: { label: "Pricing", description: "Value tiers — ascending geometric shapes" },
  support: { label: "Support", description: "Help/community — floating chat bubbles" },
  auth: { label: "Auth", description: "Professional — deep indigo geometric patterns" },
};

const AdminOGImages = () => {
  const [ogStates, setOgStates] = useState<Record<OGPage, ImageState>>({
    home: { status: "idle" },
    pricing: { status: "idle" },
    support: { status: "idle" },
  });

  const [heroStates, setHeroStates] = useState<Record<HeroPage, ImageState>>({
    home: { status: "idle" },
    about: { status: "idle" },
    pricing: { status: "idle" },
    support: { status: "idle" },
    auth: { status: "idle" },
  });

  const updateOgState = (page: OGPage, update: Partial<ImageState>) => {
    setOgStates((prev) => ({ ...prev, [page]: { ...prev[page], ...update } }));
  };

  const updateHeroState = (page: HeroPage, update: Partial<ImageState>) => {
    setHeroStates((prev) => ({ ...prev, [page]: { ...prev[page], ...update } }));
  };

  const generateOGImage = async (page: OGPage) => {
    updateOgState(page, { status: "generating", error: undefined, publicUrl: undefined });
    try {
      const { data, error } = await supabase.functions.invoke("generate-og-images", { body: { page } });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Generation failed");
      updateOgState(page, { status: "done", publicUrl: data.publicUrl });
      toast.success(`${ogPageConfig[page].label} OG image generated!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      updateOgState(page, { status: "error", error: message });
      toast.error(`Failed: ${message}`);
    }
  };

  const generateHeroImage = async (page: HeroPage) => {
    updateHeroState(page, { status: "generating", error: undefined, publicUrl: undefined });
    try {
      const { data, error } = await supabase.functions.invoke("generate-hero-images", { body: { page } });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Generation failed");
      updateHeroState(page, { status: "done", publicUrl: data.publicUrl });
      toast.success(`${heroPageConfig[page].label} hero background generated!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      updateHeroState(page, { status: "error", error: message });
      toast.error(`Failed: ${message}`);
    }
  };

  const copyUrl = async (url: string, updateFn: (u: Partial<ImageState>) => void) => {
    await navigator.clipboard.writeText(url);
    updateFn({ copied: true });
    toast.success("URL copied!");
    setTimeout(() => updateFn({ copied: false }), 2000);
  };

  const renderImageCard = (
    key: string,
    label: string,
    description: string,
    state: ImageState,
    onGenerate: () => void,
    onCopy: (url: string) => void,
    aspectRatio: string,
  ) => {
    const isGenerating = state.status === "generating";
    return (
      <Card key={key} className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{label}</CardTitle>
            {state.status === "done" && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Generated</Badge>
            )}
            {state.status === "error" && <Badge variant="destructive">Error</Badge>}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 flex-1">
          <div className={`relative bg-muted rounded-lg overflow-hidden border`} style={{ aspectRatio }}>
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating with AI…</p>
                <p className="text-xs text-muted-foreground">This may take 30–60 seconds</p>
              </div>
            ) : state.publicUrl ? (
              <img src={state.publicUrl} alt={`Generated ${label}`} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Image className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">Click generate to create</p>
              </div>
            )}
          </div>
          {state.status === "error" && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{state.error}</p>
          )}
          {state.publicUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Public URL</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">{state.publicUrl}</code>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => onCopy(state.publicUrl!)}>
                  {state.copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => window.open(state.publicUrl, "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
          <Button onClick={onGenerate} disabled={isGenerating} variant={state.status === "done" ? "outline" : "default"} className="mt-auto">
            {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating…</>) :
             state.status === "done" ? (<><RefreshCw className="h-4 w-4" />Regenerate</>) :
             (<><Image className="h-4 w-4" />Generate</>)}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Image Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate AI-powered images for OG social previews and page hero backgrounds.
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hero">Hero Backgrounds</TabsTrigger>
          <TabsTrigger value="og">OG Images</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Generate 1920×1080 abstract background images for each page's hero section. Images appear at low opacity behind content.
          </p>
          <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-5">
            {(Object.keys(heroPageConfig) as HeroPage[]).map((page) =>
              renderImageCard(
                page,
                heroPageConfig[page].label,
                heroPageConfig[page].description,
                heroStates[page],
                () => generateHeroImage(page),
                (url) => copyUrl(url, (u) => updateHeroState(page, u)),
                "1920/1080",
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="og" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Generate 1200×630 Open Graph images for social media previews. After generating, update{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">src/lib/seo-config.ts</code>.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            {(Object.keys(ogPageConfig) as OGPage[]).map((page) =>
              renderImageCard(
                page,
                ogPageConfig[page].label,
                ogPageConfig[page].description,
                ogStates[page],
                () => generateOGImage(page),
                (url) => copyUrl(url, (u) => updateOgState(page, u)),
                "1200/630",
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOGImages;
