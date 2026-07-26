"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { usePathname } from "next/navigation";
import { submitLanguageFeedback } from "@/app/(studio)/admin/actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  readLanguageFeedbackEnabled,
  writeLanguageFeedbackEnabled,
} from "@/lib/language-feedback";

type Draft = {
  text: string;
  top: number;
  left: number;
};

function selectionIsEditable(node: Node | null): boolean {
  let el: Element | null =
    node instanceof Element ? node : node?.parentElement ?? null;
  while (el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return true;
    }
    if (el instanceof HTMLElement && el.isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

function clampPopover(top: number, left: number, width: number, height: number) {
  const pad = 12;
  const maxLeft = Math.max(pad, window.innerWidth - width - pad);
  const maxTop = Math.max(pad, window.innerHeight - height - pad);
  return {
    top: Math.min(Math.max(pad, top), maxTop),
    left: Math.min(Math.max(pad, left), maxLeft),
  };
}

export function LanguageFeedbackLayer() {
  const { t, locale } = useLocale();
  const pathname = usePathname() || "/";
  const [enabled, setEnabled] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEnabled(readLanguageFeedbackEnabled());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (detail && typeof detail.enabled === "boolean") {
        setEnabled(detail.enabled);
        return;
      }
      setEnabled(readLanguageFeedbackEnabled());
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "partner-studio-language-feedback") {
        setEnabled(readLanguageFeedbackEnabled());
      }
    }
    window.addEventListener(
      "partner-studio-language-feedback-change",
      onChange,
    );
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(
        "partner-studio-language-feedback-change",
        onChange,
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(null);
    setComment("");
    setMessage(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearDraft();
      return;
    }

    function onMouseUp(e: MouseEvent) {
      const target = e.target;
      if (
        target instanceof Node &&
        panelRef.current?.contains(target)
      ) {
        return;
      }

      // Let the selection settle after mouseup.
      window.setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
        const text = sel.toString().replace(/\s+/g, " ").trim();
        if (!text || text.length < 2) return;
        if (selectionIsEditable(sel.anchorNode)) return;

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) return;

        const approxWidth = 320;
        const approxHeight = 280;
        const pos = clampPopover(
          rect.bottom + 10,
          rect.left + rect.width / 2 - approxWidth / 2,
          approxWidth,
          approxHeight,
        );

        setDraft({ text, top: pos.top, left: pos.left });
        setComment("");
        setMessage(null);
      }, 0);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") clearDraft();
    }

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, clearDraft]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      setMessage(null);
      const result = await submitLanguageFeedback({
        selectedText: draft.text,
        pagePath: pathname,
        locale,
        comment,
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      clearDraft();
      window.getSelection()?.removeAllRanges();
    });
  }

  if (!enabled) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[60] flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-quieter border border-admin/30 bg-admin-soft/95 px-3 py-2 text-xs font-medium text-admin-deep shadow-sm backdrop-blur">
          <span>{t("langFeedback.activeHint")}</span>
          <button
            type="button"
            onClick={() => writeLanguageFeedbackEnabled(false)}
            className="rounded border border-admin/25 bg-white/70 px-2 py-0.5 font-semibold transition hover:border-admin/50"
          >
            {t("langFeedback.turnOff")}
          </button>
        </div>
      </div>

      {draft ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("langFeedback.dialogLabel")}
          className="fixed z-[70] w-[min(20rem,calc(100vw-1.5rem))] rounded-soft border border-admin/35 bg-white p-3 shadow-lg"
          style={{ top: draft.top, left: draft.left }}
        >
          <form onSubmit={onSubmit} className="space-y-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-deep">
                {t("langFeedback.marked")}
              </p>
              <p className="mt-1 max-h-24 overflow-y-auto rounded-quieter bg-foam/80 px-2.5 py-2 text-sm text-charcoal">
                {draft.text}
              </p>
            </div>
            <p className="text-[11px] text-muted">
              {t("langFeedback.meta", {
                page: pathname,
                lang: locale.toUpperCase(),
              })}
            </p>
            <label className="block">
              <span className="text-xs font-medium text-charcoal">
                {t("langFeedback.comment")}
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder={t("langFeedback.commentPlaceholder")}
                className="mt-1 block w-full resize-y rounded-quieter border border-line bg-foam/60 px-2.5 py-2 text-sm text-charcoal outline-none transition focus:border-admin focus:ring-2 focus:ring-admin/20"
              />
            </label>
            {message ? (
              <p className="text-xs text-coral-deep" role="status">
                {message}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={clearDraft}
                className="rounded-quieter border border-line bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition hover:border-admin/30"
              >
                {t("langFeedback.cancel")}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-quieter bg-admin px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-admin-deep disabled:opacity-50"
              >
                {pending ? t("langFeedback.saving") : t("langFeedback.save")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
