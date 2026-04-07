/**
 * Instagram表示幅での文字数カウント
 * 全角=1、半角=0.5、絵文字=2（Instagram仕様）
 */
export function countDisplayWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    if (/[\x20-\x7E\uFF61-\uFF9F]/.test(char)) {
      width += 0.5;
    } else if (/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u.test(char)) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return Math.ceil(width);
}

/**
 * 1行の文字幅チェック（安全ライン: 全角23文字以内）
 */
export function checkLineWidth(line: string): {
  width: number;
  isWithinLimit: boolean;
  status: "ok" | "warning" | "error";
} {
  const width = countDisplayWidth(line);
  return {
    width,
    isWithinLimit: width <= 23,
    status: width <= 20 ? "ok" : width <= 23 ? "warning" : "error",
  };
}

/**
 * プロフィール全体の文字数チェック（150文字制限）
 */
export function checkTotalLength(text: string): {
  length: number;
  isWithinLimit: boolean;
  remaining: number;
} {
  const length = [...text].length;
  return {
    length,
    isWithinLimit: length <= 150,
    remaining: 150 - length,
  };
}

/**
 * アカウント名の文字幅チェック（全角20文字以内）
 */
export function checkAccountNameWidth(name: string): {
  width: number;
  isWithinLimit: boolean;
} {
  const width = countDisplayWidth(name);
  return {
    width,
    isWithinLimit: width <= 20,
  };
}
