"use client";

import { useState, useEffect, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { HAYAPIN_EXAMPLES, TRUST_CHOICES } from "@/lib/constants";
import {
  ChoiceQuestion,
  combineChoiceValue,
  parseChoiceValue,
} from "@/components/shared/ChoiceQuestion";

/* ---------- Questions config ---------- */
const QUESTIONS: {
  key: "motivation" | "struggle" | "targetPerson" | "futureVision";
  label: string;
  description: string;
  choices: readonly string[];
  exampleKey: keyof typeof HAYAPIN_EXAMPLES.trust;
  supplementaryPlaceholder?: string;
}[] = [
  {
    key: "motivation",
    label: "1. なぜその分野で発信しようと思ったか？",
    description: "きっかけを教えてください",
    choices: TRUST_CHOICES.motivation,
    exampleKey: "motivation",
    supplementaryPlaceholder:
      "具体的なきっかけがあれば教えてください（任意）",
  },
  {
    key: "struggle",
    label: "2. 過去にその分野で苦労・挫折した経験は？",
    description: "失敗や苦労の経験があなたの信頼になります",
    choices: TRUST_CHOICES.struggle,
    exampleKey: "struggle",
    supplementaryPlaceholder:
      "どんな苦労だったか教えてください（任意）",
  },
  {
    key: "targetPerson",
    label: '3. 発信を届けたい「具体的な人」は誰？',
    description: "1人の顔が浮かぶくらい具体的に",
    choices: TRUST_CHOICES.targetPerson,
    exampleKey: "targetPerson",
    supplementaryPlaceholder:
      "もっと具体的に描写できればぜひ！（任意）",
  },
  {
    key: "futureVision",
    label:
      "4. その人がフォローしたら、どんな未来が待っている？",
    description: "フォローする理由を言葉にしましょう",
    choices: TRUST_CHOICES.futureVision,
    exampleKey: "futureVision",
    supplementaryPlaceholder:
      "届けたい未来をもう少し詳しく（任意）",
  },
];

/* ---------- Component ---------- */
export default function StepTrust() {
  const { trust, updateTrust } = useWizardStore();

  // Parse existing store values into choice selections + supplementary text
  const [choiceState, setChoiceState] = useState(() => {
    const result: Record<
      string,
      { selected: string[]; supplementary: string }
    > = {};
    for (const q of QUESTIONS) {
      result[q.key] = parseChoiceValue(trust[q.key], q.choices);
    }
    return result;
  });

  // Track validation errors manually (required fields need at least 1 choice or text)
  const [errors, setErrors] = useState<Record<string, string | undefined>>(
    {},
  );

  // Validate on mount and on changes for the bottom nav canAdvance check
  const validate = useCallback(
    (currentTrust: typeof trust) => {
      const newErrors: Record<string, string | undefined> = {};
      const requiredFields = [
        { key: "motivation", msg: "きっかけを入力してください" },
        {
          key: "struggle",
          msg: "苦労・挫折の経験を入力してください",
        },
        { key: "targetPerson", msg: "届けたい人を入力してください" },
        {
          key: "futureVision",
          msg: "未来のビジョンを入力してください",
        },
      ];
      for (const { key, msg } of requiredFields) {
        if (!currentTrust[key as keyof typeof trust]?.trim()) {
          newErrors[key] = msg;
        }
      }
      setErrors(newErrors);
    },
    [],
  );

  // Validate on mount (validate is stable, trust is read fresh via getState in handlers)
  useEffect(() => {
    validate(useWizardStore.getState().trust);
  }, [validate]);

  const handleChoicesChange = useCallback(
    (key: string, choices: string[]) => {
      let combined = "";
      setChoiceState((prev) => {
        const updated = {
          ...prev,
          [key]: { ...prev[key], selected: choices },
        };
        combined = combineChoiceValue(choices, updated[key].supplementary);
        return updated;
      });
      updateTrust({ [key]: combined });
      validate(useWizardStore.getState().trust);
    },
    [updateTrust, validate],
  );

  const handleSupplementaryChange = useCallback(
    (key: string, text: string) => {
      let combined = "";
      setChoiceState((prev) => {
        const updated = {
          ...prev,
          [key]: { ...prev[key], supplementary: text },
        };
        combined = combineChoiceValue(updated[key].selected, text);
        return updated;
      });
      updateTrust({ [key]: combined });
      validate(useWizardStore.getState().trust);
    },
    [updateTrust, validate],
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold leading-relaxed">
          信頼設計
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          あなたのストーリーがフォロワーの「信頼」をつくります。
          <br />
          まずは選択肢から選ぶだけでOK！
        </p>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <ChoiceQuestion
            key={q.key}
            label={q.label}
            description={q.description}
            choices={q.choices}
            selectedChoices={choiceState[q.key]?.selected ?? []}
            onChoicesChange={(choices) =>
              handleChoicesChange(q.key, choices)
            }
            supplementaryText={
              choiceState[q.key]?.supplementary ?? ""
            }
            onSupplementaryChange={(text) =>
              handleSupplementaryChange(q.key, text)
            }
            supplementaryPlaceholder={q.supplementaryPlaceholder}
            example={HAYAPIN_EXAMPLES.trust[q.exampleKey]}
            required
            error={errors[q.key]}
          />
        ))}
      </div>
    </div>
  );
}
