import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { priceFromHtml, type ShopPrice } from "../price";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAX_BYTES = 3_000_000;

/** Addresses a link must never reach: this machine, the private network, and the cloud's metadata service. */
function isPrivate(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivate(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || v6.startsWith("ff");
}

async function isPublic(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivate(a.address));
  } catch {
    return false;
  }
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Reads the price from a wish's link, the way a phone would see the page. Short
 * links redirect, so each hop is checked again before it's followed. Shops that
 * hide their pages from servers, like Shopee, give null.
 */
export async function fetchPrice(link: string): Promise<ShopPrice | null> {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const signal = AbortSignal.timeout(8000);
  try {
    for (let hop = 0; hop < 5; hop++) {
      if (!(await isPublic(url))) return null;
      const res = await fetch(url, { redirect: "manual", signal, headers: { "User-Agent": UA, "Accept-Language": "th,en;q=0.8", Accept: "text/html" } });
      const next = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && next) {
        url = new URL(next, url);
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
      return priceFromHtml(await readCapped(res));
    }
  } catch {
    // Timed out, refused or unreadable: no price, and the link still works.
  }
  return null;
}
