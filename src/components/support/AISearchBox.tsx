import { useState } from "react";
import { Search, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  answer: string;
  citations: string[];
}

const AISearchBox = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      toast.error("Please enter at least 3 characters.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-search", {
        body: { query: query.trim() },
      });

      if (error) throw error;
      setResult(data as SearchResult);
    } catch (err: any) {
      console.error("AI search error:", err);
      const status = err?.status || err?.context?.status;
      if (status === 429) {
        toast.error("Too many requests. Please wait a moment.");
      } else if (status === 402) {
        toast.error("AI credits exhausted. Contact your admin.");
      } else {
        toast.error("Could not get an answer. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about scheduling, bookings, availability..."
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading || query.trim().length < 3}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Ask AI</span>
          </Button>
        </div>
      </form>

      {loading && (
        <Card className="mt-4 animate-pulse">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching the web for an answer...
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-4">
          <CardContent className="py-6 space-y-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-1 shrink-0" />
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </div>

            {result.citations.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {result.citations.map((url, i) => {
                    let hostname = "";
                    try {
                      hostname = new URL(url).hostname.replace("www.", "");
                    } catch {
                      hostname = url;
                    }
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-2 py-1 rounded-md"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {hostname}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISearchBox;
