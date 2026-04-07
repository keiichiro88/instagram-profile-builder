import type { WizardState } from "./types";

/**
 * 各ステップの必須フィールドが埋まっているか判定する。
 * WizardShell の「次へ」ボタン / スワイプ前に呼び出す。
 */
export function getCanAdvance(step: number, state: WizardState): boolean {
  switch (step) {
    case 0:
      return state.instagramStatus !== null && state.genre.trim() !== "";
    case 1:
      return (
        state.inventory.job.trim() !== "" &&
        state.inventory.strengths.trim() !== "" &&
        state.selectedCombination !== null
      );
    case 2:
      return (
        state.trust.motivation.trim() !== "" &&
        state.trust.struggle.trim() !== "" &&
        state.trust.targetPerson.trim() !== "" &&
        state.trust.futureVision.trim() !== ""
      );
    case 3:
      return (
        state.icon.showFace !== null && state.icon.impressions.length > 0
      );
    case 4:
      return state.selectedAccountName !== null;
    case 5:
      return state.editedProfile !== null || state.selectedProfile !== null;
    case 6:
      // Last step — always can advance (nowhere to go)
      return true;
    default:
      return false;
  }
}

/**
 * ステップ毎のバリデーション未完了メッセージを返す。
 */
export function getValidationMessage(step: number, state: WizardState): string {
  switch (step) {
    case 0:
      if (state.instagramStatus === null) return "Instagramの状況を選択してください";
      if (state.genre.trim() === "") return "発信ジャンルを入力してください";
      return "";
    case 1:
      if (state.inventory.job.trim() === "") return "お仕事を入力してください";
      if (state.inventory.strengths.trim() === "") return "得意なことを入力してください";
      if (state.selectedCombination === null) return "組み合わせパターンを選んでください";
      return "";
    case 2:
      if (state.trust.motivation.trim() === "") return "きっかけを入力してください";
      if (state.trust.struggle.trim() === "") return "苦労・挫折の経験を入力してください";
      if (state.trust.targetPerson.trim() === "") return "届けたい人を入力してください";
      if (state.trust.futureVision.trim() === "") return "未来のビジョンを入力してください";
      return "";
    case 3:
      if (state.icon.showFace === null) return "顔出しの選択をしてください";
      if (state.icon.impressions.length === 0) return "イメージを1つ以上選択してください";
      return "";
    case 4:
      if (state.selectedAccountName === null) return "アカウント名を選択してください";
      return "";
    case 5:
      if (state.editedProfile === null && state.selectedProfile === null)
        return "プロフィール文を選択してください";
      return "";
    default:
      return "";
  }
}
