"use client";

import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { myGroups, type SavedGroup } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import { Fall, GiftBox } from "./Festive";
import { ICON, Section } from "./ui";

export function Home() {
  const t = useT();
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  useEffect(() => setGroups(myGroups()), []);
  return (
    <>
      <Fall kind="snow" />
      <section className="space-y-6 pt-8 pb-2 text-center">
        <GiftBox />
        <div className="space-y-3">
          <h1 className="large-title text-balance">{t("heroTitle")}</h1>
          <p className="mx-auto max-w-[46ch] text-balance text-ink-2">{t("heroSub")}</p>
        </div>
        <Link href="/new" className="btn-primary h-13 px-8">
          {t("start")}
        </Link>
      </section>

      {groups.length > 0 && (
        <Section title={t("yourGroups")}>
          <ul className="card rows overflow-hidden">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-2 py-1 pr-3 pl-5">
                <Link href={`/g/${g.id}`} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 font-medium">
                  <span className="truncate">{g.name}</span>
                  <ChevronRight size={18} {...ICON} aria-hidden className="shrink-0 text-ink-3" />
                </Link>
                {g.key && (
                  <Link href={`/o/${g.id}`} className="chip min-h-9">
                    {t("manage")}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t("howTitle")}>
        <ol className="card rows overflow-hidden">
          {(["how1", "how2", "how3", "how4"] as const).map((key, i) => (
            <li key={key} className="flex items-start gap-3 px-5 py-3.5">
              <span className="tnum grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent-strong">{i + 1}</span>
              <span className="leading-snug">{t(key)}</span>
            </li>
          ))}
        </ol>
      </Section>

      <p className="flex items-center justify-center gap-2 px-4 text-center text-[13px] text-ink-2">
        <ShieldCheck size={16} {...ICON} aria-hidden className="shrink-0 text-accent" />
        {t("privateTitle")}
      </p>
    </>
  );
}
