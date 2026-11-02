"use client";

import { Ban, Plus, X } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { DateField } from "./DateField";
import { Callout, ICON, Section } from "./ui";

export interface EditPerson {
  id: string;
  name: string;
}
export type Pair = [string, string];

let nextTemp = 0;

/** People and exclusions. New people get a temporary id that the server replaces. */
export function PeopleEditor({
  people,
  pairs,
  onChange,
}: {
  people: EditPerson[];
  pairs: Pair[];
  onChange: (people: EditPerson[], pairs: Pair[]) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "";

  function addNames() {
    const added = name
      .split(/[,\n]/)
      .map((n) => n.trim().slice(0, 40))
      .filter(Boolean)
      .map((n) => ({ id: `new-${++nextTemp}`, name: n }));
    if (added.length) onChange([...people, ...added].slice(0, 50), pairs);
    setName("");
  }

  function removePerson(id: string) {
    onChange(
      people.filter((p) => p.id !== id),
      pairs.filter((pair) => !pair.includes(id)),
    );
  }

  function addPair() {
    const exists = pairs.some((p) => p.includes(a) && p.includes(b));
    if (a && b && a !== b && !exists) onChange(people, [...pairs, [a, b]]);
    setA("");
    setB("");
  }

  return (
    <>
      <Section title={t("sectionPeople")} action={people.length > 0 && <span className="pb-1 font-serif text-[15px] text-ink-2">{t("countPeople", { n: people.length })}</span>}>
        <div className="card p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addNames();
            }}
          >
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (/[,\n]/.test(text)) {
                  e.preventDefault();
                  setName(text);
                }
              }}
              placeholder={t("addName")}
              aria-label={t("addName")}
              enterKeyHint="done"
            />
            <button type="submit" className="press grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label={t("add")} disabled={!name.trim()}>
              <Plus size={22} {...ICON} aria-hidden />
            </button>
          </form>
          <p className="mt-2 px-1 text-[13px] text-ink-2">{t("addNameHint")}</p>
          {people.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {people.map((p) => (
                <li key={p.id} className="tag inline-flex min-h-11 items-center gap-1 pr-1 pl-3 text-[15px] font-medium">
                  <input
                    className="min-w-0 bg-transparent outline-none"
                    style={{ width: `${Math.max(2, [...p.name].length + 0.5)}ch` }}
                    maxLength={40}
                    value={p.name}
                    aria-label={p.name}
                    onChange={(e) => onChange(people.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)), pairs)}
                  />
                  <button type="button" className="press grid size-9 place-items-center rounded-full text-ink-2" aria-label={`${t("remove")} ${p.name}`} onClick={() => removePerson(p.id)}>
                    <X size={18} {...ICON} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {people.length === 3 && <Callout tone="warn">{t("threeWarn")}</Callout>}
      </Section>

      {people.length >= 3 && (
        <Section title={t("sectionExclusions")}>
          <div className="card space-y-3 p-4">
            <p className="px-1 text-[15px] leading-snug text-ink-2">{t("noExclusions")}</p>
            <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <select className="input min-w-0 pr-2 pl-4 text-[15px]" value={a} onChange={(e) => setA(e.target.value)} aria-label={t("personA")}>
                <option value="">{t("personA")}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === b}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select className="input min-w-0 pr-2 pl-4 text-[15px]" value={b} onChange={(e) => setB(e.target.value)} aria-label={t("personB")}>
                <option value="">{t("personB")}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === a}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button type="button" className="press grid size-12 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label={t("add")} disabled={!a || !b} onClick={addPair}>
                <Plus size={22} {...ICON} aria-hidden />
              </button>
            </div>
            {pairs.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {pairs.map((pair) => (
                  <li key={pair.join()} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-warn-soft pr-1 pl-3 text-[15px] font-medium">
                    <span>{nameOf(pair[0])}</span>
                    <Ban size={15} {...ICON} aria-hidden className="text-warn" />
                    <span>{nameOf(pair[1])}</span>
                    <button type="button" className="press grid size-9 place-items-center rounded-full text-ink-2" aria-label={t("remove")} onClick={() => onChange(people, pairs.filter((p) => p !== pair))}>
                      <X size={18} {...ICON} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}
    </>
  );
}

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
            className="tnum bg-transparent text-center text-[44px] leading-tight outline-none placeholder:text-ink-3/50"
            style={{ width: `${Math.max(1, shown.length) + 0.4}ch` }}
            aria-label={t("budget")}
            inputMode="numeric"
            placeholder="0"
            value={shown}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
          />
        </span>
      </label>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {QUICK_BUDGETS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === String(n)}
            className={`tnum press min-h-10 rounded-lg px-3 font-serif text-[15px] ${value === String(n) ? "bg-[var(--santa)] text-[var(--paper-light)]" : "bg-field text-[#2c2825]"}`}
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
