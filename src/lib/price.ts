/** A price as the shop's own page states it. Only the server ever writes one. */
export interface ShopPrice {
  amount: number;
  currency: string;
}

const SYMBOLS: Record<string, string> = { "฿": "THB", "บาท": "THB", $: "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₩": "KRW" };

/** "1,150.00", "฿1,150" or "THB 1,150" to 1150, with the currency from its own field, a symbol or a code. */
function readAmount(text: unknown, currency?: unknown): ShopPrice | null {
  const raw = String(text ?? "").trim();
  const symbol = Object.keys(SYMBOLS).find((s) => raw.includes(s));
  const written = raw.match(/\b([A-Z]{3})\b/)?.[1];
  // The first number only, so a range like "฿100 - ฿200" reads as its lowest price.
  const amount = Number(raw.match(/\d[\d,]*(\.\d+)?/)?.[0].replace(/,/g, "") ?? NaN);
  const given = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  const code = /^[A-Z]{3}$/.test(given) ? given : symbol ? SYMBOLS[symbol] : written ?? null;
  return code && Number.isFinite(amount) && amount > 0 && amount < 1_000_000_000 ? { amount, currency: code } : null;
}

/** Every object in a JSON tree, however deeply a page nests its product. */
function* things(node: unknown, depth = 0): Generator<Record<string, unknown>> {
  if (depth > 12) return;
  if (Array.isArray(node)) for (const n of node) yield* things(n, depth + 1);
  else if (node && typeof node === "object") {
    yield node as Record<string, unknown>;
    for (const v of Object.values(node)) yield* things(v, depth + 1);
  }
}

const isProduct = (type: unknown): boolean => (Array.isArray(type) ? type.some(isProduct) : typeof type === "string" && /Product\b/.test(type));

/** schema.org Product data, the most common way a shop states its price. */
function fromJsonLd(html: string): ShopPrice | null {
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    for (const thing of things(data)) {
      if (!isProduct(thing["@type"])) continue;
      for (const offer of things(thing.offers)) {
        const spec = (offer.priceSpecification ?? {}) as Record<string, unknown>;
        const found = readAmount(offer.price ?? offer.lowPrice ?? spec.price, offer.priceCurrency ?? spec.priceCurrency);
        if (found) return found;
      }
    }
  }
  return null;
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];

/** A <meta> value by its property, name or itemprop. */
function meta(html: string, name: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if ((attr(tag, "property") ?? attr(tag, "name") ?? attr(tag, "itemprop")) === name) return attr(tag, "content");
  }
}

/** A microdata itemprop on any element: its content attribute, or else its text. */
function itemprop(html: string, name: string): string | undefined {
  for (const m of html.matchAll(new RegExp(`<(\\w+)\\b[^>]*\\bitemprop=["']${name}["'][^>]*>([^<]{0,60})`, "gi"))) {
    const value = attr(m[0], "content") ?? m[2].trim();
    if (value) return value;
  }
}

/** Open Graph and Facebook product tags, microdata, and the price line some shops put in their link previews. */
function fromTags(html: string): ShopPrice | null {
  for (const p of ["product:price", "og:price"]) {
    const found = readAmount(meta(html, `${p}:amount`), meta(html, `${p}:currency`));
    if (found) return found;
  }
  const micro = readAmount(itemprop(html, "price") ?? itemprop(html, "lowPrice"), itemprop(html, "priceCurrency"));
  if (micro) return micro;
  for (const n of [1, 2]) {
    if (/price|ราคา/i.test(meta(html, `twitter:label${n}`) ?? "")) {
      const found = readAmount(meta(html, `twitter:data${n}`));
      if (found) return found;
    }
  }
  return null;
}

/** Lazada leaves its product data out of the standard places but prints the shown price, symbol and all. */
function fromLazada(html: string): ShopPrice | null {
  const shown = html.match(/pdt_price\\?"\s*:\s*\\?"([^"\\]+)/)?.[1];
  return shown ? readAmount(shown) : null;
}

/** The price a product page states, from its structured data first. */
export function priceFromHtml(html: string): ShopPrice | null {
  return fromJsonLd(html) ?? fromTags(html) ?? fromLazada(html);
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
