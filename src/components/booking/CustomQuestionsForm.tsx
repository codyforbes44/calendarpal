import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { BookingQuestion } from "@/hooks/useBookingQuestions";

interface CustomQuestionsFormProps {
  questions: BookingQuestion[];
  answers: Record<string, string | string[]>;
  onChange: (questionId: string, value: string | string[]) => void;
  otherValues: Record<string, string>;
  onOtherChange: (questionId: string, value: string) => void;
}

const CustomQuestionsForm = ({
  questions,
  answers,
  onChange,
  otherValues,
  onOtherChange,
}: CustomQuestionsFormProps) => {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="h-px bg-border" />
      <p className="text-sm font-medium text-muted-foreground">Additional Questions</p>
      {questions.map((q) => {
        const value = answers[q.id];
        const requiredMark = q.is_required ? " *" : "";

        if (q.type === "text") {
          return (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm">{q.label}{requiredMark}</Label>
              <Input
                required={q.is_required}
                value={(value as string) || ""}
                onChange={(e) => onChange(q.id, e.target.value)}
                className="h-10"
              />
            </div>
          );
        }

        if (q.type === "textarea") {
          return (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm">{q.label}{requiredMark}</Label>
              <Textarea
                required={q.is_required}
                value={(value as string) || ""}
                onChange={(e) => onChange(q.id, e.target.value)}
                rows={3}
              />
            </div>
          );
        }

        if (q.type === "select") {
          const selectedValue = (value as string) || "";
          const isOtherSelected = selectedValue === "__other__";
          return (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm">{q.label}{requiredMark}</Label>
              <RadioGroup
                value={selectedValue}
                onValueChange={(v) => onChange(q.id, v)}
              >
                {q.options.map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                    <Label htmlFor={`${q.id}-${i}`} className="text-sm font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
                {q.include_other && (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="__other__" id={`${q.id}-other`} />
                      <Label htmlFor={`${q.id}-other`} className="text-sm font-normal cursor-pointer">
                        Other
                      </Label>
                    </div>
                    {isOtherSelected && (
                      <Input
                        placeholder="Please specify..."
                        value={otherValues[q.id] || ""}
                        onChange={(e) => onOtherChange(q.id, e.target.value)}
                        className="h-9 ml-6"
                        required={q.is_required}
                      />
                    )}
                  </>
                )}
              </RadioGroup>
            </div>
          );
        }

        if (q.type === "multiselect") {
          const selectedValues = (value as string[]) || [];
          const hasOther = selectedValues.includes("__other__");
          return (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm">{q.label}{requiredMark}</Label>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${q.id}-${i}`}
                      checked={selectedValues.includes(opt)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...selectedValues, opt]
                          : selectedValues.filter((v) => v !== opt);
                        onChange(q.id, updated);
                      }}
                    />
                    <Label htmlFor={`${q.id}-${i}`} className="text-sm font-normal cursor-pointer">
                      {opt}
                    </Label>
                  </div>
                ))}
                {q.include_other && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${q.id}-other`}
                        checked={hasOther}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...selectedValues, "__other__"]
                            : selectedValues.filter((v) => v !== "__other__");
                          onChange(q.id, updated);
                        }}
                      />
                      <Label htmlFor={`${q.id}-other`} className="text-sm font-normal cursor-pointer">
                        Other
                      </Label>
                    </div>
                    {hasOther && (
                      <Input
                        placeholder="Please specify..."
                        value={otherValues[q.id] || ""}
                        onChange={(e) => onOtherChange(q.id, e.target.value)}
                        className="h-9 ml-6"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default CustomQuestionsForm;
