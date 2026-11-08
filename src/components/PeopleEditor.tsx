"use client";

import { Ban, Plus, X } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { DateField } from "./DateField";
import { Callout, Choice, ICON, langOf, Section } from "./ui";

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
  const cmp = (x: string, y: string) => x.localeCompare(y, ["en", "th"], { sensitivity: "base", numeric: true });
  const byName = [...people].sort((x, y) => cmp(x.name, y.name));
  // Each pair shown A to Z inside (it works both ways), then the pairs A to Z by first name, then second.
  const sortedPairs = pairs
    .map((pair) => ({ pair, names: [nameOf(pair[0]), nameOf(pair[1])].sort(cmp) }))
    .sort((x, y) => cmp(x.names[0], y.names[0]) || cmp(x.names[1], y.names[1]));

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
    // Not left chosen in a pair picker, where they could still be added to a pair.
    if (a === id) setA("");
    if (b === id) setB("");
    onChange(
      people.filter((p) => p.id !== id),
      pairs.filter((pair) => !pair.includes(id)),
    );
  }

  const apart = (x: string, y: string) => pairs.some((p) => p.includes(x) && p.includes(y));
  // Each picker grays out whoever is already kept apart from the person in the other, and anyone
  // already kept apart from everyone else, since no new pair could include them.
  const pickable = (other: string) =>
    byName.map((p) => {
      const paired = other !== "" && p.id !== other && apart(p.id, other);
      const full = byName.every((q) => q.id === p.id || apart(p.id, q.id));
      return { value: p.id, label: p.name, disabled: p.id === other || paired || full, note: paired || full ? t("keptApart") : undefined };
    });

  function addPair() {
    if (a && b && a !== b && !apart(a, b)) onChange(people, [...pairs, [a, b]]);
    setA("");
    setB("");
  }

  return (
    <>
      <Section title={t("sectionPeople")} sticker="gingerbread" action={people.length > 0 && <span className="pb-1 font-serif text-[15px] text-ink-2">{t(people.length === 1 ? "countPerson" : "countPeople", { n: people.length })}</span>}>
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
                // The tag's border turns red while its name is being edited, as a field's does.
                <li key={p.id} className="tag inline-flex min-h-11 items-center gap-1 pr-1 pl-3 text-[15px] font-medium has-[input:focus]:border-[var(--santa)] has-[input:focus]:shadow-[inset_0_0_0_1px_var(--santa)]">
                  {/* Sized by an invisible copy of the name in the same grid cell, so every letter fits: a width
                      counted in characters cut off wide letters like M, and Thai. */}
                  <span
                    data-name={`${p.name} `}
                    className="inline-grid max-w-[calc(100vw-120px)] min-w-[2ch] after:invisible after:col-start-1 after:row-start-1 after:overflow-hidden after:whitespace-pre after:content-[attr(data-name)]"
                  >
                    <input
                      className="col-start-1 row-start-1 w-full min-w-0 bg-transparent outline-none"
                      size={1}
                      maxLength={40}
                      value={p.name}
                      lang={langOf(p.name)}
                      aria-label={t("personName")}
                      onChange={(e) => onChange(people.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)), pairs)}
                    />
                  </span>
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
        <Section title={t("sectionExclusions")} sticker="warning">
          <div className="card space-y-3 p-4">
            <p className="px-1 text-[15px] leading-snug text-ink-2">{t("noExclusions")}</p>
            <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <Choice className="min-w-0 pl-3 text-[15px]" value={a} onChange={setA} label={t("personA")} placeholder={t("personA")} options={pickable(b)} />
              <Choice className="min-w-0 pl-3 text-[15px]" value={b} onChange={setB} label={t("personB")} placeholder={t("personB")} options={pickable(a)} />
              <button type="button" className="press grid size-12 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label={t("add")} disabled={!a || !b || a === b || apart(a, b)} onClick={addPair}>
                <Plus size={22} {...ICON} aria-hidden />
              </button>
            </div>
            {pairs.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {sortedPairs.map(({ pair, names }) => (
                  <li key={pair.join()} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-warn-soft pr-1 pl-3 text-[15px] font-medium">
                    <span lang={langOf(names[0])}>{names[0]}</span>
                    <Ban size={15} {...ICON} aria-hidden className="text-warn" />
                    <span lang={langOf(names[1])}>{names[1]}</span>
                    <button
                      type="button"
                      className="press grid size-9 place-items-center rounded-full text-ink-2"
                      aria-label={`${t("remove")}: ${names[0]} / ${names[1]}`}
                      onClick={() => onChange(people, pairs.filter((p) => p !== pair))}
                    >
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
