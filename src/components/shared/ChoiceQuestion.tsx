"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExamplePopover } from "@/components/shared/ExamplePopover";
import { VoiceInput } from "@/components/shared/VoiceInput";
import { Check } from "lucide-react";

interface ChoiceQuestionProps {
  label: string;
  description?: string;
  choices: readonly string[];
  selectedChoices: string[];
  onChoicesChange: (choices: string[]) => void;
  supplementaryText: string;
  onSupplementaryChange: (text: string) => void;
  supplementaryPlaceholder?: string;
  example?: string;
  required?: boolean;
  error?: string;
}

/** 選択肢 + 補足テキストの複合入力コンポーネント */
export function ChoiceQuestion({
  label,
  description,
  choices,
  selectedChoices,
  onChoicesChange,
  supplementaryText,
  onSupplementaryChange,
  supplementaryPlaceholder,
  example,
  required,
  error,
}: ChoiceQuestionProps) {
  // Reconstruct "other" state from selectedChoices on mount
  const [showOtherInput, setShowOtherInput] = useState(() => {
    return selectedChoices.some((c) => !choices.includes(c));
  });
  const [otherText, setOtherText] = useState(() => {
    const otherChoices = selectedChoices.filter((c) => !choices.includes(c));
    return otherChoices.length > 0 ? otherChoices[0] : "";
  });

  const toggleChoice = useCallback(
    (choice: string) => {
      if (selectedChoices.includes(choice)) {
        onChoicesChange(selectedChoices.filter((c) => c !== choice));
      } else {
        onChoicesChange([...selectedChoices, choice]);
      }
    },
    [selectedChoices, onChoicesChange],
  );

  const handleOtherToggle = useCallback(() => {
    if (showOtherInput) {
      // Remove other text from choices when hiding
      if (otherText) {
        onChoicesChange(selectedChoices.filter((c) => c !== otherText));
      }
      setShowOtherInput(false);
      setOtherText("");
    } else {
      setShowOtherInput(true);
    }
  }, [showOtherInput, otherText, selectedChoices, onChoicesChange]);

  const handleOtherTextChange = useCallback(
    (newText: string) => {
      // Remove old otherText from choices, add new one
      const withoutOld = selectedChoices.filter((c) => c !== otherText);
      setOtherText(newText);
      if (newText.trim()) {
        onChoicesChange([...withoutOld, newText.trim()]);
      } else {
        onChoicesChange(withoutOld);
      }
    },
    [otherText, selectedChoices, onChoicesChange],
  );

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-3 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium leading-relaxed">
              {label}
              {required && (
                <Badge variant="outline" className="ml-2 text-xs">
                  必須
                </Badge>
              )}
            </Label>
            {description && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {example && <ExamplePopover exampleText={example} />}
        </div>

        {/* Choice Chips */}
        <div className="flex flex-wrap gap-2">
          {choices.map((choice) => {
            const isSelected = selectedChoices.includes(choice);
            return (
              <button
                key={choice}
                type="button"
                onClick={() => toggleChoice(choice)}
                aria-pressed={isSelected}
                className={`inline-flex min-h-12 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95 ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {isSelected && <Check className="size-3.5 shrink-0" />}
                {choice}
              </button>
            );
          })}

          {/* その他 chip */}
          <button
            type="button"
            onClick={handleOtherToggle}
            aria-pressed={showOtherInput}
            aria-label="その他の選択肢を追加"
            className={`inline-flex min-h-12 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all active:scale-95 ${
              showOtherInput
                ? "border-primary bg-primary text-primary-foreground"
                : "border-dashed border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            {showOtherInput && <Check className="size-3.5 shrink-0" />}
            その他
          </button>
        </div>

        {/* Other text input */}
        {showOtherInput && (
          <Input
            placeholder="その他の内容を入力..."
            value={otherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            className="rounded-xl"
          />
        )}

        {/* Supplementary textarea */}
        <div className="flex items-start gap-2">
          <Textarea
            placeholder={
              supplementaryPlaceholder ??
              "選んだ内容をもう少し詳しく教えてください（任意）"
            }
            value={supplementaryText}
            onChange={(e) => onSupplementaryChange(e.target.value)}
            className="min-h-[60px] flex-1 rounded-xl resize-none"
          />
          <VoiceInput
            onResult={(text) => {
              onSupplementaryChange(
                supplementaryText ? supplementaryText + text : text,
              );
            }}
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * 選択肢 + 補足テキスト → ストアに保存する単一文字列に結合
 *
 * Format: first line = choices joined by "、", remaining lines = supplementary.
 * Note: predefined choices must not contain "、" (Japanese comma).
 */
export function combineChoiceValue(
  choices: string[],
  supplementary: string,
): string {
  const parts: string[] = [];
  if (choices.length > 0) {
    parts.push(choices.join("、"));
  }
  if (supplementary.trim()) {
    parts.push(supplementary.trim());
  }
  return parts.join("\n");
}

/**
 * ストアの単一文字列 → 選択肢配列 + 補足テキストに分解
 * (既存データとの後方互換性のため)
 *
 * Tokens that don't match predefined choices on the first line are treated
 * as "other" custom choices (kept in `selected`), not supplementary text.
 * Only content on subsequent lines is treated as supplementary.
 */
export function parseChoiceValue(
  value: string,
  _allChoices?: readonly string[],
): { selected: string[]; supplementary: string } {
  if (!value) return { selected: [], supplementary: "" };

  const selected: string[] = [];
  const supplementaryLines: string[] = [];

  const lines = value.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0) {
      // First line: all tokens are choices (predefined or custom "other")
      const tokens = line.split("、").map((t) => t.trim()).filter(Boolean);
      selected.push(...tokens);
    } else {
      // Subsequent lines: supplementary text
      if (line.trim()) {
        supplementaryLines.push(line);
      }
    }
  }

  return {
    selected,
    supplementary: supplementaryLines.join("\n"),
  };
}
