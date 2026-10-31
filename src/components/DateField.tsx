"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import { cx, ICON, Sheet } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** A date row that opens the site's own calendar. Dates before today can't be picked. */
export function DateField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const now = new Date();
  const today = isoOf(now.getFullYear(), now.getMonth(), now.getDate());
  const start = value ? new Date(`${value}T00:00:00`) : now;
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });
  const month = (delta: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (m + delta + 12) % 12 }));
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();

  return (
    <>
      <button type="button" className="tag press flex min-h-14 w-full items-center gap-3 px-4 text-left" onClick={() => setOpen(true)}>
        <CalendarDays size={24} {...ICON} aria-hidden className="shrink-0 text-santa" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] leading-tight text-ink-2">{label}</span>
          <span className={cx("block font-serif text-[18px] leading-snug", value ? "text-[#2a1713]" : "text-ink-3")}>{value ? formatDate(value) : t("chooseDate")}</span>
        </span>
        <ChevronRight size={20} {...ICON} aria-hidden className="shrink-0 text-ink-3" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="flex items-center justify-between pb-2">
          <button type="button" className="icon-plain" aria-label={t("prevMonth")} onClick={() => month(-1)}>
            <ChevronLeft size={24} {...ICON} />
          </button>
          <b className="font-serif text-[18px] font-normal">{new Date(view.y, view.m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</b>
          <button type="button" className="icon-plain" aria-label={t("nextMonth")} onClick={() => month(1)}>
            <ChevronRight size={24} {...ICON} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="pb-1 text-[13px] text-ink-2" aria-hidden>
              {d}
            </span>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <span key={`gap-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const iso = isoOf(view.y, view.m, i + 1);
            const selected = iso === value;
            return (
              <button
                key={iso}
                type="button"
                disabled={iso < today}
                aria-label={formatDate(iso)}
                aria-pressed={selected}
                className={cx(
                  "tnum press mx-auto grid size-11 place-items-center rounded-full text-[16px] disabled:opacity-30",
                  selected ? "bg-[var(--santa)] font-semibold text-[var(--paper-light)]" : iso === today ? "font-semibold ring-2 ring-[var(--santa)]" : "hover:bg-[var(--hover)]",
                )}
                onClick={() => {
                  onChange(iso);
                  setOpen(false);
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        {value && (
          <button
            type="button"
            className="btn-secondary mt-4 h-12 w-full"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {t("clearDate")}
          </button>
        )}
      </Sheet>
    </>
  );
}
