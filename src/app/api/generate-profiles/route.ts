import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithRetry, parseJsonResponse, countDisplayWidth } from "@/lib/gemini-helpers";
import { MODEL_PRO } from "@/lib/gemini";
import type { ProfileResult, ProfileLine } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phase, accountName, selectedCombination, trust, genre, screenshotAnalysis } = body;

    if (!phase || !accountName || !trust || !genre) {
      return NextResponse.json(
        {
          error:
            "phase, accountName, trust, and genre are required",
        },
        { status: 400 },
      );
    }

    const phaseInstructions =
      phase === "initial"
        ? "初期フェーズ: 純粋な価値提供のみ。リンク、宣伝、CTAは入れない。"
        : "成長フェーズ: CTA行を1行入れてOK（例: 「▷ピン留め投稿から見てね↓」）。";

    const prompt = `あなたはInstagramプロフィール最適化の専門家です。3つのプロフィール文パターンを生成してください。

## ユーザー情報
- アカウント名: ${accountName}
- ポジショニング: ${selectedCombination || "未設定"}
- 発信ジャンル: ${genre}
- ターゲット: ${trust.targetPerson}
- 発信の動機: ${trust.motivation}
- 苦労した経験: ${trust.struggle}
- 届けたい未来: ${trust.futureVision}

## ルール（必ず守ること）
1. 各プロフィールには以下の3要素を必ず含めること:
   - 誰に (who): 具体的なターゲット
   - なぜ (why): あなたの動機やストーリー
   - どうなれるか (benefit): 具体的なベネフィット・変化
2. 1行の表示幅は全角23文字以内（折り返しが起きない）
3. 全体で150文字以内
4. 「特徴」ではなく「ベネフィット」で書くこと:
   - BAD: 「注射のコツを発信中」（特徴）
   - GOOD: 「注射の成功率が上がる」（ベネフィット）
5. アカウント名（${accountName}）に含まれる内容を繰り返さない
6. ${phaseInstructions}
7. 権威性（資格・実績）はアカウント名に入れるもの。プロフ文では例外的に1行だけOK（ストーリーに絡める場合）
8. ゴール: 好奇心ギャップを作る → 投稿を見たくなる → 保存される → アルゴリズムで再表示 → 自然なフォロー${
      screenshotAnalysis
        ? `

## 現在のプロフィール分析結果（Before）
ユーザーには既存のプロフィールがあり、AI分析済みです。
- 現在のプロフィール文: ${screenshotAnalysis.currentProfile}
- 良い点（活かすべき要素）: ${(screenshotAnalysis.strengths as string[]).join("、")}
- 改善点（改善すべき要素）: ${(screenshotAnalysis.improvements as string[]).join("、")}
- 現在のスコア: ${screenshotAnalysis.overallScore}/10

## 重要な指示
- 上記の「良い点」はユーザーがこだわっている要素です。新しいプロフィールでもできるだけ活かしてください
- 「改善点」を重点的に改善した3パターンを生成してください
- 既存プロフィールの雰囲気や方向性を尊重しつつ、ルールに沿って最適化してください`
        : ""
    }

## 表示幅の計算ルール
- 半角英数字・半角カナ: 0.5
- 絵文字: 2
- それ以外（全角文字）: 1
- 最終的にMath.ceil()で切り上げ

## 各行の分類
各行を以下のいずれかに分類してください:
- "who": ターゲットを示す行
- "why": 動機・ストーリーを示す行
- "benefit": ベネフィットを示す行
- "authority": 権威性・実績を示す行
- "cta": CTAを示す行

## 出力JSON形式
{
  "profiles": [
    {
      "text": "プロフィール文（改行区切り）",
      "lines": [
        {
          "text": "行テキスト",
          "type": "who|why|benefit|authority|cta",
          "isBenefit": true/false
        }
      ]
    }
  ]
}

3つの異なるアプローチのパターンを返してください。`;

    const response = await callGeminiWithRetry(prompt, { model: MODEL_PRO });
    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    const parsed = parseJsonResponse(text);
    if (!parsed || !Array.isArray(parsed.profiles)) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }

    // Post-process: recalculate displayWidth, totalChars, duplicates server-side
    const profiles: ProfileResult[] = (
      parsed.profiles as Array<Record<string, unknown>>
    ).map((profile) => {
      const profileText = String(profile.text);
      const rawLines = profile.lines as Array<Record<string, unknown>>;
      const textLines = profileText.split("\n");
      const totalChars = [...profileText].length;

      const lines: ProfileLine[] = textLines.map((lineText, i) => {
        const rawLine = rawLines?.[i];
        const displayWidth = countDisplayWidth(lineText);
        const type = validateLineType(rawLine?.type as string) || "benefit";
        const isBenefit =
          rawLine?.isBenefit === true ||
          type === "benefit";
        return {
          text: lineText,
          displayWidth,
          isWithinLimit: displayWidth <= 23,
          type,
          isBenefit,
        };
      });

      // Check for duplicates with account name
      const duplicateWithName = findDuplicates(accountName, textLines);

      return {
        text: profileText,
        totalChars,
        lines,
        duplicateWithName,
      };
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("generate-profiles error:", error);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 },
    );
  }
}

function validateLineType(
  type: string,
): ProfileLine["type"] | null {
  const valid = ["who", "why", "benefit", "authority", "cta"];
  return valid.includes(type) ? (type as ProfileLine["type"]) : null;
}

function findDuplicates(accountName: string, lines: string[]): string[] {
  const duplicates: string[] = [];
  // Extract meaningful segments from account name (split on separators)
  const nameSegments = accountName
    .split(/[｜|／/×・\s]+/)
    .filter((s) => s.length >= 2);

  for (const line of lines) {
    for (const segment of nameSegments) {
      if (line.includes(segment)) {
        duplicates.push(segment);
      }
    }
  }
  return [...new Set(duplicates)];
}