"use client";

import { Check, Copy, QrCode, Share } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { ICON, Section } from "./ui";

export function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("", text);
      }
    },
  };
}

export function ShareCard({ url, groupName }: { url: string; groupName: string }) {
  const t = useT();
  const { copied, copy } = useCopy();
  const [qr, setQr] = useState("");
  const [canShare, setCanShare] = useState(false);
  const text = t("shareText", { name: groupName });

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  async function toggleQr() {
    setQr(qr ? "" : await QRCode.toDataURL(url, { width: 560, margin: 1 }));
  }

  return (
    <Section title={t("shareLink")}>
      <div className="card space-y-3 p-4">
        <p className="px-1 text-[15px] leading-snug text-ink-2">{t("shareBlurb")}</p>
        <p className="tag truncate px-4 py-3 text-[15px]">{url}</p>
        <div className="grid grid-cols-2 gap-2">
          {canShare && (
            <button type="button" className="btn-secondary h-12" onClick={() => navigator.share({ title: groupName, text, url }).catch(() => {})}>
              <Share size={20} {...ICON} aria-hidden /> {t("share")}
            </button>
          )}
          <button type="button" className="btn-primary h-12 whitespace-nowrap !px-4" onClick={() => copy(url)}>
            {copied ? <Check size={20} {...ICON} aria-hidden /> : <Copy size={20} {...ICON} aria-hidden />}
            {copied ? t("copied") : t("copyLink")}
          </button>
          <button type="button" className="btn-green h-12 whitespace-nowrap" aria-expanded={Boolean(qr)} onClick={toggleQr}>
            <QrCode size={20} {...ICON} aria-hidden /> {t("showQr")}
          </button>
        </div>
        {qr && (
          <figure className="space-y-2 pt-1 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={t("qrAlt")} width={280} height={280} className="mx-auto rounded-lg bg-white p-3" />
            <figcaption className="text-[13px] text-ink-2">{t("scanToJoin")}</figcaption>
          </figure>
        )}
      </div>
    </Section>
  );
}
