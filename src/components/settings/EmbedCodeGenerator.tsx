import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Code, Copy, ExternalLink } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const EmbedCodeGenerator = () => {
  const { data: profile } = useProfile();
  const [copied, setCopied] = useState<string | null>(null);
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("700");

  const username = profile?.username;
  if (!username) return null;

  const baseUrl = window.location.origin;
  const embedUrl = `${baseUrl}/embed/${username}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}px"
  frameborder="0"
  style="border: none; border-radius: 12px; overflow: hidden;"
  allow="clipboard-write"
  title="Book a meeting with ${profile?.full_name || username}"
></iframe>`;

  const scriptCode = `<!-- BookMe Widget -->
<div id="bookme-widget"></div>
<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.width = '${width}';
  iframe.height = '${height}px';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.overflow = 'hidden';
  iframe.allow = 'clipboard-write';
  iframe.title = 'Book a meeting with ${profile?.full_name || username}';
  document.getElementById('bookme-widget').appendChild(iframe);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'bookme-booking-confirmed') {
      console.log('Booking confirmed:', e.data.booking);
    }
  });
})();
<\/script>`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
        <Code className="w-4 h-4 sm:w-5 sm:h-5" />
        Embed Booking Widget
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4">
        Add your booking page to any website with an embed code.
      </p>

      {/* Size controls */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <Label className="text-xs">Width</Label>
          <Input
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="100%"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Height (px)</Label>
          <Input
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="700"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="iframe" className="w-full">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="iframe" className="flex-1 text-xs">iframe</TabsTrigger>
          <TabsTrigger value="script" className="flex-1 text-xs">JS Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="iframe">
          <div className="relative">
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto max-h-40 font-mono whitespace-pre-wrap break-all">
              {iframeCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 h-7 text-xs"
              onClick={() => copyToClipboard(iframeCode, "iframe code")}
            >
              {copied === "iframe code" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copy
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="script">
          <div className="relative">
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto max-h-40 font-mono whitespace-pre-wrap break-all">
              {scriptCode}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 h-7 text-xs"
              onClick={() => copyToClipboard(scriptCode, "JS widget code")}
            >
              {copied === "JS widget code" ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              Copy
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview link */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(embedUrl, "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-1.5" />
          Preview Embed
        </Button>
        <span className="text-xs text-muted-foreground truncate">{embedUrl}</span>
      </div>
    </Card>
  );
};

export default EmbedCodeGenerator;
