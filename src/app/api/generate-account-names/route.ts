import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, parseJsonResponse, countDisplayWidth } from "@/lib/gemini-helpers";
import { MODEL_FLASH } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { preferredName, searchKeywords, selectedCombination, genre } = body;

    if (!preferredName || !searchKeywords || !genre) {
      return NextResponse.json(
        { error: "preferredName, searchKeywords, and genre are required" },
        { status: 400 },
      );
    }

    const prompt = `あなたはInstagramアカウント名の設計専門家です。「名前+何者か」のフォーマットに従って、3つのアカウント名パターンを生成してください。

## ユーザー情報
- 使いたい名前: ${preferredName}
- 検索されたいキーワード: ${searchKeywords}
- ポジショニング: ${selectedCombination || "未設定"}
- 発信ジャンル: ${genre}

## ルール（必ず守ること）
1. 何をしている人か/誰なのかが一目でわかること
2. 検索可能であること（ジャンルキーワードを含む）
3. 覚えやすく、読みやすいこと
4. 区切り文字は「｜」「🏥」などの記号や絵文字を使ってOK
5. 表示幅が全角20文字以内であること

## 表示幅の計算ルール
- 半角英数字・半角カナ: 0.5
- 絵文字: 2
- それ以外（全角文字）: 1
- 最終的にMath.ceil()で切り上げ

## 出力JSON形式
{
  "names": [
    {
      "name": "アカウント名",
      "displayWidth": 数値,
      "isWithinLimit": true/false（20以内ならtrue）,
      "explanation": "このアカウント名のポイントの説明"
    }
  ]
}

3つのパターンを返してください。各パターンは異なるアプローチにしてください。`;

    const response = await callGeminiWithRetry(prompt, { model: MODEL_FLASH });
    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    const parsed = parseJsonResponse(text);
    if (!parsed || !Array.isArray(parsed.names)) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }

    // Recalculate displayWidth server-side for accuracy
    const names = (parsed.names as Array<Record<string, unknown>>).map(
      (item) => {
        const name = String(item.name);
        const displayWidth = countDisplayWidth(name);
        return {
          name,
          displayWidth,
          isWithinLimit: displayWidth <= 20,
          explanation: String(item.explanation),
        };
      },
    );

    return NextResponse.json({ names });
  } catch (error) {
    console.error("generate-account-names error:", error);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }
}