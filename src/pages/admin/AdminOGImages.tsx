import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Image, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { siteConfig } from "@/lib/seo-config";

type Page = "home" | "pricing" | "support";

interface OGImageState {
  status: "idle" | "generating" | "done" | "error";
  publicUrl?: string;
  error?: string;
  copied?: boolean;
}

const pageConfig: Record<Page, { label: string; description: string; currentUrl: string }> = {
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

const AdminOGImages = () => {
  const [states, setStates] = useState<Record<Page, OGImageState>>({
    home: { status: "idle" },
    pricing: { status: "idle" },
    support: { status: "idle" },
  });

  const updateState = (page: Page, update: Partial<OGImageState>) => {
    setStates((prev) => ({ ...prev, [page]: { ...prev[page], ...update } }));
  };

  const generateImage = async (page: Page) => {
    updateState(page, { status: "generating", error: undefined, publicUrl: undefined });

    try {
      const { data, error } = await supabase.functions.invoke("generate-og-images", {
        body: { page },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Generation failed");

      updateState(page, { status: "done", publicUrl: data.publicUrl });
      toast.success(`${pageConfig[page].label} OG image generated successfully!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      updateState(page, { status: "error", error: message });
      toast.error(`Failed to generate ${pageConfig[page].label} OG image: ${message}`);
    }
  };

  const copyUrl = async (page: Page, url: string) => {
    await navigator.clipboard.writeText(url);
    updateState(page, { copied: true });
    toast.success("URL copied to clipboard!");
    setTimeout(() => updateState(page, { copied: false }), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OG Image Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate AI-powered Open Graph images (1200×630px) for social media previews. After generating,
          copy the URL and update{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">src/lib/seo-config.ts</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(Object.keys(pageConfig) as Page[]).map((page) => {
          const config = pageConfig[page];
          const state = states[page];
          const isGenerating = state.status === "generating";

          return (
            <Card key={page} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{config.label} Page</CardTitle>
                  {state.status === "done" && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      Generated
                    </Badge>
                  )}
                  {state.status === "error" && (
                    <Badge variant="destructive">Error</Badge>
                  )}
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 flex-1">
                {/* Current / Generated preview */}
                <div className="relative aspect-[1200/630] bg-muted rounded-lg overflow-hidden border">
                  {state.status === "generating" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating with AI…</p>
                      <p className="text-xs text-muted-foreground">This may take 30–60 seconds</p>
                    </div>
                  ) : state.publicUrl ? (
                    <img
                      src={state.publicUrl}
                      alt={`Generated ${config.label} OG image`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        Current: {config.currentUrl}
                      </p>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {state.status === "error" && state.error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
                    {state.error}
                  </p>
                )}

                {/* Generated URL */}
                {state.publicUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Public URL
                    </p>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
                        {state.publicUrl}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyUrl(page, state.publicUrl!)}
                      >
                        {state.copied ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shrink-0"
                        onClick={() => window.open(state.publicUrl, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={() => generateImage(page)}
                  disabled={isGenerating}
                  variant={state.status === "done" ? "outline" : "default"}
                  className="mt-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : state.status === "done" ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Image className="h-4 w-4" />
                      Generate {config.label} OG Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">After Generating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            1. Copy each generated URL above.
          </p>
          <p>
            2. Open <code className="bg-muted px-1 py-0.5 rounded text-xs">src/lib/seo-config.ts</code> and
            update the <code className="bg-muted px-1 py-0.5 rounded text-xs">ogImages</code> object:
          </p>
          <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
{`ogImages: {
  home: "https://...supabase.co/storage/v1/object/public/og-images/og-home.png",
  pricing: "https://...supabase.co/storage/v1/object/public/og-images/og-pricing.png",
  support: "https://...supabase.co/storage/v1/object/public/og-images/og-support.png",
}`}
          </pre>
          <p>
            3. The images are stored permanently in cloud storage and will be served to social media crawlers automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOGImages;
