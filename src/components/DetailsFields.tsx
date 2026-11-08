"use client";

import { useT } from "@/lib/i18n";
import { DateField } from "./DateField";

// A group's details, on their own so the new-group page doesn't load the people editor with them.

export interface DetailValues {
  name: string;
  budget: string;
  date: string;
  note: string;
}

const QUICK_BUDGETS = [200, 300, 500, 1000];

/** The budget as one big number, with shortcuts for the usual amounts. */
function BudgetField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  const shown = value ? Number(value).toLocaleString("en-US") : "";
  return (
    <div className="tag px-4 pt-2 pb-3">
      <label className="block text-center">
        <span className="block text-[13px] text-ink-2">{t("budget")}</span>
        <span className="flex items-baseline justify-center gap-1 font-bold text-[#2c2825]">
          <span className="text-[24px] text-ink-2">฿</span>
          <input
            // A red line under the number while typing, as a field's border turns red.
            className="tnum rounded-sm bg-transparent text-center text-[44px] leading-tight outline-none placeholder:text-ink-3/50 focus:shadow-[inset_0_-2px_0_var(--santa)]"
            style={{ width: `${Math.max(1, shown.length) + 0.4}ch` }}
            aria-label={t("budget")}
            inputMode="numeric"
            placeholder="0"
            value={shown}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
          />
          {/* A hidden ฿ balancing the real one, so the number itself sits in the middle. */}
          <span aria-hidden className="invisible text-[24px]">฿</span>
        </span>
      </label>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {QUICK_BUDGETS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === String(n)}
            className={`tnum press min-h-10 rounded-lg px-3 font-label text-[15px] ${value === String(n) ? "bg-[var(--santa)] text-[var(--paper-light)]" : "bg-field text-[#2c2825]"}`}
            onClick={() => onChange(value === String(n) ? "" : String(n))}
          >
            ฿{n.toLocaleString("en-US")}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[13px] text-ink-2">{t("budgetHint")}</p>
    </div>
  );
}

export function DetailsFields({ value, onChange }: { value: DetailValues; onChange: (v: DetailValues) => void }) {
  const t = useT();
  const set = (patch: Partial<DetailValues>) => onChange({ ...value, ...patch });
  return (
    <div className="card space-y-3 p-4">
      <input className="input" maxLength={60} value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder={t("groupName")} aria-label={t("groupName")} />
      <BudgetField value={value.budget} onChange={(budget) => set({ budget })} />
      <DateField value={value.date} onChange={(date) => set({ date })} label={t("date")} />
      <textarea
        className="input py-3"
        rows={2}
        maxLength={400}
        value={value.note}
        onChange={(e) => set({ note: e.target.value })}
        placeholder={t("note")}
        aria-label={t("note")}
      />
    </div>
  );
}

export const detailsBody = (d: DetailValues) => ({
  name: d.name.trim(),
  budget: d.budget ? Number(d.budget) : null,
  date: d.date || null,
  note: d.note.trim(),
});
