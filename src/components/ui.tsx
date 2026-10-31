"use client";

import { AlertTriangle, Check, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/** One line-icon set everywhere: 2px stroke, round caps and joins. */
export const ICON = { strokeWidth: 2 } as const;

/** Choose one of a few views: paper tags, the chosen one lifted. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-2.5">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="tab-tag"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Inline note. Text stays in the main text colour (contrast-safe); the icon carries the tone. */
export function Callout({
  tone = "info",
  icon,
  children,
}: {
  tone?: "info" | "warn" | "error" | "success";
  icon?: ReactNode;
  children: ReactNode;
}) {
  const sticker = { info: "bg-[#2a1713]", warn: "bg-[#a9750f]", error: "bg-[var(--santa)]", success: "bg-[var(--accent)]" }[tone];
  const Default = { info: Info, warn: AlertTriangle, error: XCircle, success: CheckCircle2 }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className="card flex gap-3 px-4 py-3.5 text-[15px] leading-snug">
      <span className={cx("mt-px grid size-8 shrink-0 place-items-center rounded-full text-[var(--paper-light)] shadow-[0_0_0_2px_#fff,0_3px_6px_rgb(0_0_0/0.3)]", sticker)} aria-hidden>
        {icon ?? <Default size={18} {...ICON} />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** A 13px secondary label sitting above a card, with an optional action on the right. */
export function Section({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex min-h-8 items-end justify-between gap-2 px-1">
        <h2 className="font-script text-[30px] leading-tight text-gold">{title}</h2>
        {action}
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

// ---------- Bottom sheet ------------------------------------------------------

/**
 * Glass sheet on a native <dialog> (focus trap, Esc, inert background for
 * free). Slides up; close circle at top left, optional filled confirm circle
 * at top right. Swipe the handle down or tap outside to close.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  onConfirm,
  confirmForm,
  confirmLabel,
  confirmDisabled,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onConfirm?: () => void;
  /** id of a <form> inside the sheet: the confirm circle submits it. */
  confirmForm?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const [dy, setDy] = useState(0);
  // The dialog's "close" event arrives asynchronously; only treat it as a user
  // dismissal while we still think the sheet is open (avoids races with a
  // sheet that was just reopened or swapped).
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // showModal focuses the close circle, which would show its focus ring on
      // every open; start on the sheet itself instead (Tab still reaches it).
      d.focus();
    }
    if (!open && d.open) d.close();
    const root = document.documentElement;
    if (open) root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="sheet"
      style={dy ? { transform: `translateY(${dy}px)` } : undefined}
      onClose={() => openRef.current && onClose()}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[inherit] flex-col">
        <div
          className="flex cursor-grab touch-none justify-center pt-2 pb-1"
          onPointerDown={(e) => {
            drag.current = { y: e.clientY, dy: 0 };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            drag.current.dy = Math.max(0, e.clientY - drag.current.y);
            setDy(drag.current.dy);
          }}
          onPointerUp={() => {
            const moved = drag.current?.dy ?? 0;
            drag.current = null;
            setDy(0);
            if (moved > 90) onClose();
          }}
        >
          <span aria-hidden className="h-[5px] w-9 rounded-full bg-[var(--line)]" />
        </div>
        <header className="grid grid-cols-[44px_1fr_44px] items-center gap-2 px-4 pb-3">
          <button type="button" className="icon-btn" aria-label={t("close")} onClick={onClose}>
            <X size={22} {...ICON} />
          </button>
          <div className="min-w-0 text-center">
            <h2 id={titleId} className="truncate font-serif text-[19px]">
              {title}
            </h2>
            {subtitle && <p className="truncate text-[14px] text-ink-2">{subtitle}</p>}
          </div>
          {onConfirm || confirmForm ? (
            <button
              type={confirmForm ? "submit" : "button"}
              form={confirmForm}
              className="press inline-grid size-11 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
              aria-label={confirmLabel ?? t("done")}
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              <Check size={22} {...ICON} />
            </button>
          ) : (
            <span />
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          {open && children}
        </div>
      </div>
    </dialog>
  );
}
