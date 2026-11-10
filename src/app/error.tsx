"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/**
 * When a page can't be put together, as when the database doesn't answer: the site's own card with a
 * way to try again, in place of the framework's bare black page.
 */
export default function PageError({ retry }: { error: unknown; retry: () => void }) {
  const t = useT();
  return (
    <div className="card mt-8 space-y-3 p-8 text-center" role="alert">
      {/* The page's own title never arrived, and the tab would show the bare address. */}
      <title>{`${t("pageError")} · Secret Santa`}</title>
      <h1 className="font-script text-[42px] leading-tight text-santa">{t("pageError")}</h1>
      <p className="text-ink-2">{t("pageErrorSub")}</p>
      <div className="flex flex-wrap justify-center gap-2.5 pt-1">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          {t("tryAgain")}
        </button>
        <Link href="/" className="btn-secondary">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
