/** A price as the shop's own page states it. Only the server ever writes one. */
export interface ShopPrice {
  amount: number;
  currency: string;
}

const SYMBOLS: Record<string, string> = { "฿": "THB", $: "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₩": "KRW" };

/** "1,150.00" or "฿1,150" to 1150, with the currency when a symbol says it. */
function readAmount(text: unknown, currency?: unknown): ShopPrice | null {
  const raw = String(text ?? "").trim();
  const symbol = Object.keys(SYMBOLS).find((s) => raw.includes(s));
  // The first number only, so a range like "฿100 - ฿200" reads as its lowest price.
  const amount = Number(raw.match(/\d[\d,]*(\.\d+)?/)?.[0].replace(/,/g, "") ?? NaN);
  const code = typeof currency === "string" && /^[A-Z]{3}$/.test(currency) ? currency : symbol ? SYMBOLS[symbol] : null;
  return code && Number.isFinite(amount) && amount > 0 && amount < 10_000_000 ? { amount, currency: code } : null;
}

function* things(node: unknown): Generator<Record<string, unknown>> {
  if (Array.isArray(node)) for (const n of node) yield* things(n);
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    yield o;
    if (o["@graph"]) yield* things(o["@graph"]);
  }
}

function fromJsonLd(html: string): ShopPrice | null {
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    for (const thing of things(data)) {
      const type = thing["@type"];
      if (!(type === "Product" || (Array.isArray(type) && type.includes("Product")))) continue;
      for (const offer of things(thing.offers)) {
        const found = readAmount(offer.price ?? offer.lowPrice, offer.priceCurrency);
        if (found) return found;
      }
    }
  }
  return null;
}

function meta(html: string, name: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = tag.match(/\b(?:property|name|itemprop)=["']([^"']+)["']/i)?.[1];
    if (key === name) return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1];
  }
}

function fromMeta(html: string): ShopPrice | null {
  for (const p of ["product:price", "og:price"]) {
    const found = readAmount(meta(html, `${p}:amount`), meta(html, `${p}:currency`));
    if (found) return found;
  }
  return readAmount(meta(html, "price"), meta(html, "priceCurrency"));
}

/** Lazada leaves its product data out of the standard places but prints the shown price, symbol and all. */
function fromLazada(html: string): ShopPrice | null {
  const shown = html.match(/pdt_price\\?"\s*:\s*\\?"([^"\\]+)/)?.[1];
  return shown ? readAmount(shown) : null;
}

/** The price a product page states, from its structured data first. */
export function priceFromHtml(html: string): ShopPrice | null {
  return fromJsonLd(html) ?? fromMeta(html) ?? fromLazada(html);
}

/** "฿1,150" for whole amounts and "฿1,150.50" otherwise, in any currency. */
export function formatPrice({ amount, currency }: ShopPrice): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  if (currency === "THB") return `฿${amount.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  try {
    return amount.toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits });
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}
