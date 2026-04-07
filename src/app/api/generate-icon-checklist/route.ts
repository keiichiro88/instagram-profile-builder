import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, parseJsonResponse } from "@/lib/gemini-helpers";
import { MODEL_FLASH } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { showFace, impressions, imageColor, genre, combination } = body;

    if (typeof showFace !== "boolean" || !impressions || !genre) {
      return NextResponse.json(
        { error: "showFace, impressions, and genre are required" },
        { status: 400 },
      );
    }

    const faceMode = showFace ? "顔出しする" : "顔出ししない（イラスト・ロゴ）";
    const impressionList = (impressions as string[]).join("、");

    const prompt = `あなたはInstagramプロフィール写真の専門家です。ユーザーの設定に基づいて、プロフィールアイコンの撮影・作成チェックリストを生成してください。

## ユーザーの設定
- 顔出し: ${faceMode}
- 伝えたいイメージ: ${impressionList}
- イメージカラー: ${imageColor || "指定なし"}
- 発信ジャンル: ${genre}
- ポジショニング: ${combination || "未設定"}

## 指示
- 5〜7個の具体的でアクションしやすいチェックリスト項目を生成してください
- ジャンル、伝えたいイメージ、顔出しの有無を考慮してください
- 顔出しの場合: 表情、服装、背景、ライティング、構図に関する具体的なアドバイス
- 顔出ししない場合: イラスト・ロゴのスタイル、色使い、シンボルに関する具体的なアドバイス
- 各項目は1文で簡潔に

## 出力JSON形式
{
  "checklist": ["チェックリスト項目1", "チェックリスト項目2", ...]
}

5〜7個の項目を返してください。`;

    const response = await callGeminiWithRetry(prompt, { model: MODEL_FLASH });
    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    const parsed = parseJsonResponse(text);
    if (!parsed || !Array.isArray(parsed.checklist)) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("generate-icon-checklist error:", error);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }
}