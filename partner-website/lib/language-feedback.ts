/** localStorage key for the admin “language feedback” selection mode. */
export const LANGUAGE_FEEDBACK_STORAGE_KEY = "partner-studio-language-feedback";

export type LanguageFeedbackRow = {
  id: string;
  selectedText: string;
  pagePath: string;
  locale: string;
  comment: string;
  createdAt: string;
};

export function readLanguageFeedbackEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LANGUAGE_FEEDBACK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeLanguageFeedbackEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(LANGUAGE_FEEDBACK_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(LANGUAGE_FEEDBACK_STORAGE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent("partner-studio-language-feedback-change", {
        detail: { enabled },
      }),
    );
  } catch {
    /* ignore */
  }
}
