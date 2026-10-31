"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <div className="card mt-8 space-y-3 p-8 text-center">
      <h1 className="font-script text-[40px] leading-tight text-santa">{t("notFound")}</h1>
      <p className="text-ink-2">{t("notFoundSub")}</p>
      <Link href="/" className="btn-primary">
        {t("backHome")}
      </Link>
    </div>
  );
}
