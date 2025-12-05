import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  tip?: string;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  tip,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>
      
      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <Button variant="hero" asChild>
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button variant="hero" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}

      {tip && (
        <p className="text-xs text-muted-foreground mt-6 max-w-xs mx-auto">
          💡 {tip}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
