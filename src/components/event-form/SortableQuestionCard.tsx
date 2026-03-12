import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { QuestionDraft } from "./CustomQuestionsEditor";

interface SortableQuestionCardProps {
  question: QuestionDraft;
  onUpdate: (id: string, updates: Partial<QuestionDraft>) => void;
  onRemove: (id: string) => void;
  newOptionValue: string;
  onNewOptionChange: (value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}

const SortableQuestionCard = ({
  question: q,
  onUpdate,
  onRemove,
  newOptionValue,
  onNewOptionChange,
  onAddOption,
  onRemoveOption,
}: SortableQuestionCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showOptions = (type: string) => type === "select" || type === "multiselect";

  return (
    <Card ref={setNodeRef} style={style} className="p-3 sm:p-4 space-y-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing min-h-[44px] min-w-[24px] flex items-center justify-center touch-none"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Question</Label>
            <Input
              placeholder="e.g., What is your phone number?"
              value={q.label}
              onChange={(e) => onUpdate(q.id, { label: e.target.value })}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={q.type}
                onValueChange={(value) => {
                  onUpdate(q.id, {
                    type: value as QuestionDraft["type"],
                    options: showOptions(value) ? q.options : [],
                    include_other: showOptions(value) ? q.include_other : false,
                  });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Short Text</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="select">Single Choice</SelectItem>
                  <SelectItem value="multiselect">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  checked={q.is_required}
                  onCheckedChange={(v) => onUpdate(q.id, { is_required: v })}
                />
                Required
              </label>
            </div>
          </div>

          {showOptions(q.type) && (
            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              <div className="space-y-1.5">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <span className="text-sm flex-1 truncate bg-muted px-2 py-1 rounded">
                      {opt}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveOption(optIdx)}
                      className="text-muted-foreground hover:text-destructive min-h-[28px] min-w-[28px] flex items-center justify-center"
                      aria-label={`Remove option ${opt}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="New option..."
                  value={newOptionValue}
                  onChange={(e) => onNewOptionChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddOption();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={onAddOption} className="h-8">
                  Add
                </Button>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Switch
                  checked={q.include_other}
                  onCheckedChange={(v) => onUpdate(q.id, { include_other: v })}
                />
                Include "Other" option
              </label>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(q.id)}
          className="text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Remove question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};

export default SortableQuestionCard;
