"use client";

import { CalendarDays, Check, Minus, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { baht, formatDate } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import type { PublicGroup } from "@/lib/server/groups";
import { Section } from "./ui";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Slow snow, or a one-off burst of confetti. Rendered after mount as the positions are random. */
export function Fall({ kind }: { kind: "snow" | "confetti" }) {
  const [pieces, setPieces] = useState<CSSProperties[]>([]);
  useEffect(() => {
    const colours = ["#bf3330", "#1f8a3a", "var(--gold)", "var(--paper-light)"];
    setPieces(
      Array.from({ length: kind === "snow" ? 22 : 70 }, (_, i) => {
        const size = kind === "snow" ? rand(3, 7) : rand(7, 12);
        return {
          left: `${rand(0, 100)}%`,
          width: size,
          height: kind === "snow" ? size : size * 0.5,
          borderRadius: kind === "snow" ? "50%" : 2,
          background: kind === "snow" ? "#faf9f6" : colours[i % 4],
          opacity: kind === "snow" ? rand(0.35, 0.8) : 1,
          animationDuration: `${kind === "snow" ? rand(9, 18) : rand(1.8, 3.4)}s`,
          animationDelay: `${kind === "snow" ? -rand(0, 18) : rand(0, 0.5)}s`,
          animationIterationCount: kind === "snow" ? "infinite" : 1,
          "--drift": `${rand(-60, 60)}px`,
          "--spin": `${kind === "snow" ? 0 : rand(180, 900)}deg`,
        } as CSSProperties;
      }),
    );
  }, [kind]);
  return (
    <div className="fall" aria-hidden>
      {pieces.map((style, i) => (
        <span key={i} style={style} />
      ))}
    </div>
  );
}

/** The four-point star used wherever the page sparkles. */
export function Sparkle({ size = 20, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className={className} style={style} fill="var(--gold)">
      <path d="M12 0c1 7.300 3.700 10 12 12-8.300 2-11 4.700-12 12-1-7.300-3.700-10-12-12 8.300-2 11-4.700 12-12z" />
    </svg>
  );
}

/** A wrapped present cut out like a sticker, with a white die-cut edge. Original artwork. */
export function GiftBox({ state = "idle", size = 176, className = "" }: { state?: "idle" | "shake" | "open" | "still"; size?: number; className?: string }) {
  const motion = { idle: "gift-idle", shake: "gift-shake", open: "gift-open", still: "" }[state];
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden className={`gift mx-auto ${motion} ${className}`}>
      <g className="gift-body">
        <rect x="26" y="84" width="148" height="104" rx="10" fill="#faf9f6" stroke="#faf9f6" strokeWidth="12" />
        <rect x="26" y="84" width="148" height="104" rx="8" fill="#ab2828" />
        <g fill="#8a1f1f">
          {[[48, 108], [76, 134], [48, 160], [136, 108], [160, 134], [136, 160], [160, 172], [76, 176]].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y - 7}c.6 4.200 2.400 6 7 7-4.600 1-6.400 2.800-7 7-.6-4.200-2.400-6-7-7 4.600-1 6.400-2.800 7-7z`} />
          ))}
        </g>
        <rect x="87" y="84" width="26" height="104" fill="#e2c75c" />
        <rect x="26" y="84" width="148" height="10" fill="#6d1718" opacity=".35" />
      </g>
      <g className="gift-lid">
        <rect x="14" y="56" width="172" height="36" rx="8" fill="#faf9f6" stroke="#faf9f6" strokeWidth="12" />
        <rect x="14" y="56" width="172" height="36" rx="7" fill="#bf3330" />
        <rect x="87" y="56" width="26" height="36" fill="#e2c75c" />
        <path d="M100 56C84 18 40 12 46 36c3 13 30 20 54 20zm0 0c16-38 60-44 54-20-3 13-30 20-54 20z" fill="#e2c75c" stroke="#faf9f6" strokeWidth="7" paintOrder="stroke" strokeLinejoin="round" />
        <path d="M100 56C88 34 62 26 62 36c0 7 20 17 38 20zm0 0c12-22 38-30 38-20 0 7-20 17-38 20z" fill="#a98a2e" />
        <rect x="89" y="46" width="22" height="16" rx="5" fill="#c9ab45" />
      </g>
    </svg>
  );
}

/**
 * Room around the drawn name, from the letters in it, so the gaps to the lines above and below look even.
 * The script leaves a deep empty band under its letters, used only by letters that hang into it; Thai
 * stacks marks above its letters: two high when a tone mark sits on an upper vowel, and higher too
 * on the tall letters ป ฝ ฟ ฬ.
 */
function nameRoom(name: string) {
  const hangs = /[fgjpqyGJQYZฺุูฎฏญฐ]/.test(name);
  const above = /[ัิีึื][่้๊๋]|[่้๊๋]ำ/.test(name) ? "pt-[0.32em]" : /[ปฝฟฬ][ุู]?[่้๊๋]/.test(name) ? "pt-[0.2em]" : /[ัิีึื็่้๊๋์ำ]/.test(name) ? "pt-[0.12em]" : "";
  return `${hangs ? "mb-[14px]" : "-mb-3"} ${above}`;
}

/** The result: a paper gift tag hanging from its string. */
export function GiftTag({ lead, name, foot }: { lead: string; name: string; foot: string }) {
  return (
    <div className="reveal-name relative mx-auto max-w-[420px]">
      <svg viewBox="0 0 40 44" width="40" height="44" aria-hidden className="absolute -top-9 left-1/2 -translate-x-1/2" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
        <path d="M20 2c-7 10 7 18 0 40" />
      </svg>
      <div className="card px-6 pt-12 pb-8 text-center">
        <span className="absolute top-3.5 left-1/2 size-5 -translate-x-1/2 rounded-full bg-[#2c2825] ring-[3px] ring-[var(--ribbon)]" aria-hidden />
        <p className="font-serif text-[17px] text-ink-2">{lead}</p>
        <p className={`mt-1 font-script text-[84px] leading-[1.1] break-words text-santa ${nameRoom(name)}`}>{name}</p>
        <p className="font-serif text-[15px] text-ink-2">{foot}</p>
      </div>
    </div>
  );
}

/** Budget on a small ticket, and the party date. */
export function GroupFacts({ budget, date }: { budget: number | null; date: string | null }) {
  const t = useT();
  if (budget === null && !date) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-serif text-[16px]">
      {budget !== null && <span className="ticket px-5 py-2">{t("budgetLine", { amount: baht(budget) })}</span>}
      {date && (
        <span className="tag inline-flex items-center gap-1.5 px-3 py-2 text-[#2c2825]">
          <CalendarDays size={17} strokeWidth={2} aria-hidden className="text-[var(--santa)]" />
          {formatDate(date)}
        </span>
      )}
    </div>
  );
}

/** Days, hours, minutes and seconds to the party, on tear-off calendar pages. */
export function Countdown({ date }: { date: string }) {
  const t = useT();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  if (now === null) return <div className="h-[92px]" />;
  const target = new Date(`${date}T00:00:00`).getTime();
  const left = target - now;
  // Over the whole of the party day, then gone once it has passed.
  if (left <= -86_400_000) return null;
  if (left <= 0) return <p className="py-2 text-center font-script text-[50px] text-gold">{t("today")}</p>;
  const s = Math.floor(left / 1000);
  const tiles: [number, string][] = [
    [Math.floor(s / 86400), t("days")],
    [Math.floor(s / 3600) % 24, t("hours")],
    [Math.floor(s / 60) % 60, t("minutes")],
    [s % 60, t("seconds")],
  ];
  return (
    <div className="grid grid-cols-4 gap-2.5" role="timer">
      {tiles.map(([n, label]) => (
        <div key={label} className="overflow-hidden rounded-lg text-center shadow-[0_8px_16px_rgb(0_0_0/0.4)]">
          <div className="bg-[var(--santa)] py-1 font-calendar text-[14px] text-[var(--paper-light)]">{label}</div>
          <div className="tnum bg-[var(--paper-light)] py-1.5 font-calendar text-[32px] leading-tight text-[#2c2825]">{n}</div>
        </div>
      ))}
    </div>
  );
}

/** Who guessed their Santa. Only ever right, wrong or no guess: never who they named. */
export function GuessResults({ results }: { results: NonNullable<PublicGroup["guesses"]> }) {
  const t = useT();
  const right = results.filter((r) => r.correct).length;
  return (
    <Section title={t("resultsTitle")} sticker="star">
      <ul className="card rows taped relative">
        <li className="px-5 pt-4 pb-3">
          <span className="block font-serif text-[17px]">{t("resultsCount", { n: right, total: results.length })}</span>
          <span className="block text-[14px] leading-snug text-ink-2">{t("resultsHint")}</span>
        </li>
        {results.map((r) => (
          <li key={r.name} className="flex items-center gap-3 px-5 py-2.5">
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full ${r.correct ? "bg-accent text-accent-ink" : r.guessed ? "bg-field text-ink" : "text-ink-3"}`}
              aria-hidden
            >
              {r.correct ? <Check size={18} strokeWidth={2.5} /> : r.guessed ? <X size={17} strokeWidth={2} /> : <Minus size={17} strokeWidth={2} />}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
            <span className={`shrink-0 text-[14px] ${r.correct ? "font-semibold text-accent-strong" : "text-ink-2"}`}>
              {r.correct ? t("resultRight") : r.guessed ? t("resultWrong") : t("resultNone")}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
