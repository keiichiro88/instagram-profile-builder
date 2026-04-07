import { ai, MODEL } from "./gemini";

/**
 * Gemini API呼び出し（リトライ付き）
 */
export async function callGeminiWithRetry(
  prompt: string | { text?: string; inlineData?: { mimeType: string; data: string } }[],
  options: { retries?: number; model?: string; jsonOutput?: boolean } = {},
) {
  const { retries = 1, model = MODEL, jsonOutput = true } = options;
  try {
    return await ai.models.generateContent({
      model,
      contents: prompt,
      config: jsonOutput
        ? { responseMimeType: "application/json" }
        : undefined,
    });
  } catch (error) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return callGeminiWithRetry(prompt, { retries: retries - 1, model, jsonOutput });
    }
    throw error;
  }
}

/**
 * JSON応答のパース（コードブロック抽出フォールバック付き）
 */
export function parseJsonResponse(
  text: string
): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 文字表示幅カウント（サーバーサイド用 — char-count.ts と同一アルゴリズム）
 */
export function countDisplayWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    if (/[\x20-\x7E\uFF61-\uFF9F]/.test(char)) {
      width += 0.5;
    } else if (
      /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u.test(
        char
      )
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return Math.ceil(width);
}
