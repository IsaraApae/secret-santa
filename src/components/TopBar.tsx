"use client";

import { Gift, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useLang, useT } from "@/lib/i18n";
import { ICON, Segmented } from "./ui";

function flipTheme() {
  const dark = document.documentElement.classList.contains("dark");
  try {
    localStorage.setItem("ss:theme", dark ? "light" : "dark");
  } catch {}
  window.dispatchEvent(new Event("ss-theme"));
}

export function TopBar() {
  const t = useT();
  const { lang, setLang } = useLang();
  return (
    <header className="sticky top-0 z-30 mx-auto flex w-full max-w-[640px] items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <Link href="/" aria-label={t("home")} className="press glass flex h-11 min-w-0 items-center gap-2 rounded-full pr-4 pl-3 font-semibold text-ink">
        <Gift size={22} {...ICON} aria-hidden className="shrink-0 text-santa" />
        <span className="truncate">Secret Santa</span>
      </Link>
      <div className="ml-auto w-[112px] shrink-0">
        <Segmented
          label={t("language")}
          value={lang}
          onChange={setLang}
          options={[
            { value: "en", label: "EN" },
            { value: "th", label: "ไทย" },
          ]}
        />
      </div>
      <button type="button" className="icon-btn" aria-label={t("appearance")} onClick={flipTheme}>
        <Sun size={22} {...ICON} aria-hidden className="hidden dark:block" />
        <Moon size={22} {...ICON} aria-hidden className="dark:hidden" />
      </button>
    </header>
  );
}
