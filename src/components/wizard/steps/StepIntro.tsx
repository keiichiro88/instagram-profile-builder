"use client";

import { useState, useRef, useCallback } from "react";
import { useWizardStore } from "@/lib/store";
import { INSTAGRAM_STATUS_OPTIONS } from "@/lib/constants";
import { fetchWithRetry } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sparkles,
  Camera,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

type InstagramStatus =
  | "not_created"
  | "created_no_posts"
  | "posting_not_growing"
  | "profile_review_only";

function determinePhase(status: InstagramStatus): "initial" | "growth" {
  if (status === "not_created" || status === "created_no_posts") {
    return "initial";
  }
  return "growth";
}

/** ステータスがスクショ添付対象か */
function canUploadScreenshot(status: string | null): boolean {
  return (
    status === "posting_not_growing" || status === "profile_review_only"
  );
}

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

export default function StepIntro() {
  const {
    instagramStatus,
    genre,
    beforeScreenshot,
    screenshotAnalysis,
    setInstagramStatus,
    setGenre,
    setPhase,
    setBeforeScreenshot,
    setScreenshotAnalysis,
  } = useWizardStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStatusChange = (value: string) => {
    const status = value as InstagramStatus;
    setInstagramStatus(status);
    setPhase(determinePhase(status));
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGenre(e.target.value);
  };

  // Shared file processing logic
  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      if (!file.type.startsWith("image/")) {
        setUploadError("画像ファイルを選択してください");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setUploadError("画像サイズは4MB以下にしてください");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setBeforeScreenshot(dataUrl);

        setIsAnalyzing(true);
        try {
          const res = await fetchWithRetry("/api/analyze-screenshot", {
            image: dataUrl,
            genre: genre || "",
          });
          const json = await res.json();
          setScreenshotAnalysis(json);
        } catch {
          setUploadError("分析に失敗しました。もう一度お試しください。");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [genre, setBeforeScreenshot, setScreenshotAnalysis],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleRemoveScreenshot = () => {
    setBeforeScreenshot(null);
    setScreenshotAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold leading-relaxed">
          Instagram プロフィールビルダー
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          ステップバイステップで質問に答えていくと、
          <br />
          あなただけのプロフィールが完成します
        </p>
      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Instagram の現在の状況は？
            </CardTitle>
            <CardDescription className="leading-relaxed">
              あなたに合ったステップを案内します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={instagramStatus ?? ""}
              onValueChange={handleStatusChange}
              className="space-y-3"
            >
              {INSTAGRAM_STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={option.value} />
                  <span className="leading-relaxed">{option.label}</span>
                </label>
              ))}
            </RadioGroup>
            {instagramStatus === null && (
              <p className="mt-2 text-sm text-muted-foreground">
                いずれかを選択してください
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">発信ジャンル</CardTitle>
            <CardDescription className="leading-relaxed">
              どんなテーマで発信しますか？（例: 看護、料理、筋トレ）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="genre" className="sr-only">
              発信ジャンル
            </Label>
            <Input
              id="genre"
              placeholder="例: 看護、プログラミング、子育て"
              className="h-12 rounded-xl"
              value={genre}
              onChange={handleGenreChange}
            />
            {genre.trim() === "" && (
              <p className="mt-2 text-sm text-muted-foreground">
                発信ジャンルを入力してください
              </p>
            )}
          </CardContent>
        </Card>

        {/* Screenshot Upload — only for existing account users */}
        {canUploadScreenshot(instagramStatus) && (
          <Card className="rounded-2xl border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">
                  現在のプロフィールを分析
                </CardTitle>
              </div>
              <CardDescription className="leading-relaxed">
                スクリーンショットを添付すると、AIが現在のプロフィールを分析します。
                最後にBefore/Afterで比較できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Upload area with drag & drop */}
              {!beforeScreenshot && (
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/15 scale-[1.02]"
                      : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                  }`}
                >
                  <Camera className={`h-8 w-8 ${isDragging ? "text-primary" : "text-primary/60"}`} />
                  <span className="text-sm font-medium text-primary/80">
                    {isDragging ? "ここにドロップ" : "タップまたはドラッグ&ドロップ"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG / JPEG / 4MB以下
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}

              {/* Preview */}
              {beforeScreenshot && (
                <div className="relative">
                  <img
                    src={beforeScreenshot}
                    alt="現在のプロフィール"
                    className="w-full rounded-xl border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveScreenshot}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Analyzing state */}
              {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    AIが分析中...
                  </span>
                </div>
              )}

              {/* Analysis result */}
              {screenshotAnalysis && !isAnalyzing && (
                <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">現在のスコア</span>
                    <Badge
                      className={`text-sm ${
                        screenshotAnalysis.overallScore >= 7
                          ? "bg-green-100 text-green-700"
                          : screenshotAnalysis.overallScore >= 4
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {screenshotAnalysis.overallScore}/10
                    </Badge>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      良い点
                    </div>
                    {screenshotAnalysis.strengths.map((s, i) => (
                      <p key={i} className="text-xs leading-relaxed text-muted-foreground pl-5">
                        {s}
                      </p>
                    ))}
                  </div>

                  {/* Improvements */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      改善ポイント
                    </div>
                    {screenshotAnalysis.improvements.map((s, i) => (
                      <p key={i} className="text-xs leading-relaxed text-muted-foreground pl-5">
                        {s}
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 rounded-lg bg-primary/10 p-2 text-xs font-medium text-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                    このツールで改善したBefore/Afterを最後に確認できます
                  </div>
                </div>
              )}

              {/* Error */}
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}

              {/* Skip message */}
              {!beforeScreenshot && (
                <p className="text-center text-xs text-muted-foreground">
                  スキップしてもOK！あとからでも添付できます
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
