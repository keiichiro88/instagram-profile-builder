import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, parseJsonResponse } from "@/lib/gemini-helpers";
import { MODEL_FLASH } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inventory, genre } = body;

    if (!inventory || !genre) {
      return NextResponse.json(
        { error: "inventory and genre are required" },
        { status: 400 },
      );
    }

    const prompt = `あなたはSNSブランディングの専門家です。ユーザーのスキルと経験を分析して、「100人に1人」のユニークな組み合わせパターンを見つけてください。

## ユーザーの棚卸し情報
- 仕事: ${inventory.job}
- 経験年数: ${inventory.jobYears}
- 得意なこと: ${inventory.strengths}
- 褒められること: ${inventory.praised || "未記入"}
- 趣味・好きなこと: ${inventory.hobbies || "未記入"}
- 大変だった経験: ${inventory.hardship || "未記入"}
- ユニークな経験: ${inventory.unique || "未記入"}
- 発信ジャンル: ${genre}

## 指示
- 2つ以上の異なるスキル・経験を掛け合わせて、3つのユニークな組み合わせパターンを作ってください
- それぞれの組み合わせは、両方を持っている人が珍しいものにしてください
- その組み合わせがInstagramのコンテンツテーマとして機能するものにしてください
- 各パターンに一行のポジショニングステートメントをつけてください

## 出力JSON形式
{
  "combinations": [
    {
      "pattern": "掛け合わせのカテゴリ名（例: 職歴 × 趣味）",
      "positioning": "一行のポジショニングステートメント",
      "explanation": "なぜこの組み合わせがユニークで効果的なのかの説明（2〜3文）"
    }
  ]
}

3つのパターンを返してください。`;

    const response = await callGeminiWithRetry(prompt, { model: MODEL_FLASH });
    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    const parsed = parseJsonResponse(text);
    if (!parsed || !Array.isArray(parsed.combinations)) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("analyze-inventory error:", error);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 },
    );
  }
}

