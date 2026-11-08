import "server-only";
import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import type { Readable } from "node:stream";
import zlib from "node:zlib";
import { isPublicAddress, mayFetch } from "../address";
import { priceFromHtml, type ShopPrice } from "../price";

// Says what it is. A shop that keeps its prices from bots, like Shopee, gets no workaround: that wish
// just has no price.
const UA = "Mozilla/5.0 (compatible; SecretSantaPriceCheck/1.0; +https://secretsanta-draw.vercel.app)";
const MAX_BYTES = 3_000_000;

/**
 * The lookup the connection itself uses, so the address checked is the address connected to. A
 * separate lookup before fetching could be answered with a public address and then, a moment
 * later, with a private one.
 */
const publicOnly: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, options, (err, address, family) => {
    if (err) return callback(err, address, family);
    const all = Array.isArray(address) ? address.map((a) => a.address) : [address];
    if (!all.length || !all.every(isPublicAddress)) {
      return callback(Object.assign(new Error(`${hostname} is not a public address`), { code: "EBLOCKED" }), address, family);
    }
    callback(null, address, family);
  });
};

function get(url: URL, signal: AbortSignal): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(
      url,
      {
        signal,
        lookup: publicOnly,
        headers: { "User-Agent": UA, "Accept-Language": "th,en;q=0.8", Accept: "text/html", "Accept-Encoding": "gzip, deflate, br" },
      },
      resolve,
    );
    req.on("error", reject);
  });
}

function decoded(res: http.IncomingMessage): Readable {
  const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
  if (encoding === "gzip" || encoding === "x-gzip") return res.pipe(zlib.createGunzip());
  if (encoding === "br") return res.pipe(zlib.createBrotliDecompress());
  if (encoding === "deflate") return res.pipe(zlib.createInflate());
  return res;
}

async function readCapped(res: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of decoded(res)) {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= MAX_BYTES) break;
    }
  } finally {
    res.destroy();
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Reads the price from a wish's link, as the page states it to anyone. Short
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
      if (!mayFetch(url)) return null;
      const res = await get(url, signal);
      const status = res.statusCode ?? 0;
      const next = res.headers.location;
      if (status >= 300 && status < 400 && next) {
        res.resume();
        url = new URL(next, url);
        continue;
      }
      if (status < 200 || status >= 300 || !String(res.headers["content-type"] ?? "").includes("html")) {
        res.resume();
        return null;
      }
      return priceFromHtml(await readCapped(res));
    }
  } catch {
    // Timed out, refused, blocked or unreadable: no price, and the link still works.
  }
  return null;
}
