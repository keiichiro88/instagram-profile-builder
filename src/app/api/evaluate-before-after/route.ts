import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, parseJsonResponse } from "@/lib/gemini-helpers";
import { MODEL_FLASH } from "@/lib/gemini";
import { rateLimitGuard } from "@/lib/api-validation";

export async function POST(req: NextRequest) {
  const rl = rateLimitGuard(req);
  if (rl) return rl;

  try {
    const body = await req.json();
    const { beforeProfile, afterProfile, beforeScore, genre } = body;

    if (!beforeProfile || !afterProfile) {
      return NextResponse.json(
        { error: "beforeProfile and afterProfile are required" },
        { status: 400 },
      );
    }

    const prompt = `あなたはInstagramプロフィールの改善評価の専門家です。
変更前（Before）と変更後（After）のプロフィール文を比較して、具体的にどの点が改善されたかを評価してください。

## Before（変更前）のプロフィール文
${beforeProfile}

## Before のスコア: ${beforeScore ?? "不明"}/10

## After（変更後）のプロフィール文
${afterProfile}

## 発信ジャンル: ${genre || "不明"}

## 評価基準
1. 「誰に」「なぜ」「どうなれるか」の3要素が入っているか
2. ベネフィット（成果）で書かれているか（特徴ではなく）
3. 1行23文字以内で読みやすいか
4. 150文字以内に収まっているか
5. 権威性・実績が適切に入っているか
6. 好奇心ギャップがあるか
7. アカウント名との重複がないか

## 指示
- BeforeとAfterを比較して、具体的に改善された点を3〜5個挙げてください
- 各改善ポイントについて、実際に改善されたかどうか（achieved: true/false）を判定してください
- Afterのプロフィールに対して10点満点のスコアをつけてください
- 全体の改善についての一行サマリーを書いてください

## 出力JSON形式
{
  "beforeScore": ${beforeScore ?? 5},
  "afterScore": 数値（1-10）,
  "improvements": [
    { "point": "改善ポイントの説明", "achieved": true/false }
  ],
  "summary": "全体の改善サマリー（1文）"
}`;

    const response = await callGeminiWithRetry(prompt, { model: MODEL_FLASH });
    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    const parsed = parseJsonResponse(text);
    if (
      !parsed ||
      !Array.isArray(parsed.improvements) ||
      typeof parsed.afterScore !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("evaluate-before-after error:", error);
    return NextResponse.json(
      { error: "Evaluation failed. Please try again." },
      { status: 500 },
    );
  }
}
