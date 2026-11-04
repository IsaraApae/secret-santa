"use client";

import { AlertTriangle, Check, CheckCircle2, ChevronDown, Delete, Info, X, XCircle } from "lucide-react";
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
  const sticker = { info: "bg-[#2c2825]", warn: "bg-[#a9750f]", error: "bg-[var(--santa)]", success: "bg-[var(--accent)]" }[tone];
  const Default = { info: Info, warn: AlertTriangle, error: XCircle, success: CheckCircle2 }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className="card flex gap-3 px-4 py-3.5 text-[15px] leading-snug">
      <span className={cx("mt-px grid size-8 shrink-0 place-items-center rounded-full text-[var(--paper-light)] shadow-[0_0_0_2px_var(--sticker),0_3px_6px_rgb(0_0_0/0.3)]", sticker)} aria-hidden>
        {icon ?? <Default size={18} {...ICON} />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** The die-cut stickers from the Cultural Fest CI (public/stickers), each with its own off-white edge. The shadow is
    CSS, drawn at screen resolution: a filter inside the SVG made them soft when shown larger. */
export type StickerName =
  | "bell" | "calendar" | "candle" | "flower" | "gift" | "gingerbread" | "info" | "megaphone" | "mitten" | "music" | "north-star"
  | "ornament" | "palette" | "question" | "snowflake" | "spark" | "stage" | "star" | "stocking" | "tree" | "warning";

export function Sticker({ name, size = 40, className, style }: { name: StickerName; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/stickers/${name}.svg`} alt="" aria-hidden height={size} draggable={false} className={cx("pointer-events-none w-auto shrink-0 drop-shadow-[0_2px_2px_rgb(0_0_0/0.3)] select-none", className)} style={{ height: size, ...style }} />
  );
}

/**
 * A gold script heading above a note, with an optional action on the right. A sticker sits at the end of the
 * title's last line and wraps with it, so it never covers anything; headings with an action leave it out.
 */
export function Section({ title, action, sticker, children }: { title: ReactNode; action?: ReactNode; sticker?: StickerName; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex min-h-8 items-end justify-between gap-2 px-1">
        <h2 className="font-script text-[32px] leading-tight text-gold">
          {title}
          {sticker && !action && <Sticker name={sticker} size={32} className="ml-2 inline-block rotate-[9deg] align-[-0.05em]" />}
        </h2>
        {action}
      </div>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

// ---------- Bottom sheet ------------------------------------------------------

/**
 * How far a phone's on-screen keyboard covers the bottom of the screen. The
 * keyboard doesn't shrink the page, so a sheet resting on the bottom edge would
 * sit underneath it while someone types.
 */
function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setInset(0);
    };
  }, [active]);
  return inset;
}

/**
 * Paper sheet on a native <dialog> (focus trap, Esc, inert background for
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
  const keyboard = useKeyboardInset(open);
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
      // every open; start on the sheet itself instead (Tab still reaches it),
      // or on the field marked to take it, like the PIN keypad.
      const first = d.querySelector<HTMLElement>("[data-autofocus]");
      if (first) first.focus({ preventScroll: true });
      else d.focus();
    }
    if (!open && d.open) d.close();
    const root = document.documentElement;
    if (open) root.style.overflow = "hidden";
    return () => {
      // A picker's sheet can open over another sheet: the page stays still while any other is open.
      if (![...document.querySelectorAll("dialog[open]")].some((x) => x !== d)) root.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="sheet"
      style={{
        ...(dy ? { transform: `translateY(${dy}px)` } : {}),
        // Rest on the keyboard while it's up, short enough to stay on screen.
        ...(keyboard ? { marginBottom: keyboard + 8, maxHeight: `calc(100dvh - ${keyboard + 24}px)` } : {}),
      }}
      // A picker's sheet opens inside this one, and React passes its close and cancel up here: only this
      // sheet's own count, or picking from the inner one would close both.
      onClose={(e) => e.target === e.currentTarget && openRef.current && onClose()}
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
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

/**
 * A 4-digit PIN on the site's own number pad instead of the phone's keyboard: four dots fill as
 * paper keys are tapped. A computer's number keys, Backspace and Enter work on it too.
 */
export function PinPad({ value, onChange, label, autoFocus }: { value: string; onChange: (pin: string) => void; label: string; autoFocus?: boolean }) {
  const t = useT();
  const press = (key: string) => onChange(key === "del" ? value.slice(0, -1) : (value + key).slice(0, 4));
  return (
    <div
      // The sheet it's in focuses it on opening (see Sheet).
      data-autofocus={autoFocus || undefined}
      tabIndex={0}
      role="group"
      aria-label={label}
      className="pin-pad space-y-3"
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        else if (e.key === "Backspace") press("del");
        else if (e.key === "Enter") e.currentTarget.closest("form")?.requestSubmit();
        else return;
        e.preventDefault();
      }}
    >
      <div className="flex justify-center gap-5 py-1.5" role="status" aria-label={t("pinTyped", { n: value.length })}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} aria-hidden className={cx("size-4 rounded-full border-2 border-[#2c2825]/55", i < value.length && "pin-dot bg-[#2c2825]")} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((key) =>
          key === "" ? (
            <span key="gap" />
          ) : (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              className="chip h-13 justify-center text-[26px] tnum disabled:opacity-40"
              aria-label={key === "del" ? t("deleteDigit") : key}
              disabled={key === "del" ? !value : value.length === 4}
              onClick={() => press(key)}
            >
              {key === "del" ? <Delete size={24} {...ICON} aria-hidden /> : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

/** One of a list, chosen on a sheet in the site's own style instead of the phone's wheel. Looks like a field. */
export function Choice({
  value,
  options,
  onChange,
  label,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value && o.value !== "");
  return (
    <>
      <button type="button" className={cx("input flex items-center justify-between gap-2 text-left disabled:opacity-60", className)} aria-haspopup="dialog" aria-label={`${label}: ${current?.label ?? placeholder}`} disabled={disabled} onClick={() => setOpen(true)}>
        <span className={cx("min-w-0 truncate", !current && "text-ink-3")}>{current?.label ?? placeholder}</span>
        <ChevronDown size={18} {...ICON} aria-hidden className="shrink-0 text-ink-2" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <ul className="card rows mb-2" role="listbox" aria-label={label}>
          {options.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value || "none"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  disabled={o.disabled}
                  className={cx("press flex min-h-12 w-full items-center justify-between gap-3 px-5 py-3 text-left text-[17px] disabled:opacity-40", o.value === "" && "text-ink-2")}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {on && <Check size={20} {...ICON} aria-hidden className="shrink-0 text-accent-strong" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
