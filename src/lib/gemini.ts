import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/** 高品質モデル — プロフィール文生成など創造性が重要なタスク */
export const MODEL_PRO = "gemini-2.5-pro";

/** 高速・低コストモデル — 分析・分類・画像解析など */
export const MODEL_FLASH = "gemini-2.5-flash";

/** 後方互換性のためのデフォルトエクスポート */
export const MODEL = MODEL_PRO;
