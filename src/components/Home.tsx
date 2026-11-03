"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { myGroups, type SavedGroup } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import { Fall, GiftBox, Sparkle } from "./Festive";
import { ICON, Section, Sticker } from "./ui";

export function Home() {
  const t = useT();
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  useEffect(() => setGroups(myGroups()), []);
  return (
    <>
      <Fall kind="snow" />
      {/* Wider than the page column on big screens: a poster, not a form. */}
      <section className="relative left-1/2 mt-[max(14px,env(safe-area-inset-top))] w-[calc(100vw-24px)] max-w-[1080px] -translate-x-1/2 rounded-[22px] border-[1.5px] border-gold/70 px-5 pt-7 pb-8 md:px-14 md:py-14">
        <Sparkle size={26} className="twinkle absolute top-3 right-3" />
        <Sparkle size={16} className="twinkle absolute top-3 left-4" style={{ animationDelay: "1.1s" }} />
                <div className="grid items-center gap-5 md:grid-cols-[1.15fr_0.85fr] md:gap-10">
          <div className="space-y-5 text-center md:text-left">
            <h1 className="font-script text-[clamp(100px,29vw,196px)] leading-[0.9] text-gold">
              Secret
              <br />
              Santa
            </h1>
            <p className="ticket inline-block -rotate-1 px-7 py-3 font-serif text-[clamp(18px,5vw,26px)] leading-snug text-balance">{t("heroTitle")}</p>
          </div>
          <div className="relative">
            {/* CI stickers around the present, clear of the two tags. */}
            <Sticker name="bell" size={54} className="absolute top-0 right-[8%] rotate-[14deg] md:right-[4%] md:h-[80px]!" />
            <Sticker name="tree" size={70} className="absolute bottom-1 left-[5%] -rotate-[8deg] md:left-0 md:h-[110px]!" />
            <Sticker name="ornament" size={40} className="absolute top-[42%] left-[2%] rotate-[-12deg] md:h-[60px]!" />
            <Sticker name="snowflake" size={36} className="absolute top-[38%] right-[1%] rotate-[18deg] md:h-[54px]!" />
            <GiftBox size={190} className="md:h-[320px] md:w-[320px]" />
            <span className="absolute top-2 left-[6%] rotate-[-9deg] rounded-md bg-[var(--accent)] px-3 py-1 font-serif text-[14px] text-[var(--paper-light)] shadow-[0_0_0_2.5px_var(--sticker),0_6px_12px_rgb(0_0_0/0.4)] md:left-0">
              {t("noSignUp")}
            </span>
            <span className="absolute right-[6%] bottom-3 rotate-[7deg] rounded-md bg-[var(--paper-light)] px-3 py-1 font-serif text-[14px] text-[#2c2825] shadow-[0_0_0_2.5px_var(--sticker),0_6px_12px_rgb(0_0_0/0.4)] md:right-0">
              {t("oneLink")}
            </span>
          </div>
        </div>
        <div className="card mt-6 flex flex-col items-center gap-4 px-6 py-5 text-center md:mt-10 md:flex-row md:justify-between md:text-left">
          <p className="max-w-[48ch] text-[17px] text-balance">{t("heroSub")}</p>
          <Link href="/new" className="btn-primary h-14 w-full shrink-0 text-[20px] md:w-auto">
            {t("start")}
          </Link>
        </div>
      </section>

      {groups.length > 0 && (
        <Section title={t("yourGroups")} sticker="gift">
          <ul className="card rows">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-2 py-1 pr-3 pl-5">
                <Link href={`/g/${g.id}`} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 font-serif">
                  <span className="truncate">{g.name}</span>
                  <ChevronRight size={18} {...ICON} aria-hidden className="shrink-0 text-ink-3" />
                </Link>
                {g.key && (
                  <Link href={`/o/${g.id}`} className="chip min-h-10">
                    {t("manage")}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t("howTitle")} sticker="candle">
        <ol className="space-y-3.5">
          {(["how1", "how2", "how3", "how4"] as const).map((key, i) => (
            <li key={key} className={`card flex items-start gap-3 px-5 py-4 ${i % 2 ? "rotate-[0.6deg] md:ml-8" : "-rotate-[0.6deg] md:mr-8"}`}>
              <span className="tnum grid size-8 shrink-0 place-items-center rounded-full bg-[var(--santa)] font-serif text-[16px] text-[var(--paper-light)]">{i + 1}</span>
              <span className="leading-snug">{t(key)}</span>
            </li>
          ))}
        </ol>
      </Section>

    </>
  );
}
