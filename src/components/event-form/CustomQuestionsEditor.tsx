import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Phone, Building2, Megaphone, FileText, ChevronDown } from "lucide-react";
import SortableQuestionCard from "./SortableQuestionCard";

const QUESTION_TEMPLATES: { label: string; icon: typeof Phone; draft: Omit<QuestionDraft, "id"> }[] = [
  {
    label: "Phone Number",
    icon: Phone,
    draft: { label: "Phone number", type: "text", options: [], is_required: false, include_other: false },
  },
  {
    label: "Company Name",
    icon: Building2,
    draft: { label: "Company name", type: "text", options: [], is_required: false, include_other: false },
  },
  {
    label: "How did you hear about us?",
    icon: Megaphone,
    draft: {
      label: "How did you hear about us?",
      type: "select",
      options: ["Google search", "Social media", "Friend / colleague", "Blog / article"],
      is_required: false,
      include_other: true,
    },
  },
  {
    label: "Purpose of Meeting",
    icon: FileText,
    draft: {
      label: "What is the purpose of this meeting?",
      type: "multiselect",
      options: ["Initial consultation", "Follow-up", "Demo / walkthrough", "Technical support"],
      is_required: false,
      include_other: true,
    },
  },
];

export interface QuestionDraft {
  id: string;
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addQuestion = () => {
    onChange([
      ...questions,
      { id: genId(), label: "", type: "text", options: [], is_required: false, include_other: false },
    ]);
  };

  const addFromTemplate = (draft: Omit<QuestionDraft, "id">) => {
    onChange([...questions, { ...draft, id: genId() }]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      onChange(arrayMove(questions, oldIndex, newIndex));
    }
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

  return (
    <div className="space-y-4 p-3 sm:p-4 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-sm">Custom Questions</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add questions guests must answer when booking
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={addQuestion}>
              <Plus className="w-4 h-4 mr-2" />
              Blank question
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {QUESTION_TEMPLATES.map((t) => (
              <DropdownMenuItem key={t.label} onClick={() => addFromTemplate(t.draft)}>
                <t.icon className="w-4 h-4 mr-2" />
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No custom questions yet. Click "Add" to create one.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          {questions.map((q) => (
            <SortableQuestionCard
              key={q.id}
              question={q}
              onUpdate={updateQuestion}
              onRemove={removeQuestion}
              newOptionValue={newOption[q.id] || ""}
              onNewOptionChange={(v) => setNewOption((prev) => ({ ...prev, [q.id]: v }))}
              onAddOption={() => addOption(q.id)}
              onRemoveOption={(idx) => removeOption(q.id, idx)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default CustomQuestionsEditor;
