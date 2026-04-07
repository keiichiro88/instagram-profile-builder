"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWizardStore } from "@/lib/store";
import { captureAsImage, copyToClipboard, downloadAsPdf } from "@/lib/export";
import { fetchWithRetry } from "@/lib/api-client";
import InstagramMockup from "@/components/preview/InstagramMockup";
import ProfileCard from "@/components/preview/ProfileCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  PartyPopper,
  Copy,
  ImageDown,
  FileDown,
  CheckSquare,
  Square,
  Check,
  RotateCcw,
  Smartphone,
  Loader2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

/* ---------- Next Actions ---------- */
const NEXT_ACTIONS = [
  "アイコンを撮影/作成する",
  "Instagramでプロフィールを設定する",
  "ピン留め投稿を作る",
  "ハイライトを整理する",
];

/* ---------- Component ---------- */
export default function StepComplete() {
  const {
    selectedAccountName,
    editedProfile,
    selectedProfile,
    selectedCombination,
    icon,
    genre,
    beforeScreenshot,
    screenshotAnalysis,
    beforeAfterEval,
    setBeforeAfterEval,
    prevStep,
    reset,
  } = useWizardStore();

  const [copied, setCopied] = useState(false);
  const [capturingMockup, setCapturingMockup] = useState(false);
  const [capturingCard, setCapturingCard] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>(
    {}
  );

  const mockupRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const profileText = editedProfile ?? selectedProfile ?? "";
  const accountName = selectedAccountName ?? "";

  // Before/After evaluation: run on mount if screenshot exists and profile changed
  useEffect(() => {
    if (!screenshotAnalysis || !profileText) return;
    // Skip if already evaluated for this exact profile text
    if (beforeAfterEval?.evaluatedProfile === profileText) return;

    let cancelled = false;
    const evaluate = async () => {
      setIsEvaluating(true);
      try {
        const res = await fetchWithRetry("/api/evaluate-before-after", {
          beforeProfile: screenshotAnalysis.currentProfile,
          afterProfile: profileText,
          beforeScore: screenshotAnalysis.overallScore,
          genre: genre || "",
        });
        const json = await res.json();
        if (!cancelled) {
          setBeforeAfterEval({ ...json, evaluatedProfile: profileText });
        }
      } catch {
        // Silently fail — the Before/After section won't show eval details
      } finally {
        if (!cancelled) setIsEvaluating(false);
      }
    };
    evaluate();
    return () => { cancelled = true; };
  }, [screenshotAnalysis, profileText, beforeAfterEval?.evaluatedProfile, genre, setBeforeAfterEval]);

  const handleCopy = useCallback(async () => {
    if (!profileText) return;
    const success = await copyToClipboard(profileText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [profileText]);

  const handleCaptureMockup = useCallback(async () => {
    if (!mockupRef.current) return;
    setCapturingMockup(true);
    try {
      await captureAsImage(
        mockupRef.current,
        `instagram-preview-${accountName || "profile"}`
      );
    } finally {
      setCapturingMockup(false);
    }
  }, [accountName]);

  const handleCaptureCard = useCallback(async () => {
    if (!cardRef.current) return;
    setCapturingCard(true);
    try {
      await captureAsImage(
        cardRef.current,
        `profile-card-${accountName || "profile"}`
      );
    } finally {
      setCapturingCard(false);
    }
  }, [accountName]);

  const handlePdf = useCallback(() => {
    downloadAsPdf();
  }, []);

  const toggleAction = (index: number) => {
    setCheckedActions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleReset = () => {
    if (window.confirm("すべてのデータをリセットしますか？")) {
      reset();
    }
  };

  const hasBefore = beforeScreenshot && screenshotAnalysis;

  return (
    <div className={`mx-auto w-full ${hasBefore ? "max-w-4xl" : "max-w-lg"} space-y-6`}>
      {/* Celebration */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold leading-relaxed">
          プロフィール完成！
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          おめでとうございます！ あなただけのプロフィールが完成しました。
        </p>
      </div>

      {/* Before/After Comparison */}
      {hasBefore && (
        <div className="space-y-4">
          {/* Score comparison header */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Before</p>
              <Badge
                className={`mt-1 text-lg font-bold ${
                  (beforeAfterEval?.beforeScore ?? screenshotAnalysis.overallScore) >= 7
                    ? "bg-green-100 text-green-700"
                    : (beforeAfterEval?.beforeScore ?? screenshotAnalysis.overallScore) >= 4
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {beforeAfterEval?.beforeScore ?? screenshotAnalysis.overallScore}/10
              </Badge>
            </div>
            <ArrowRight className="h-6 w-6 text-primary" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">After</p>
              {isEvaluating ? (
                <Loader2 className="mt-1 mx-auto h-6 w-6 animate-spin text-primary" />
              ) : beforeAfterEval ? (
                <Badge
                  className={`mt-1 text-lg font-bold ${
                    beforeAfterEval.afterScore >= 7
                      ? "bg-green-100 text-green-700"
                      : beforeAfterEval.afterScore >= 4
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {beforeAfterEval.afterScore}/10
                </Badge>
              ) : (
                <Badge className="mt-1 bg-green-100 text-lg font-bold text-green-700">
                  New!
                </Badge>
              )}
            </div>
          </div>

          {/* Side by side: Before screenshot + After mockup */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Before */}
            <div className="space-y-2">
              <p className="text-center text-sm font-medium text-muted-foreground">
                Before
              </p>
              <div className="mx-auto max-w-[400px] overflow-hidden rounded-2xl border opacity-80 shadow-sm">
                <img
                  src={beforeScreenshot}
                  alt="変更前のプロフィール"
                  className="w-full"
                />
              </div>
            </div>

            {/* After */}
            <div className="space-y-2">
              <p className="text-center text-sm font-medium text-primary">
                After
              </p>
              <InstagramMockup
                accountName={accountName}
                profileText={profileText}
                iconColor={icon.imageColor || "#F5A623"}
                showFace={icon.showFace}
                darkMode={screenshotAnalysis.isDarkMode}
                compact
              />
            </div>
          </div>

          {/* Improvements achieved — dynamic evaluation */}
          <Card className="mx-auto max-w-lg rounded-2xl border-green-200 bg-green-50/50 shadow-sm">
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  改善されたポイント
                </p>
              </div>
              {isEvaluating ? (
                <div className="flex items-center gap-2 py-2 pl-6">
                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  <p className="text-sm text-muted-foreground">
                    Before/After を比較分析中...
                  </p>
                </div>
              ) : beforeAfterEval ? (
                <>
                  {beforeAfterEval.improvements.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 pl-6">
                      {item.achieved ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      ) : (
                        <Square className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      )}
                      <p
                        className={`text-sm leading-relaxed ${
                          item.achieved ? "text-green-700" : "text-amber-600"
                        }`}
                      >
                        {item.point}
                      </p>
                    </div>
                  ))}
                  {beforeAfterEval.summary && (
                    <p className="mt-2 rounded-lg bg-green-100/50 p-2 text-center text-xs font-medium text-green-700">
                      {beforeAfterEval.summary}
                    </p>
                  )}
                </>
              ) : (
                // Fallback: show static improvements from initial analysis
                screenshotAnalysis.improvements.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 pl-6">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                    <p className="text-sm leading-relaxed text-green-700">
                      {item}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instagram Mockup Preview (hero) */}
      <div className="mx-auto max-w-lg space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          <span>Instagram プレビュー</span>
        </div>
        <InstagramMockup
          ref={mockupRef}
          accountName={accountName}
          profileText={profileText}
          iconColor={icon.imageColor || "#F5A623"}
          showFace={icon.showFace}
        />
      </div>

      {/* Profile Card */}
      <div className="mx-auto max-w-lg space-y-2">
        <div className="text-center text-sm text-muted-foreground">
          プロフィールカード
        </div>
        <ProfileCard
          ref={cardRef}
          accountName={accountName}
          profileText={profileText}
          iconColor={icon.imageColor || "#F5A623"}
          combination={selectedCombination}
        />
      </div>

      {/* Output Buttons */}
      <Card className="no-print mx-auto max-w-lg rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">プロフィールを保存</CardTitle>
          <CardDescription className="leading-relaxed">
            作成したプロフィール文をコピーまたは画像として保存できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="h-12 w-full rounded-xl text-base"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                コピーしました！
              </>
            ) : (
              <>
                <Copy className="mr-2 h-5 w-5" />
                プロフィール文をコピー
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
            onClick={handleCaptureCard}
            disabled={capturingCard}
          >
            {capturingCard ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <ImageDown className="mr-2 h-5 w-5" />
                プロフィールカードを保存
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
            onClick={handleCaptureMockup}
            disabled={capturingMockup}
          >
            {capturingMockup ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-5 w-5" />
                Instagram画面を保存
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
            onClick={handlePdf}
          >
            <FileDown className="mr-2 h-5 w-5" />
            PDF一括ダウンロード
          </Button>
        </CardContent>
      </Card>

      {/* Next Actions */}
      <Card className="no-print mx-auto max-w-lg rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">次にやること</CardTitle>
          <CardDescription className="leading-relaxed">
            プロフィールを活かすためのアクションリスト
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {NEXT_ACTIONS.map((action, i) => (
              <button
                key={i}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                onClick={() => toggleAction(i)}
              >
                {checkedActions[i] ? (
                  <CheckSquare className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={`text-sm leading-relaxed ${
                    checkedActions[i]
                      ? "text-muted-foreground line-through"
                      : ""
                  }`}
                >
                  {action}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="no-print mx-auto flex max-w-lg gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-14 rounded-xl"
          onClick={prevStep}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          戻る
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 flex-1 rounded-xl text-base"
          onClick={handleReset}
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          最初からやり直す
        </Button>
      </div>
    </div>
  );
}
