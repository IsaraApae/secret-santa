export type Shop = "shopee" | "lazada" | "tiktok" | "taobao" | "tmall" | "jd" | "aliexpress" | "temu" | "shein" | "amazon" | "ebay" | "etsy";

export const SHOP_LABEL: Record<Shop, string> = {
  shopee: "Shopee",
  lazada: "Lazada",
  tiktok: "TikTok Shop",
  taobao: "Taobao",
  tmall: "Tmall",
  jd: "JD",
  aliexpress: "AliExpress",
  temu: "Temu",
  shein: "SHEIN",
  amazon: "Amazon",
  ebay: "eBay",
  etsy: "Etsy",
};

// Country endings only (.co.th, .com.my, .sg): `shopee.co.th.evil.example` must not match.
const COUNTRY = String.raw`(com|(co|com)\.[a-z]{2}|[a-z]{2})`;
const HOSTS: [RegExp, Shop][] = [
  [new RegExp(String.raw`(^|\.)(shopee\.${COUNTRY}|shp\.ee|shope\.ee)$`), "shopee"],
  [new RegExp(String.raw`(^|\.)(lazada\.${COUNTRY}|lzd\.co)$`), "lazada"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(taobao\.com|tb\.cn)$/, "taobao"],
  [/(^|\.)tmall\.(com|hk)$/, "tmall"],
  [/(^|\.)(jd\.com|3\.cn)$/, "jd"],
  [new RegExp(String.raw`(^|\.)aliexpress\.(us|${COUNTRY})$`), "aliexpress"],
  [new RegExp(String.raw`(^|\.)temu\.${COUNTRY}$`), "temu"],
  [new RegExp(String.raw`(^|\.)(shein\.${COUNTRY}|shein\.top)$`), "shein"],
  [new RegExp(String.raw`(^|\.)(amazon\.${COUNTRY}|amzn\.(to|asia|eu)|a\.co)$`), "amazon"],
  [new RegExp(String.raw`(^|\.)(ebay\.${COUNTRY}|ebay\.to)$`), "ebay"],
  [/(^|\.)(etsy\.com|etsy\.me)$/, "etsy"],
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
      .replace(/-i\.?\d+[.-]s?\d+.*$/, "")
      .replace(/-[gp]-\d+$/, "");
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
  // Stops at Chinese text and punctuation, which Taobao's share text runs straight into its link.
  const raw = text.match(/https?:\/\/[^\s<>"'\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]+/)?.[0];
  const url = raw && safeUrl(raw);
  if (!url) return null;
  const sentence = text.replace(raw, " ").replace(/\s+/g, " ").trim();
  return { url, title: sentence || nameFromPath(url), shop: shopOf(url) };
}
