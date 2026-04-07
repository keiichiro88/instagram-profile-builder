"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWizardStore } from "@/lib/store";
import { fetchWithRetry } from "@/lib/api-client";
import { CharCounter } from "@/components/shared/CharCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";

/* ---------- Schema ---------- */
const accountNameSchema = z.object({
  preferredName: z.string().min(1, "名前を入力してください"),
  searchKeywords: z.string().min(1, "キーワードを入力してください"),
});

type AccountNameFormData = z.infer<typeof accountNameSchema>;

/* ---------- Component ---------- */
export default function StepAccountName() {
  const {
    accountName,
    selectedAccountName,
    selectedCombination,
    aiResults,
    inventory,
    genre,
    updateAccountName,
    setSelectedAccountName,
    setAiResults,
  } = useWizardStore();

  // Dynamic keyword suggestions derived from store data (m6)
  const keywordSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    if (genre) suggestions.add(genre);
    if (inventory.job) {
      const jobWords = inventory.job
        .split(/[、,\s・×]+/)
        .filter((w) => w.length >= 2);
      jobWords.forEach((w) => suggestions.add(w));
    }
    if (inventory.strengths) {
      const strengthWords = inventory.strengths
        .split(/[、,\s・]+/)
        .filter((w) => w.length >= 2);
      strengthWords.slice(0, 2).forEach((w) => suggestions.add(w));
    }
    if (aiResults.combinations?.length) {
      const selected = aiResults.combinations[0];
      if (selected.positioning) {
        const posWords = selected.positioning
          .split(/[×→\s｜|]+/)
          .filter((w) => w.length >= 2);
        posWords.slice(0, 2).forEach((w) => suggestions.add(w));
      }
    }
    return Array.from(suggestions).slice(0, 5);
  }, [inventory, genre, aiResults]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(selectedAccountName ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountNameFormData>({
    resolver: zodResolver(accountNameSchema),
    defaultValues: {
      preferredName: accountName.preferredName,
      searchKeywords: accountName.searchKeywords,
    },
  });

  const currentKeywords = watch("searchKeywords");

  const onGenerate = useCallback(
    async (data: AccountNameFormData) => {
      updateAccountName(data);

      // Use cached results if available
      if (aiResults.accountNames) {
        return;
      }

      setIsGenerating(true);
      setApiError(null);

      try {
        const res = await fetchWithRetry("/api/generate-account-names", {
          preferredName: data.preferredName,
          searchKeywords: data.searchKeywords,
          selectedCombination: selectedCombination || "",
          genre,
        });
        const json = await res.json();
        setAiResults({ accountNames: json.names });
      } catch (err) {
        setApiError(
          err instanceof Error ? err.message : "生成に失敗しました。もう一度お試しください。",
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [updateAccountName, setAiResults, aiResults.accountNames, selectedCombination, genre],
  );

  const handleSelectName = (name: string) => {
    setSelectedAccountName(name);
    setEditValue(name);
    setIsEditing(false);
  };

  const handleEditName = () => {
    setIsEditing(true);
  };

  const handleEditConfirm = () => {
    if (editValue.trim()) {
      setSelectedAccountName(editValue.trim());
      setIsEditing(false);
    }
  };

  const displayNames = aiResults.accountNames ?? null;

  const addKeyword = (keyword: string) => {
    const current = currentKeywords;
    if (current) {
      setValue("searchKeywords", `${current}、${keyword}`);
    } else {
      setValue("searchKeywords", keyword);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold leading-relaxed">
          アカウント名の生成
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          検索されやすく、覚えやすい名前を見つけましょう。
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="preferredName" className="text-sm font-medium">
                使いたい名前
              </Label>
              <Input
                id="preferredName"
                placeholder="例: ハヤピン、はやぴん"
                className="h-12 rounded-xl"
                {...register("preferredName")}
              />
              {errors.preferredName && (
                <p className="text-sm text-destructive">
                  {errors.preferredName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchKeywords" className="text-sm font-medium">
                検索されたいキーワード
              </Label>
              <Input
                id="searchKeywords"
                placeholder="例: 看護師、注射、SNS"
                className="h-12 rounded-xl"
                {...register("searchKeywords")}
              />
              {errors.searchKeywords && (
                <p className="text-sm text-destructive">
                  {errors.searchKeywords.message}
                </p>
              )}

              {/* Keyword Suggestions */}
              {keywordSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground">候補:</span>
                {keywordSuggestions.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    className="inline-flex h-7 items-center rounded-full border border-dashed border-primary/40 px-2.5 text-xs text-primary transition-colors hover:bg-primary/5"
                    onClick={() => addKeyword(kw)}
                  >
                    + {kw}
                  </button>
                ))}
              </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="h-14 w-full rounded-xl text-base font-semibold"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              生成する
            </>
          )}
        </Button>

        {apiError && (
          <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
            <CardContent className="flex items-center gap-3 pt-4">
              <p className="flex-1 text-sm text-destructive">{apiError}</p>
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

      {/* Generated Names */}
      {displayNames && (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed">
            3つの候補ができました。ピンとくるものを選んでください。
          </p>

          {displayNames.map((result, i) => (
              <Card
                key={i}
                className={`cursor-pointer rounded-2xl shadow-sm transition-all ${
                  selectedAccountName === result.name
                    ? "border-2 border-primary bg-primary/5"
                    : "hover:border-primary/30"
                }`}
                onClick={() => handleSelectName(result.name)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold leading-relaxed">
                      {result.name}
                    </span>
                    {selectedAccountName === result.name && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="mt-2">
                    <CharCounter text={result.name} maxWidth={20} type="line" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {result.explanation}
                  </p>
                </CardContent>
              </Card>
          ))}

          {/* Edit Mode */}
          {selectedAccountName && (
            <Card className="rounded-2xl border-dashed shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  選んだ名前を微調整する
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-12 rounded-xl text-lg font-bold"
                    />
                    <div className="flex items-center justify-between">
                      <CharCounter text={editValue} maxWidth={20} type="line" />
                      <Button
                        size="sm"
                        className="rounded-lg"
                        onClick={handleEditConfirm}
                        disabled={!editValue.trim()}
                      >
                        確定
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {selectedAccountName}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={handleEditName}
                    >
                      編集
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
