export type Shop = "shopee" | "lazada" | "tiktok";

export const SHOP_LABEL: Record<Shop, string> = { shopee: "Shopee", lazada: "Lazada", tiktok: "TikTok Shop" };

// Country endings only (.co.th, .com.my, .sg): `shopee.co.th.evil.example` must not match.
const COUNTRY = String.raw`(com|(co|com)\.[a-z]{2}|[a-z]{2})`;
const HOSTS: [RegExp, Shop][] = [
  [new RegExp(String.raw`(^|\.)(shopee\.${COUNTRY}|shp\.ee|shope\.ee)$`), "shopee"],
  [new RegExp(String.raw`(^|\.)(lazada\.${COUNTRY}|lzd\.co)$`), "lazada"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
];

/** Only http(s) links, so a pasted `javascript:` link can never reach an href. */
export function safeUrl(text: string): string | null {
  try {
    const u = new URL(text);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

export function shopOf(url: string): Shop | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return HOSTS.find(([re]) => re.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}

/** The product name a shop puts in its long links: /Pink-Mug-i.12.34 or /products/pink-mug-i12-s34.html */
function nameFromPath(url: string): string {
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
    const name = decodeURIComponent(last)
      .replace(/\.html$/, "")
      .replace(/-i\.?\d+[.-]s?\d+.*$/, "");
    return name === last || !/\D/.test(name) ? "" : name.replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
}

/**
 * Reads what a shop app's Share button copies, which is usually a sentence with
 * a link in it, or a bare link. The shops block servers from fetching product
 * pages, so the title comes from the pasted text and the person can edit it.
 */
export function parseShopPaste(text: string): { url: string; title: string; shop: Shop | null } | null {
  const raw = text.match(/https?:\/\/[^\s<>"']+/)?.[0];
  const url = raw && safeUrl(raw);
  if (!url) return null;
  const sentence = text.replace(raw, " ").replace(/\s+/g, " ").trim();
  return { url, title: sentence || nameFromPath(url), shop: shopOf(url) };
}
