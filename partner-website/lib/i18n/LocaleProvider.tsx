"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
  type MessageKey,
} from "./messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const VIETNAM_TIMEZONES = new Set(["Asia/Ho_Chi_Minh", "Asia/Saigon"]);

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "vi" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** Infer Vietnamese when the device looks Vietnam-based (tz or browser language). */
function detectDefaultLocale(): Locale {
  if (typeof window === "undefined") return "en";

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && VIETNAM_TIMEZONES.has(timeZone)) return "vi";
  } catch {
    /* ignore */
  }

  const languages =
    typeof navigator !== "undefined"
      ? navigator.languages?.length
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : []
      : [];

  if (languages.some((lang) => lang.toLowerCase().startsWith("vi"))) return "vi";

  return "en";
}

function resolveInitialLocale(): Locale {
  return readStoredLocale() ?? detectDefaultLocale();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(resolveInitialLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
