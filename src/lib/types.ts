/** ウィザード全体の状態 */
export interface WizardState {
  currentStep: number;
  lastSavedAt: string;

  // Step 0: イントロ
  instagramStatus:
    | "not_created"
    | "created_no_posts"
    | "posting_not_growing"
    | "profile_review_only"
    | null;
  genre: string;
  phase: "initial" | "growth" | null;

  // Step 1: 自分の棚卸し
  inventory: InventoryData;
  imposterCheck: boolean | null;
  selectedCombination: string | null;

  // Step 2: 信頼設計
  trust: TrustData;

  // Step 3: アイコン設計
  icon: IconData;
  iconChecklist: string[] | null;

  // Step 4: アカウント名
  accountName: AccountNameData;
  selectedAccountName: string | null;

  // Step 5: プロフィール文
  selectedProfile: string | null;
  editedProfile: string | null;

  // スクリーンショット分析 (Before/After)
  beforeScreenshot: string | null; // base64 data URL
  screenshotAnalysis: ScreenshotAnalysis | null;
  beforeAfterEval: BeforeAfterEval | null;

  // AI生成結果キャッシュ
  aiResults: AiResults;
}

export interface ScreenshotAnalysis {
  currentProfile: string;
  strengths: string[];
  improvements: string[];
  overallScore: number;
  isDarkMode: boolean;
}

export interface BeforeAfterEval {
  beforeScore: number;
  afterScore: number;
  improvements: { point: string; achieved: boolean }[];
  summary: string;
  /** キャッシュ用: この評価が対象としたプロフィール文 */
  evaluatedProfile: string;
}

export interface InventoryData {
  job: string;
  jobYears: string;
  strengths: string;
  praised: string;
  hobbies: string;
  hardship: string;
  unique: string;
}

export interface TrustData {
  motivation: string;
  struggle: string;
  targetPerson: string;
  futureVision: string;
}

export interface IconData {
  showFace: boolean | null;
  impressions: string[];
  imageColor: string;
}

export interface AccountNameData {
  preferredName: string;
  searchKeywords: string;
}

export interface AiResults {
  combinations?: CombinationResult[];
  iconChecklist?: string[];
  accountNames?: AccountNameResult[];
  profiles?: ProfileResult[];
}

export interface CombinationResult {
  pattern: string;
  positioning: string;
  explanation: string;
}

export interface AccountNameResult {
  name: string;
  displayWidth: number;
  isWithinLimit: boolean;
  explanation: string;
}

export interface ProfileResult {
  text: string;
  totalChars: number;
  lines: ProfileLine[];
  duplicateWithName: string[];
}

export interface ProfileLine {
  text: string;
  displayWidth: number;
  isWithinLimit: boolean;
  type: "who" | "why" | "benefit" | "authority" | "cta";
  isBenefit: boolean;
  rewriteSuggestion?: string;
}

/** ステップ定義 */
export interface StepDefinition {
  id: number;
  name: string;
  shortName: string;
  episodeRef: string;
}

export const STEPS: StepDefinition[] = [
  { id: 0, name: "イントロ", shortName: "始める", episodeRef: "EP.1, 8" },
  {
    id: 1,
    name: "自分の棚卸し",
    shortName: "棚卸し",
    episodeRef: "EP.6, 7",
  },
  { id: 2, name: "信頼設計", shortName: "ストーリー", episodeRef: "EP.8" },
  {
    id: 3,
    name: "アイコン設計ガイド",
    shortName: "アイコン",
    episodeRef: "EP.9",
  },
  {
    id: 4,
    name: "アカウント名の生成",
    shortName: "名前",
    episodeRef: "EP.10",
  },
  {
    id: 5,
    name: "プロフィール文の生成",
    shortName: "プロフ文",
    episodeRef: "EP.10",
  },
  { id: 6, name: "完成", shortName: "完成", episodeRef: "" },
];
