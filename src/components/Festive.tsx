"use client";

import { CalendarDays, Check, Minus, X } from "lucide-react";
import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefCallback } from "react";
import { baht, formatDate } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import type { PublicGroup } from "@/lib/server/groups";
import { langOf, Section } from "./ui";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * The first time this phone opens a room, its page lays itself out: the title writes itself in, the
 * tickets drop and the cards rise. A script in the layout starts it before the first paint on a full
 * load; this starts it on arriving from another page, and marks the room as seen.
 */
export const useRoomEntrance = () => useFirstVisit("ss:seen:", "first-room", 4000);

/** Plays a page's one-time show (a class on <html> for `ms`) the first time this phone sees it, and marks it seen. */
function useFirstVisit(prefix: string, className: string, ms: number) {
  useLayoutEffect(() => {
    const seen = `${prefix}${location.pathname}`;
    try {
      if (localStorage.getItem(seen)) return;
      localStorage.setItem(seen, "1");
    } catch {
      return;
    }
    const html = document.documentElement;
    html.classList.add(className);
    setTimeout(() => html.classList.remove(className), ms);
  }, [prefix, className, ms]);
}

/**
 * Things that arrive while the page is open (someone joins, a wish is saved, a message comes in) move in;
 * the ones already there when it opened stay still. They wait for their list to come on screen, so a
 * name that drops in below the fold isn't missed. `also` is new though it was there from the start: you,
 * just after joining. Put `ref` on the list and `arrive(id)` on each item, with the item's own motion.
 */
export function useArrivals<T extends HTMLElement>(ids: string[], motion: string, also?: string | null) {
  const [first] = useState(() => new Set(ids.filter((id) => id !== also)));
  const [list, setList] = useState<T | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    if (!list || onScreen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOnScreen(true), { threshold: 0.2 });
    io.observe(list);
    return () => io.disconnect();
  }, [list, onScreen]);
  const ref: RefCallback<T> = setList;
  return { ref, arrive: (id: string) => (first.has(id) ? "" : onScreen ? motion : "arrive-wait") };
}

/**
 * The guess results, the first time this phone sees them: each row flips over like a card, one after
 * another. On a full load the layout's script starts it before the first paint; this starts it when they
 * appear while the page is open, or on arriving from another page, and marks them as seen.
 */
const useResultsReveal = () => useFirstVisit("ss:results:", "new-results", 6000);

/** Names being drawn: everyone's tag flies into the present, it shakes, and confetti bursts out. Tap to skip. */
export function DrawShow({ names, onDone }: { names: string[]; onDone: () => void }) {
  const t = useT();
  const [stage, setStage] = useState<"in" | "shake" | "done">("in");
  const shown = names.slice(0, 12);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return onDone();
    const flown = 1400 + shown.length * 90;
    const timers = [setTimeout(() => setStage("shake"), flown), setTimeout(() => setStage("done"), flown + 650), setTimeout(onDone, flown + 2800)];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="draw-show" onClick={onDone} role="status">
      {stage === "done" && <Fall kind="confetti" />}
      <div className="relative h-[300px] w-full max-w-[360px]">
        <GiftBox state={stage === "shake" ? "shake" : "still"} size={170} className="absolute inset-0 m-auto" />
        {stage === "in" &&
          shown.map((name, i) => {
            const a = (i / shown.length) * 2 * Math.PI - Math.PI / 2;
            const style = { "--x": `${Math.cos(a) * 130}px`, "--y": `${Math.sin(a) * 130}px`, "--r": `${(i % 2 ? 1 : -1) * rand(3, 9)}deg`, animationDelay: `${i * 90}ms` };
            return (
              <span key={i} className="draw-tag" style={style as CSSProperties}>
                {name}
              </span>
            );
          })}
      </div>
      <p className="font-script text-[44px] leading-tight text-gold">{stage === "done" ? t("namesDrawn") : t("shuffling")}</p>
    </div>
  );
}

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
        <p lang={langOf(name)} className={`name-write mt-1 font-script text-[70px] leading-[1.1] break-words text-santa ${nameRoom(name)}`}>
          {name}
        </p>
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
    <div className="facts flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-label text-[16px]">
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
  if (left <= 0) return <p className="py-2 text-center font-script text-[42px] text-gold">{t("today")}</p>;
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
  useResultsReveal();
  return (
    <Section title={t("resultsTitle")} sticker="star">
      <ul className="card rows taped relative">
        <li className="px-5 pt-4 pb-3">
          <span className="block font-serif text-[17px]">{t("resultsCount", { n: right, total: results.length })}</span>
          <span className="block text-[14px] leading-snug text-ink-2">{t("resultsHint")}</span>
        </li>
        {results.map((r, i) => (
          <li key={r.name} className="result-row flex items-center gap-3 px-5 py-2.5" style={{ "--i": i } as CSSProperties}>
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full ${r.correct ? "bg-accent text-accent-ink" : r.guessed ? "bg-field text-ink" : "text-ink-3"}`}
              aria-hidden
            >
              {r.correct ? <Check size={18} strokeWidth={2.5} /> : r.guessed ? <X size={17} strokeWidth={2} /> : <Minus size={17} strokeWidth={2} />}
            </span>
            <span lang={langOf(r.name)} className="min-w-0 flex-1 truncate font-medium">
              {r.name}
            </span>
            <span className={`shrink-0 text-[14px] ${r.correct ? "font-semibold text-accent-strong" : "text-ink-2"}`}>
              {r.correct ? t("resultRight") : r.guessed ? t("resultWrong") : t("resultNone")}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
