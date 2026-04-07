"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWizardStore } from "@/lib/store";
import {
  HAYAPIN_EXAMPLES,
  IMPOSTER_MESSAGE,
  INVENTORY_CHOICES,
} from "@/lib/constants";
import { ExamplePopover } from "@/components/shared/ExamplePopover";
import { VoiceInput } from "@/components/shared/VoiceInput";
import {
  ChoiceQuestion,
  combineChoiceValue,
  parseChoiceValue,
} from "@/components/shared/ChoiceQuestion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  Heart,
  RefreshCw,
} from "lucide-react";
import { fetchWithRetry } from "@/lib/api-client";

/* ---------- Schema ---------- */
const inventorySchema = z.object({
  job: z.string().min(1, "お仕事を入力してください"),
  jobYears: z.string().min(1, "年数を入力してください"),
  strengths: z.string().min(1, "得意なことを入力してください"),
  praised: z.string(),
  hobbies: z.string(),
  hardship: z.string(),
  unique: z.string(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

/* ---------- Free-text only questions (Q1, Q2) ---------- */
const FREE_TEXT_QUESTIONS: {
  key: "job" | "jobYears";
  label: string;
  placeholder: string;
  required: boolean;
  exampleKey: keyof typeof HAYAPIN_EXAMPLES.inventory;
}[] = [
  {
    key: "job",
    label: "1. 今の仕事（または過去の仕事）は？",
    placeholder: "例: 看護師、エンジニア、営業職",
    required: true,
    exampleKey: "job",
  },
  {
    key: "jobYears",
    label: "2. その仕事は何年やっていますか？",
    placeholder: "例: 10年",
    required: true,
    exampleKey: "jobYears",
  },
];

/* ---------- Choice questions config (Q3–Q7) ---------- */
const CHOICE_QUESTIONS: {
  key: "strengths" | "praised" | "hobbies" | "hardship" | "unique";
  label: string;
  description?: string;
  choices: readonly string[];
  required: boolean;
  exampleKey: keyof typeof HAYAPIN_EXAMPLES.inventory;
  supplementaryPlaceholder?: string;
}[] = [
  {
    key: "strengths",
    label: '3. 仕事の中で「周りより得意かも」と思うことは？',
    choices: INVENTORY_CHOICES.strengths,
    required: true,
    exampleKey: "strengths",
    supplementaryPlaceholder:
      "具体的なエピソードがあればぜひ！（任意）",
  },
  {
    key: "praised",
    label: '4. 人から「すごいね」「教えて」と言われたことは？',
    choices: INVENTORY_CHOICES.praised,
    required: false,
    exampleKey: "praised",
  },
  {
    key: "hobbies",
    label: "5. 3年以上続いている趣味・好きなことは？",
    choices: INVENTORY_CHOICES.hobbies,
    required: false,
    exampleKey: "hobbies",
  },
  {
    key: "hardship",
    label: "6. 人生で一番大変だった経験は？",
    choices: INVENTORY_CHOICES.hardship,
    required: false,
    exampleKey: "hardship",
    supplementaryPlaceholder:
      "どんな経験だったか教えてください（任意）",
  },
  {
    key: "unique",
    label: '7. 「他の人にはない経験かも」と思うユニークな体験は？',
    choices: INVENTORY_CHOICES.unique,
    required: false,
    exampleKey: "unique",
    supplementaryPlaceholder:
      "具体的に教えてください（任意）",
  },
];

/* ---------- Component ---------- */
export default function StepInventory() {
  const {
    inventory,
    genre,
    imposterCheck,
    selectedCombination,
    aiResults,
    updateInventory,
    setImposterCheck,
    setSelectedCombination,
    setAiResults,
  } = useWizardStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showImposterQuestion, setShowImposterQuestion] = useState(false);
  const [phase, setPhase] = useState<
    "questions" | "analysis" | "imposter" | "combinations"
  >(() => {
    if (selectedCombination) return "combinations";
    if (aiResults.combinations) return "imposter";
    return "questions";
  });

  // Parse existing store values into choice selections + supplementary text
  const [choiceState, setChoiceState] = useState(() => {
    const result: Record<
      string,
      { selected: string[]; supplementary: string }
    > = {};
    for (const q of CHOICE_QUESTIONS) {
      result[q.key] = parseChoiceValue(
        inventory[q.key],
        q.choices,
      );
    }
    return result;
  });

  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      job: inventory.job,
      jobYears: inventory.jobYears,
      strengths: inventory.strengths,
      praised: inventory.praised,
      hobbies: inventory.hobbies,
      hardship: inventory.hardship,
      unique: inventory.unique,
    },
  });

  // Update a choice question's selected chips
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
      setValue(key as keyof InventoryFormData, combined, {
        shouldValidate: true,
      });
      updateInventory({ [key]: combined });
    },
    [setValue, updateInventory],
  );

  // Update a choice question's supplementary text
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
      setValue(key as keyof InventoryFormData, combined, {
        shouldValidate: true,
      });
      updateInventory({ [key]: combined });
    },
    [setValue, updateInventory],
  );

  const onAnalyze = useCallback(
    async (data: InventoryFormData) => {
      updateInventory(data);

      // Use cached results if available
      if (aiResults.combinations) {
        setPhase("imposter");
        setShowImposterQuestion(true);
        return;
      }

      setIsAnalyzing(true);
      setApiError(null);

      try {
        const res = await fetchWithRetry("/api/analyze-inventory", {
          inventory: data,
          genre,
        });
        const json = await res.json();
        setAiResults({ combinations: json.combinations });
        setPhase("imposter");
        setShowImposterQuestion(true);
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : "分析に失敗しました。もう一度お試しください。",
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [updateInventory, setAiResults, aiResults.combinations, genre],
  );

  const handleImposterResponse = (value: boolean) => {
    setImposterCheck(value);
    if (!value) {
      // No imposter feeling — go straight to combinations
      setPhase("combinations");
    }
    // If yes, stay in "imposter" phase to show encouragement + manual advance button
  };

  const handleSelectCombination = (pattern: string) => {
    setSelectedCombination(pattern);
  };

  const combinations = aiResults.combinations ?? [];

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold leading-relaxed">
          自分の棚卸し
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          あなたの強みを見つけるための質問です。完璧でなくてOK！
        </p>
      </div>

      {/* Part A: 棚卸し質問 */}
      {(phase === "questions" || phase === "analysis") && (
        <form onSubmit={handleSubmit(onAnalyze)} className="space-y-4">
          {/* Free-text questions (Q1, Q2) */}
          {FREE_TEXT_QUESTIONS.map((q) => (
            <Card key={q.key} className="rounded-2xl shadow-sm">
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <Label
                    htmlFor={q.key}
                    className="text-sm font-medium leading-relaxed"
                  >
                    {q.label}
                    {q.required && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        必須
                      </Badge>
                    )}
                  </Label>
                  <ExamplePopover
                    exampleText={
                      HAYAPIN_EXAMPLES.inventory[q.exampleKey]
                    }
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Textarea
                    id={q.key}
                    placeholder={q.placeholder}
                    className="min-h-[80px] flex-1 rounded-xl resize-none"
                    value={watch(q.key)}
                    onChange={(e) => {
                      setValue(q.key, e.target.value, { shouldValidate: true });
                      updateInventory({ [q.key]: e.target.value });
                    }}
                  />
                  <VoiceInput
                    onResult={(text) => {
                      const current = getValues(q.key);
                      const newValue = current ? current + text : text;
                      setValue(q.key, newValue, { shouldValidate: true });
                      updateInventory({ [q.key]: newValue });
                    }}
                  />
                </div>
                {errors[q.key] && (
                  <p className="text-sm text-destructive">
                    {errors[q.key]?.message}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Choice questions (Q3–Q7) */}
          {CHOICE_QUESTIONS.map((q) => (
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
              example={HAYAPIN_EXAMPLES.inventory[q.exampleKey]}
              required={q.required}
              error={errors[q.key]?.message}
            />
          ))}

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-xl text-base font-semibold"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                AIが分析中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                分析する
              </>
            )}
          </Button>

          {apiError && (
            <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="flex items-center gap-3 pt-4">
                <p className="flex-1 text-sm text-destructive">
                  {apiError}
                </p>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-lg"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  再試行
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      )}

      {/* Part C: インポスター症候群チェック */}
      {phase === "imposter" && (
        <div className="space-y-4">
          {showImposterQuestion && imposterCheck === null && (
            <Card className="rounded-2xl shadow-sm border-primary/30">
              <CardContent className="space-y-4 pt-6 text-center">
                <p className="text-lg font-medium leading-relaxed">
                  質問に答えながら、
                  <br />
                  「みんなできるし...」って思いましたか？
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-28 rounded-xl"
                    onClick={() => handleImposterResponse(true)}
                  >
                    はい、思った
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-28 rounded-xl"
                    onClick={() => handleImposterResponse(false)}
                  >
                    いいえ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {imposterCheck === true && phase === "imposter" && (
            <Card className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border-primary/30 shadow-sm duration-500">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="font-bold leading-relaxed">
                    {IMPOSTER_MESSAGE.title}
                  </h3>
                </div>
                <p className="text-sm leading-loose text-muted-foreground">
                  {IMPOSTER_MESSAGE.description}
                </p>
                <p className="rounded-xl bg-primary/10 p-4 text-sm font-medium leading-loose">
                  {IMPOSTER_MESSAGE.encouragement}
                </p>
              </CardContent>
            </Card>
          )}

          {imposterCheck !== null && phase === "imposter" && (
            <Button
              size="lg"
              className="h-14 w-full rounded-xl text-base font-semibold"
              onClick={() => setPhase("combinations")}
            >
              組み合わせを見る
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* Part B: 組み合わせ結果 */}
      {phase === "combinations" && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            AIがあなたの回答から3つのポジショニングを提案します。
            ピンとくるものを1つ選んでください。
          </p>

          {combinations.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  まだ組み合わせが生成されていません。棚卸しを入力して「分析する」を押してください。
                </p>
              </CardContent>
            </Card>
          ) : (
            combinations.map((combo, i) => (
              <Card
                key={i}
                className={`cursor-pointer rounded-2xl shadow-sm transition-all ${
                  selectedCombination === combo.positioning
                    ? "border-2 border-primary bg-primary/5"
                    : "hover:border-primary/30"
                }`}
                onClick={() =>
                  handleSelectCombination(combo.positioning)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectCombination(combo.positioning);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`パターン${i + 1}: ${combo.positioning}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      パターン {i + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {combo.pattern}
                    </span>
                    {selectedCombination === combo.positioning && (
                      <Check className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-base leading-relaxed">
                    {combo.positioning}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {combo.explanation}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
