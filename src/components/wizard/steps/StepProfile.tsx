"use client";

import { useState, useMemo, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { fetchWithRetry } from "@/lib/api-client";
import { checkLineWidth, checkTotalLength } from "@/lib/char-count";
import type { ProfileLine } from "@/lib/types";
import { CharCounter } from "@/components/shared/CharCounter";
import { VoiceInput } from "@/components/shared/VoiceInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Sparkles,
  Check,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

/* ---------- Line Type Labels ---------- */
const LINE_TYPE_LABELS: Record<ProfileLine["type"], string> = {
  who: "誰に",
  why: "なぜ",
  benefit: "どうなれるか",
  authority: "権威性",
  cta: "CTA",
};

const LINE_TYPE_COLORS: Record<ProfileLine["type"], string> = {
  who: "bg-blue-100 text-blue-700",
  why: "bg-purple-100 text-purple-700",
  benefit: "bg-green-100 text-green-700",
  authority: "bg-amber-100 text-amber-700",
  cta: "bg-pink-100 text-pink-700",
};

/* ---------- Status Icon ---------- */
function StatusIcon({ status }: { status: "ok" | "warning" | "error" }) {
  if (status === "ok") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "warning")
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <AlertCircle className="h-4 w-4 text-destructive" />;
}

/* ---------- Component ---------- */
export default function StepProfile() {
  const {
    phase,
    genre,
    selectedCombination,
    trust,
    selectedAccountName,
    selectedProfile,
    editedProfile,
    aiResults,
    screenshotAnalysis,
    setSelectedProfile,
    setEditedProfile,
    setAiResults,
  } = useWizardStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!!editedProfile);

  const handleGenerate = useCallback(async () => {
    // Use cached results if available
    if (aiResults.profiles) {
      return;
    }

    setIsGenerating(true);
    setApiError(null);

    try {
      const res = await fetchWithRetry("/api/generate-profiles", {
        phase: phase || "initial",
        accountName: selectedAccountName || "",
        selectedCombination: selectedCombination || "",
        trust,
        genre,
        screenshotAnalysis: screenshotAnalysis || undefined,
      });
      const json = await res.json();
      setAiResults({ profiles: json.profiles });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [phase, genre, selectedAccountName, selectedCombination, trust, aiResults.profiles, setAiResults, screenshotAnalysis]);

  const handleRegenerate = useCallback(async () => {
    setIsGenerating(true);
    setApiError(null);
    setSelectedProfile(null);
    setEditedProfile(null);
    setIsEditing(false);

    try {
      const res = await fetchWithRetry("/api/generate-profiles", {
        phase: phase || "initial",
        accountName: selectedAccountName || "",
        selectedCombination: selectedCombination || "",
        trust,
        genre,
        screenshotAnalysis: screenshotAnalysis || undefined,
      });
      const json = await res.json();
      setAiResults({ profiles: json.profiles });
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "再生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [phase, genre, selectedAccountName, selectedCombination, trust, setAiResults, setSelectedProfile, setEditedProfile, screenshotAnalysis]);

  const handleSelectProfile = (text: string) => {
    setSelectedProfile(text);
    setEditedProfile(text);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleEditChange = useCallback(
    (value: string) => {
      setEditedProfile(value);
    },
    [setEditedProfile]
  );

  // Heuristic line type detection for edit mode (m7)
  const detectLineType = useCallback(
    (text: string, lineIndex: number, totalLines: number): ProfileLine["type"] | null => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      // CTA: last line, or lines with arrows/symbols
      if (
        lineIndex === totalLines - 1 ||
        /^[▼▽↓🔽→➡]/.test(trimmed) ||
        /こちら|チェック|詳細|タップ/.test(trimmed)
      ) {
        return "cta";
      }
      // Authority: numbers + credentials
      if (/\d+年|万人|実績|経験|資格/.test(trimmed)) return "authority";
      // Who: target person references
      if (/さん|へ|向け|ための/.test(trimmed) && lineIndex < 2) return "who";
      // Benefit: outcome language
      if (/できる|なれる|変わる|解決|失敗しない|コツ|方法|すべて/.test(trimmed)) return "benefit";
      // Why: story/motivation
      if (/教える|伝える|発信|公開|元[・]|苦手|克服/.test(trimmed)) return "why";
      return null;
    },
    []
  );

  // Real-time validation for edited profile
  const editValidation = useMemo(() => {
    if (!editedProfile) return null;
    const lines = editedProfile.split("\n");
    const lineChecks = lines.map((line, i) => {
      const lineType = detectLineType(line, i, lines.length);
      return {
        text: line,
        lineType,
        ...checkLineWidth(line),
      };
    });
    const totalCheck = checkTotalLength(editedProfile);
    // Check which 3要素 are present
    const hasWho = lineChecks.some((l) => l.lineType === "who");
    const hasBenefit = lineChecks.some((l) => l.lineType === "benefit");
    const hasAuthority = lineChecks.some((l) => l.lineType === "authority");
    return { lines: lineChecks, total: totalCheck, hasWho, hasBenefit, hasAuthority };
  }, [editedProfile, detectLineType]);

  const displayProfiles = aiResults.profiles ?? null;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold leading-relaxed">
          プロフィール文の生成
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          棚卸し結果をもとに、最適なプロフィール文を生成します。
        </p>
      </div>

      {/* Summary Card */}
      <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="space-y-2 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            これまでの回答まとめ
          </p>
          {selectedCombination && (
            <div className="text-sm leading-relaxed">
              <span className="font-medium">ポジショニング:</span>{" "}
              {selectedCombination}
            </div>
          )}
          {trust.targetPerson && (
            <div className="text-sm leading-relaxed">
              <span className="font-medium">ターゲット:</span>{" "}
              {trust.targetPerson}
            </div>
          )}
          {selectedAccountName && (
            <div className="text-sm leading-relaxed">
              <span className="font-medium">アカウント名:</span>{" "}
              {selectedAccountName}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      {!displayProfiles && (
        <div className="space-y-3">
          <Button
            size="lg"
            className="h-14 w-full rounded-xl text-base font-semibold"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                プロフィール文を生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                プロフィール文を生成
              </>
            )}
          </Button>

          {apiError && (
            <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="flex items-center gap-3 pt-4">
                <p className="flex-1 text-sm text-destructive">{apiError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-lg"
                  onClick={handleGenerate}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  再試行
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Profile Results */}
      {displayProfiles && !isEditing && (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed">
            3つのパターンから選んでください。選んだ後に自由に編集できます。
          </p>

          {displayProfiles.map((profile, i) => (
            <Card
              key={i}
              className={`cursor-pointer rounded-2xl shadow-sm transition-all ${
                selectedProfile === profile.text
                  ? "border-2 border-primary bg-primary/5"
                  : "hover:border-primary/30"
              }`}
              onClick={() => handleSelectProfile(profile.text)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectProfile(profile.text);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`プロフィールパターン${i + 1}を選択`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    パターン {i + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <CharCounter text={profile.text} maxWidth={150} type="total" />
                    {selectedProfile === profile.text && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Line-by-line breakdown */}
                <div className="space-y-1.5">
                  {profile.lines.map((line, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{line.text}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          className={`text-[10px] ${LINE_TYPE_COLORS[line.type]}`}
                        >
                          {LINE_TYPE_LABELS[line.type]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            line.isBenefit
                              ? "border-green-300 text-green-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {line.isBenefit ? "ベネ" : "特徴"}
                        </Badge>
                        <span
                          className={`text-[10px] ${
                            line.isWithinLimit
                              ? "text-muted-foreground"
                              : "font-bold text-destructive"
                          }`}
                        >
                          {line.displayWidth}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Duplicate detection */}
                {profile.duplicateWithName.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    アカウント名と重複: {profile.duplicateWithName.join("、")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Action buttons */}
          <div className="space-y-2">
            {selectedProfile && (
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl"
                onClick={handleStartEdit}
              >
                選んだプロフィールを編集する
              </Button>
            )}
            <Button
              variant="ghost"
              className="h-10 w-full rounded-xl text-muted-foreground"
              disabled={isGenerating}
              onClick={handleRegenerate}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  再生成中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  別のパターンを再生成
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && editedProfile !== null && (
        <div className="space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">プロフィール文を編集</CardTitle>
              <CardDescription className="leading-relaxed">
                改行で区切ると見やすくなります。1行23文字幅以内が目安です。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Textarea
                  value={editedProfile}
                  onChange={(e) => handleEditChange(e.target.value)}
                  className="min-h-[160px] flex-1 rounded-xl resize-none font-mono text-sm leading-loose"
                  placeholder="プロフィール文を入力..."
                />
                <VoiceInput
                  onResult={(text) => {
                    handleEditChange(
                      editedProfile ? editedProfile + text : text,
                    );
                  }}
                />
              </div>

              {/* Real-time validation (m14: aria-live) */}
              {editValidation && (
                <div className="space-y-2" aria-live="polite">
                  {/* 3要素チェック (m7) */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      className={`text-[10px] ${
                        editValidation.hasWho
                          ? "bg-blue-100 text-blue-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {editValidation.hasWho ? "OK" : "?"} 誰に
                    </Badge>
                    <Badge
                      className={`text-[10px] ${
                        editValidation.hasBenefit
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {editValidation.hasBenefit ? "OK" : "?"} ベネフィット
                    </Badge>
                    <Badge
                      className={`text-[10px] ${
                        editValidation.hasAuthority
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {editValidation.hasAuthority ? "OK" : "?"} 権威性
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      行別チェック
                    </span>
                    <div className="flex items-center gap-1">
                      {editValidation.total.isWithinLimit ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          editValidation.total.isWithinLimit
                            ? "text-green-600"
                            : "text-destructive"
                        }`}
                      >
                        {editValidation.total.length}/150文字
                        {editValidation.total.remaining >= 0
                          ? `（残り${editValidation.total.remaining}）`
                          : `（${Math.abs(editValidation.total.remaining)}文字超過）`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {editValidation.lines.map((line, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-lg p-2 text-sm ${
                          line.status === "error"
                            ? "bg-destructive/10"
                            : line.status === "warning"
                              ? "bg-amber-50"
                              : "bg-muted/50"
                        }`}
                      >
                        <StatusIcon status={line.status} />
                        <span className="flex-1 leading-relaxed">
                          {line.text || "(空行)"}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {line.lineType && (
                            <Badge
                              className={`text-[10px] ${LINE_TYPE_COLORS[line.lineType]}`}
                            >
                              {LINE_TYPE_LABELS[line.lineType]}
                            </Badge>
                          )}
                          <span
                            className={`text-xs ${
                              line.status === "error"
                                ? "font-bold text-destructive"
                                : line.status === "warning"
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {line.width}/23
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setIsEditing(false)}
            >
              パターン選択に戻る
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              disabled={isGenerating}
              onClick={handleRegenerate}
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              再生成
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
