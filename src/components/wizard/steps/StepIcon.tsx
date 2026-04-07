"use client";

import { useState, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { IMPRESSION_OPTIONS } from "@/lib/constants";
import { fetchWithRetry } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Camera,
  CameraOff,
  Loader2,
  CheckSquare,
  Square,
  Palette,
  RefreshCw,
} from "lucide-react";

/* ---------- Color Palette ---------- */
const COLOR_PALETTE = [
  { value: "#F5A623", label: "ゴールド" },
  { value: "#E91E63", label: "ピンク" },
  { value: "#4CAF50", label: "グリーン" },
  { value: "#2196F3", label: "ブルー" },
  { value: "#9C27B0", label: "パープル" },
  { value: "#FF5722", label: "オレンジ" },
  { value: "#607D8B", label: "グレー" },
  { value: "#795548", label: "ブラウン" },
];

/* ---------- Component ---------- */
export default function StepIcon() {
  const {
    icon,
    iconChecklist,
    genre,
    selectedCombination,
    aiResults,
    updateIcon,
    setIconChecklist,
    setAiResults,
  } = useWizardStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleFaceToggle = (showFace: boolean) => {
    updateIcon({ showFace });
  };

  const handleImpressionToggle = (impression: string) => {
    const current = icon.impressions;
    if (current.includes(impression)) {
      updateIcon({
        impressions: current.filter((i) => i !== impression),
      });
    } else if (current.length < 3) {
      updateIcon({
        impressions: [...current, impression],
      });
    }
  };

  const handleColorChange = (color: string) => {
    updateIcon({ imageColor: color });
  };

  const handleGenerateChecklist = useCallback(async () => {
    // Use cached results if available
    if (aiResults.iconChecklist) {
      setIconChecklist(aiResults.iconChecklist);
      return;
    }

    setIsGenerating(true);
    setApiError(null);

    try {
      const res = await fetchWithRetry("/api/generate-icon-checklist", {
        showFace: icon.showFace,
        impressions: icon.impressions,
        imageColor: icon.imageColor,
        genre,
        combination: selectedCombination || "",
      });
      const json = await res.json();
      setIconChecklist(json.checklist);
      setAiResults({ iconChecklist: json.checklist });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [icon, genre, selectedCombination, aiResults.iconChecklist, setIconChecklist, setAiResults]);

  const toggleChecked = (index: number) => {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const canProceed =
    icon.showFace !== null && icon.impressions.length > 0 && icon.imageColor;

  const displayChecklist = iconChecklist ?? null;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold leading-relaxed">
          アイコン設計ガイド
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          プロフィール写真の方向性を決めましょう。
          <br />
          実際の撮影・作成は後でOKです。
        </p>
      </div>

      {/* 顔出し */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">顔出しできますか？</CardTitle>
          <CardDescription className="leading-relaxed">
            顔出しの方が信頼感は高いですが、イラストやロゴでもOKです
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={icon.showFace === true ? "default" : "outline"}
              className="h-14 flex-1 rounded-xl text-base"
              onClick={() => handleFaceToggle(true)}
            >
              <Camera className="mr-2 h-5 w-5" />
              顔出しする
            </Button>
            <Button
              type="button"
              variant={icon.showFace === false ? "default" : "outline"}
              className="h-14 flex-1 rounded-xl text-base"
              onClick={() => handleFaceToggle(false)}
            >
              <CameraOff className="mr-2 h-5 w-5" />
              顔出ししない
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* イメージ選択 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            伝えたいイメージを3つ選択
          </CardTitle>
          <CardDescription className="leading-relaxed">
            {icon.impressions.length}/3 選択済み
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {IMPRESSION_OPTIONS.map((option) => {
              const isSelected = icon.impressions.includes(option);
              const isDisabled =
                !isSelected && icon.impressions.length >= 3;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={isDisabled}
                  aria-label={option}
                  aria-pressed={isSelected}
                  className={`inline-flex h-12 items-center rounded-full border px-4 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : isDisabled
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                        : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => handleImpressionToggle(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* カラー選択 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            イメージカラー
          </CardTitle>
          <CardDescription className="leading-relaxed">
            アイコンに使うメインカラーを選んでください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color.value}
                type="button"
                aria-label={color.label}
                aria-pressed={icon.imageColor === color.value}
                className={`group flex flex-col items-center gap-1 ${
                  icon.imageColor === color.value ? "scale-110" : ""
                }`}
                onClick={() => handleColorChange(color.value)}
              >
                <div
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    icon.imageColor === color.value
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-transparent group-hover:border-foreground/30"
                  }`}
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {color.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="customColor" className="text-xs text-muted-foreground">
              カスタム:
            </Label>
            <Input
              id="customColor"
              type="color"
              value={icon.imageColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border-border p-1"
            />
            <span className="text-xs text-muted-foreground">
              {icon.imageColor}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* チェックリスト生成 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">撮影チェックリスト</CardTitle>
          <CardDescription className="leading-relaxed">
            選んだ設定に基づいて、撮影時のチェックリストを生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiError && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="flex-1 text-sm text-destructive">{apiError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-lg"
                onClick={handleGenerateChecklist}
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                再試行
              </Button>
            </div>
          )}

          {!displayChecklist ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl"
              disabled={!canProceed || isGenerating}
              onClick={handleGenerateChecklist}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "チェックリスト生成"
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              {displayChecklist.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                  onClick={() => toggleChecked(i)}
                >
                  {checkedItems[i] ? (
                    <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Square className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={`text-sm leading-relaxed ${
                      checkedItems[i]
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {item}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
