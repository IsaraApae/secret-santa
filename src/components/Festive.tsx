"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useT } from "@/lib/i18n";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Slow snow, or a one-off burst of confetti. Rendered after mount as the positions are random. */
export function Fall({ kind }: { kind: "snow" | "confetti" }) {
  const [pieces, setPieces] = useState<CSSProperties[]>([]);
  useEffect(() => {
    const colours = ["var(--santa)", "var(--accent)", "var(--ribbon)"];
    setPieces(
      Array.from({ length: kind === "snow" ? 26 : 70 }, (_, i) => {
        const size = kind === "snow" ? rand(4, 9) : rand(7, 12);
        return {
          left: `${rand(0, 100)}%`,
          width: size,
          height: kind === "snow" ? size : size * 0.5,
          borderRadius: kind === "snow" ? "50%" : 2,
          background: kind === "snow" ? "white" : colours[i % 3],
          opacity: kind === "snow" ? rand(0.45, 0.9) : 1,
          boxShadow: kind === "snow" ? "0 0 4px rgb(90 90 110 / 0.35)" : undefined,
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

/** The wrapped present. Original artwork made only of CSS shapes. */
export function GiftBox({ state = "idle" }: { state?: "idle" | "shake" | "open" }) {
  return (
    <div className={`gift mx-auto ${state === "idle" ? "gift-idle" : state === "shake" ? "gift-shake" : "gift-open"}`} aria-hidden>
      <div className="gift-box" />
      <div className="gift-lid">
        <span className="gift-bow" />
      </div>
    </div>
  );
}

/** Days, hours, minutes and seconds to the party, in the Alert Watch tile style. */
export function Countdown({ date }: { date: string }) {
  const t = useT();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  if (now === null) return <div className="h-[76px]" />;
  const target = new Date(`${date}T00:00:00`).getTime();
  const left = target - now;
  // Over the whole of the party day, then gone once it has passed.
  if (left <= -86_400_000) return null;
  if (left <= 0) return <p className="py-2 text-center text-[20px] font-semibold">{t("today")}</p>;
  const s = Math.floor(left / 1000);
  const tiles: [number, string][] = [
    [Math.floor(s / 86400), t("days")],
    [Math.floor(s / 3600) % 24, t("hours")],
    [Math.floor(s / 60) % 60, t("minutes")],
    [s % 60, t("seconds")],
  ];
  return (
    <div className="grid grid-cols-4 gap-2" role="timer">
      {tiles.map(([n, label]) => (
        <div key={label} className="text-center">
          <div className="tnum text-[32px] leading-tight font-bold tracking-tight">{n}</div>
          <div className="text-[13px] text-ink-2">{label}</div>
        </div>
      ))}
    </div>
  );
}
