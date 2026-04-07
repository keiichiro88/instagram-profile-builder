import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WizardState, InventoryData, TrustData, IconData, AccountNameData, AiResults, ScreenshotAnalysis, BeforeAfterEval } from "./types";

const initialInventory: InventoryData = {
  job: "",
  jobYears: "",
  strengths: "",
  praised: "",
  hobbies: "",
  hardship: "",
  unique: "",
};

const initialTrust: TrustData = {
  motivation: "",
  struggle: "",
  targetPerson: "",
  futureVision: "",
};

const initialIcon: IconData = {
  showFace: null,
  impressions: [],
  imageColor: "#F5A623",
};

const initialAccountName: AccountNameData = {
  preferredName: "",
  searchKeywords: "",
};

const initialState: WizardState = {
  currentStep: 0,
  lastSavedAt: "",
  instagramStatus: null,
  genre: "",
  phase: null,
  inventory: initialInventory,
  imposterCheck: null,
  selectedCombination: null,
  trust: initialTrust,
  icon: initialIcon,
  iconChecklist: null,
  accountName: initialAccountName,
  selectedAccountName: null,
  selectedProfile: null,
  editedProfile: null,
  beforeScreenshot: null,
  screenshotAnalysis: null,
  beforeAfterEval: null,
  aiResults: {},
};

interface WizardActions {
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setInstagramStatus: (status: WizardState["instagramStatus"]) => void;
  setGenre: (genre: string) => void;
  setPhase: (phase: WizardState["phase"]) => void;
  updateInventory: (data: Partial<InventoryData>) => void;
  setImposterCheck: (value: boolean) => void;
  setSelectedCombination: (value: string) => void;
  updateTrust: (data: Partial<TrustData>) => void;
  updateIcon: (data: Partial<IconData>) => void;
  setIconChecklist: (checklist: string[]) => void;
  updateAccountName: (data: Partial<AccountNameData>) => void;
  setSelectedAccountName: (name: string) => void;
  setSelectedProfile: (profile: string | null) => void;
  setEditedProfile: (profile: string | null) => void;
  setBeforeScreenshot: (data: string | null) => void;
  setScreenshotAnalysis: (analysis: ScreenshotAnalysis | null) => void;
  setBeforeAfterEval: (eval_: BeforeAfterEval | null) => void;
  setAiResults: (results: Partial<AiResults>) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...initialState,

      nextStep: () =>
        set((s) => ({
          currentStep: Math.min(s.currentStep + 1, 6),
          lastSavedAt: new Date().toISOString(),
        })),

      prevStep: () =>
        set((s) => ({
          currentStep: Math.max(s.currentStep - 1, 0),
        })),

      goToStep: (step: number) =>
        set({ currentStep: Math.max(0, Math.min(step, 6)) }),

      setInstagramStatus: (instagramStatus) => set({ instagramStatus }),
      setGenre: (genre) => set({ genre }),
      setPhase: (phase) => set({ phase }),

      updateInventory: (data) =>
        set((s) => ({
          inventory: { ...s.inventory, ...data },
          lastSavedAt: new Date().toISOString(),
        })),

      setImposterCheck: (imposterCheck) => set({ imposterCheck }),
      setSelectedCombination: (selectedCombination) =>
        set({ selectedCombination }),

      updateTrust: (data) =>
        set((s) => ({
          trust: { ...s.trust, ...data },
          lastSavedAt: new Date().toISOString(),
        })),

      updateIcon: (data) =>
        set((s) => ({
          icon: { ...s.icon, ...data },
          lastSavedAt: new Date().toISOString(),
        })),

      setIconChecklist: (iconChecklist) => set({ iconChecklist }),

      updateAccountName: (data) =>
        set((s) => ({
          accountName: { ...s.accountName, ...data },
          lastSavedAt: new Date().toISOString(),
        })),

      setSelectedAccountName: (selectedAccountName) =>
        set({ selectedAccountName }),
      setSelectedProfile: (selectedProfile) => set({ selectedProfile }),
      setEditedProfile: (editedProfile) => set({ editedProfile }),
      setBeforeScreenshot: (beforeScreenshot) => set({ beforeScreenshot }),
      setScreenshotAnalysis: (screenshotAnalysis) => set({ screenshotAnalysis }),
      setBeforeAfterEval: (beforeAfterEval) => set({ beforeAfterEval }),

      setAiResults: (results) =>
        set((s) => ({
          aiResults: { ...s.aiResults, ...results },
        })),

      reset: () => set(initialState),
    }),
    {
      name: "profile-builder-state",
    }
  )
);
