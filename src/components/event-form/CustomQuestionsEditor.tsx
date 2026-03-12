import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface QuestionDraft {
  id: string; // temp client-side ID
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  options: string[];
  is_required: boolean;
  include_other: boolean;
}

interface CustomQuestionsEditorProps {
  questions: QuestionDraft[];
  onChange: (questions: QuestionDraft[]) => void;
}

let nextId = 0;
const genId = () => `q_${Date.now()}_${nextId++}`;

const CustomQuestionsEditor = ({ questions, onChange }: CustomQuestionsEditorProps) => {
  const [newOption, setNewOption] = useState<Record<string, string>>({});

  const addQuestion = () => {
    onChange([
      ...questions,
      {
        id: genId(),
        label: "",
        type: "text",
        options: [],
        is_required: false,
        include_other: false,
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    const value = (newOption[questionId] || "").trim();
    if (!value) return;
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    updateQuestion(questionId, { options: [...q.options, value] });
    setNewOption((prev) => ({ ...prev, [questionId]: "" }));
  };

  const removeOption = (questionId: string, index: number) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;
    updateQuestion(questionId, { options: q.options.filter((_, i) => i !== index) });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const showOptions = (type: string) => type === "select" || type === "multiselect";

  return (
    <div className="space-y-4 p-3 sm:p-4 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-sm">Custom Questions</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add questions guests must answer when booking
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No custom questions yet. Click "Add" to create one.
        </p>
      )}

      {questions.map((q, index) => (
        <Card key={q.id} className="p-3 sm:p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => moveQuestion(index, -1)}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 min-h-[24px] min-w-[24px] flex items-center justify-center"
                aria-label="Move up"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Question</Label>
                <Input
                  placeholder="e.g., What is your phone number?"
                  value={q.label}
                  onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={q.type}
                    onValueChange={(value) => {
                      updateQuestion(q.id, {
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
                      onCheckedChange={(v) => updateQuestion(q.id, { is_required: v })}
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
                          onClick={() => removeOption(q.id, optIdx)}
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
                      value={newOption[q.id] || ""}
                      onChange={(e) => setNewOption((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption(q.id);
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => addOption(q.id)} className="h-8">
                      Add
                    </Button>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch
                      checked={q.include_other}
                      onCheckedChange={(v) => updateQuestion(q.id, { include_other: v })}
                    />
                    Include "Other" option
                  </label>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeQuestion(q.id)}
              className="text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Remove question"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CustomQuestionsEditor;
