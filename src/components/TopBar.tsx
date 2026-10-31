"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { Sparkle } from "./Festive";

/** A plain signature at the top of the page. The home page's hero is its own. */
export function TopBar() {
  const t = useT();
  if (usePathname() === "/") return null;
  return (
    <header className="flex justify-center pt-[max(14px,env(safe-area-inset-top))]">
      <Link href="/" aria-label={t("home")} className="press inline-flex min-h-11 items-center gap-1.5 font-script text-[26px] text-cream">
        <Sparkle size={14} />
        Secret Santa
        <Sparkle size={14} />
      </Link>
    </header>
  );
}
