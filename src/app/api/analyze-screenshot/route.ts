import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, parseJsonResponse } from "@/lib/gemini-helpers";
import { MODEL_FLASH } from "@/lib/gemini";
import { rateLimitGuard, validateImageDataUrl } from "@/lib/api-validation";

export async function POST(req: NextRequest) {
  const rl = rateLimitGuard(req, 10, 60_000); // 10 req/min for image analysis
  if (rl) return rl;

  try {
    const body = await req.json();
    const { image, genre } = body;

    const imgResult = validateImageDataUrl(image);
    if (imgResult instanceof NextResponse) return imgResult;

    const { mimeType, base64: base64Data } = imgResult;

    const prompt = `あなたはInstagramプロフィール分析の専門家です。このスクリーンショットはユーザーの現在のInstagramプロフィール画面です。

## 分析してほしいこと
1. プロフィール欄に書かれているテキストを読み取ってください
2. 良い点（strengths）を3つ挙げてください
3. 改善点（improvements）を3つ挙げてください
4. 10点満点で総合スコアをつけてください

## 評価基準
- 「誰に」「なぜ」「どうなれるか」の3要素が入っているか
- ベネフィット（特徴ではなく成果）で書かれているか
- 1行23文字以内で読みやすいか
- 150文字以内に収まっているか
- 権威性・実績が適切に入っているか
- 好奇心ギャップがあるか（投稿を見たくなるか）
${genre ? `- 発信ジャンル「${genre}」に合った内容か` : ""}

5. スクリーンショットがダークモード（黒背景）かライトモード（白背景）かを判定してください

## 出力JSON形式
{
  "currentProfile": "読み取ったプロフィール文（改行は\\nで表現）",
  "strengths": ["良い点1", "良い点2", "良い点3"],
  "improvements": ["改善点1", "改善点2", "改善点3"],
  "overallScore": 数値（1-10）,
  "isDarkMode": true/false
}`;

    const response = await callGeminiWithRetry(
      [
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ],
      { model: MODEL_FLASH },
    );

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
      !parsed.currentProfile ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements)
    ) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("analyze-screenshot error:", error);
    return NextResponse.json(
      { error: "Screenshot analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
