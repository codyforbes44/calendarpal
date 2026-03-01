import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIGenerateButtonProps {
  onGenerated: (value: string) => void;
  getCurrentValue: () => string;
  buildPrompt: () => string;
  label: string;
  regenerateLabel: string;
  /** If set, validates before generating. Return error message to block. */
  validate?: () => string | null;
}

const AIGenerateButton = ({
  onGenerated,
  getCurrentValue,
  buildPrompt,
  label,
  regenerateLabel,
  validate,
}: AIGenerateButtonProps) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [prevValue, setPrevValue] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (validate) {
      const error = validate();
      if (error) {
        toast.error(error);
        return;
      }
    }

    setPrevValue(getCurrentValue());
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate", {
        body: { prompt: buildPrompt() },
      });

      if (error) {
        // Check for rate limit / credit errors from the response
        const status = (error as any)?.status;
        if (status === 429) {
          toast.error("Too many requests. Please wait a moment.");
          return;
        }
        if (status === 402) {
          toast.error("AI credits exhausted. Contact your admin.");
          return;
        }
        throw error;
      }

      if (data?.suggestion) {
        const clean = data.suggestion.replace(/^["']|["']$/g, "").split("\n")[0].trim();
        onGenerated(clean);
        setGenerated(true);
        toast.success(`${label.replace("AI ", "")} generated!`);
      }
    } catch {
      toast.error("Could not generate. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleUndo = () => {
    if (prevValue !== null) {
      onGenerated(prevValue);
      setPrevValue(null);
      setGenerated(false);
      toast.success("Reverted");
    }
  };

  return (
    <div className="flex items-center gap-1">
      {prevValue !== null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          className="h-7 text-xs gap-1 text-muted-foreground"
        >
          <Undo2 className="h-3 w-3" />
          Undo
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        className="h-7 text-xs gap-1 text-primary"
      >
        {generating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {generating ? "Generating..." : generated ? regenerateLabel : label}
      </Button>
    </div>
  );
};

export default AIGenerateButton;
