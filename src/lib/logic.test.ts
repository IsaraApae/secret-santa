import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicAddress, mayFetch } from "./address.ts";
import { drawNames } from "./draw.ts";
import { hashPin, memberToken, seal, unseal } from "./seal.ts";
import { formatPrice, priceFromHtml } from "./price.ts";
import { parseShopPaste, safeUrl, shopOf, siteOf } from "./shop.ts";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

test("everyone gives once and receives once, never to themselves", () => {
  for (const n of [3, 4, 5, 12, 50]) {
    for (let run = 0; run < 200; run++) {
      const d = drawNames(ids(n))!;
      assert.equal(new Set(Object.values(d)).size, n);
      assert.equal(Object.keys(d).length, n);
      for (const [g, r] of Object.entries(d)) assert.notEqual(g, r);
    }
  }
});

test("exclusions are respected in both directions", () => {
  for (let run = 0; run < 500; run++) {
    const d = drawNames(ids(6), [["p0", "p1"], ["p2", "p3"]])!;
    assert.notEqual(d.p0, "p1");
    assert.notEqual(d.p1, "p0");
    assert.notEqual(d.p2, "p3");
    assert.notEqual(d.p3, "p2");
  }
});

test("one-way bars rule out last round's matches", () => {
  for (let run = 0; run < 300; run++) {
    const last = drawNames(ids(5))!;
    const next = drawNames(ids(5), [], Object.entries(last) as [string, string][])!;
    for (const g of Object.keys(last)) assert.notEqual(next[g], last[g]);
  }
});

test("draw has no favourites", () => {
  const counts: Record<string, number> = {};
  const runs = 9000;
  for (let i = 0; i < runs; i++) {
    const r = drawNames(ids(4))!.p0;
    counts[r] = (counts[r] ?? 0) + 1;
  }
  for (const r of ["p1", "p2", "p3"]) assert.ok(Math.abs(counts[r] - runs / 3) < runs * 0.04, `${r}: ${counts[r]}`);
});

test("impossible exclusions return null, tight possible ones still draw", () => {
  // p0 is excluded with everyone.
  assert.equal(drawNames(ids(4), [["p0", "p1"], ["p0", "p2"], ["p0", "p3"]]), null);
  // Three people excluded in a triangle plus nobody else to draw.
  assert.equal(drawNames(ids(3), [["p0", "p1"]]), null);
  // Two sides that may only draw across: 40 people, each barred from their whole own side.
  const a = ids(40).slice(0, 20);
  const b = ids(40).slice(20);
  const own = (s: string[]) => s.flatMap((x, i) => s.slice(i + 1).map((y) => [x, y] as [string, string]));
  const d = drawNames(ids(40), [...own(a), ...own(b)])!;
  for (const g of a) assert.ok(b.includes(d[g]));
  for (const g of b) assert.ok(a.includes(d[g]));
  assert.equal(new Set(Object.values(d)).size, 40);
});

test("a sealed name only opens for the same group and person, and hides the name", () => {
  const s = seal("secret", "g1", "giver", "receiver");
  assert.ok(!s.includes("receiver"));
  assert.equal(unseal("secret", "g1", "giver", s), "receiver");
  assert.throws(() => unseal("secret", "g1", "someone-else", s));
  assert.throws(() => unseal("secret", "g2", "giver", s));
  assert.throws(() => unseal("wrong", "g1", "giver", s));
});

test("PINs hash per salt, and a new salt cancels old device tokens", () => {
  assert.notEqual(hashPin("1234", "a"), hashPin("1234", "b"));
  assert.notEqual(memberToken("s", "g", "m", "a"), memberToken("s", "g", "m", "b"));
});

test("shop links", () => {
  assert.equal(shopOf("https://shopee.co.th/x"), "shopee");
  assert.equal(shopOf("https://s.shopee.co.th/abc"), "shopee");
  assert.equal(shopOf("https://shp.ee/abc"), "shopee");
  assert.equal(shopOf("https://www.lazada.co.th/products/a.html"), "lazada");
  assert.equal(shopOf("https://s.lazada.co.th/abc"), "lazada");
  assert.equal(shopOf("https://vt.tiktok.com/abc"), "tiktok");
  assert.equal(shopOf("https://shop.tiktok.com/view/product/1"), "tiktok");
  assert.equal(shopOf("https://notshopee.co.th/x"), null);
  assert.equal(shopOf("https://shopee.co.th.evil.example/x"), null);
  assert.equal(shopOf("https://example.com/x"), null);

  assert.equal(parseShopPaste("https://shopee.co.th/Pink-Mug-Large-i.123.456?sp=1")?.title, "Pink Mug Large");
  assert.equal(parseShopPaste("https://www.lazada.co.th/products/pink-mug-i123-s456.html")?.title, "pink mug");
  assert.equal(parseShopPaste("https://shopee.co.th/%E0%B9%81%E0%B8%81%E0%B9%89%E0%B8%A7-i.1.2")?.title, "แก้ว");
  assert.equal(parseShopPaste("https://shopee.co.th/product/123/456")?.title, "");
  const shared = parseShopPaste("ดูแก้วน้ำใบนี้สิ ราคา ฿199 ที่ Shopee! https://s.shopee.co.th/abc");
  assert.equal(shared?.url, "https://s.shopee.co.th/abc");
  assert.equal(shared?.title, "ดูแก้วน้ำใบนี้สิ ราคา ฿199 ที่ Shopee!");
  assert.equal(shared?.shop, "shopee");

  for (const [url, shop] of [
    ["https://item.taobao.com/item.htm?id=1", "taobao"],
    ["https://m.tb.cn/h.abc", "taobao"],
    ["https://detail.tmall.com/item.htm?id=1", "tmall"],
    ["https://item.jd.com/1.html", "jd"],
    ["https://th.aliexpress.com/item/1.html", "aliexpress"],
    ["https://a.aliexpress.com/_abc", "aliexpress"],
    ["https://www.temu.com/th/x-g-601.html", "temu"],
    ["https://th.shein.com/x-p-1.html", "shein"],
    ["https://www.amazon.co.jp/dp/B01", "amazon"],
    ["https://www.amazon.com/dp/B01", "amazon"],
    ["https://amzn.to/abc", "amazon"],
    ["https://www.ebay.com/itm/1", "ebay"],
    ["https://www.etsy.com/listing/1/x", "etsy"],
  ] as const) assert.equal(shopOf(url), shop, url);
  assert.equal(shopOf("https://taobao.com.evil.example/x"), null);
  assert.equal(shopOf("https://nottaobao.com/x"), null);
  assert.equal(shopOf("https://amazon.co.th.evil.example/x"), null);
  assert.equal(parseShopPaste("https://www.temu.com/th/pink-mug-g-601.html")?.title, "pink mug");
  assert.equal(parseShopPaste("https://www.amazon.com/dp/B01")?.title, "");
  const tb = parseShopPaste("【淘宝】https://m.tb.cn/h.abc?tk=xY1「粉色杯子」点击链接");
  assert.equal(tb?.url, "https://m.tb.cn/h.abc?tk=xY1");
  assert.equal(tb?.shop, "taobao");
  assert.equal(tb?.title, "【淘宝】 「粉色杯子」点击链接");

  assert.equal(parseShopPaste("no link here"), null);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(parseShopPaste("javascript:alert(1)"), null);
});

test("every link shows the site it really goes to", () => {
  assert.equal(siteOf("https://www.shopee.co.th/Pink-Mug-i.1.2"), "shopee.co.th");
  assert.equal(siteOf("https://shopee.co.th.evil.example/x"), "shopee.co.th.evil.example");
  assert.equal(siteOf("https://my-gift-shop.com/item?id=1"), "my-gift-shop.com");
  // A look-alike name in another script shows as punycode, not as the name it imitates.
  assert.match(siteOf("https://shоpee.co.th/x") ?? "", /^xn--.*\.co\.th$/);
  assert.equal(siteOf("not a link"), null);
});

test("prices come from the shop's own page", () => {
  const ld = (data: unknown) => `<html><script type="application/ld+json">${JSON.stringify(data)}</script></html>`;
  assert.deepEqual(priceFromHtml(ld({ "@type": "Product", offers: { "@type": "Offer", price: "1,150.00", priceCurrency: "THB" } })), { amount: 1150, currency: "THB" });
  assert.deepEqual(priceFromHtml(ld({ "@graph": [{ "@type": "WebPage" }, { "@type": ["Product"], offers: [{ lowPrice: 89, priceCurrency: "USD" }] }] })), { amount: 89, currency: "USD" });
  assert.deepEqual(
    priceFromHtml('<meta content="450" property="product:price:amount"><meta property="product:price:currency" content="THB">'),
    { amount: 450, currency: "THB" },
  );
  // Lazada's escaped page data, and a range reads as its lowest price
  assert.deepEqual(priceFromHtml('{\\"pdt_price\\":\\"฿1,150.00\\",\\"x\\":1}'), { amount: 1150, currency: "THB" });
  assert.deepEqual(priceFromHtml('"pdt_price":"฿100 - ฿200"'), { amount: 100, currency: "THB" });
  // No currency, no number, or nothing at all: no price rather than a guess
  assert.equal(priceFromHtml(ld({ "@type": "Product", offers: { price: "450" } })), null);
  assert.equal(priceFromHtml(ld({ "@type": "Product", offers: { price: "free", priceCurrency: "THB" } })), null);
  assert.equal(priceFromHtml("<html><title>Shopee</title></html>"), null);
});

test("prices read the way the shop shows them", () => {
  assert.equal(formatPrice({ amount: 1150, currency: "THB" }), "฿1,150");
  assert.equal(formatPrice({ amount: 1150.5, currency: "THB" }), "฿1,150.50");
  assert.equal(formatPrice({ amount: 89, currency: "USD" }), "$89");
});

test("prices in every standard place a shop puts them", () => {
  const ld = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  // A product nested inside the page's own data, and a price inside a price specification
  assert.deepEqual(priceFromHtml(ld({ "@type": "WebPage", mainEntity: { "@type": "Product", offers: { priceSpecification: { price: 990, priceCurrency: "THB" } } } })), { amount: 990, currency: "THB" });
  // Microdata on a visible element, with the amount in its text
  assert.deepEqual(priceFromHtml('<span itemprop="priceCurrency" content="THB"></span><span itemprop="price">1,290.00</span>'), { amount: 1290, currency: "THB" });
  // The price line in a link preview, in Thai, with the currency written out
  assert.deepEqual(priceFromHtml('<meta name="twitter:label1" content="ราคา"><meta name="twitter:data1" content="2,500 บาท">'), { amount: 2500, currency: "THB" });
  assert.deepEqual(priceFromHtml('<meta name="twitter:label1" content="Price"><meta name="twitter:data1" content="SGD 49.90">'), { amount: 49.9, currency: "SGD" });
  // Expensive things are real too
  assert.deepEqual(priceFromHtml(ld({ "@type": "Product", offers: { price: "18000000", priceCurrency: "THB" } })), { amount: 18_000_000, currency: "THB" });
  // Empty tags, as a page that fills them in with JavaScript leaves them, give no price
  assert.equal(priceFromHtml('<meta itemprop="price" content=""><meta itemprop="priceCurrency" content="">'), null);
});

test("price checks never reach this machine, the private network or the metadata service", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "255.255.255.255", "::1", "::", "fd00::1", "fe80::1"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  // The IPv6 forms that carry an IPv4 address inside, the way URL writes them.
  for (const link of ["http://[::ffff:127.0.0.1]/", "http://[::ffff:169.254.169.254]/", "http://[::127.0.0.1]/", "http://[64:ff9b::a9fe:a9fe]/", "http://[2002:7f00:1::]/", "http://0x7f.1/", "http://2130706433/"]) {
    const url = new URL(link);
    assert.equal(mayFetch(url), false, `${link} (${url.hostname})`);
  }
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) assert.equal(isPublicAddress(ip), true, ip);
  assert.equal(isPublicAddress("not-an-ip"), false);
  // Names are checked at connection time; only scheme and port can be judged here.
  assert.equal(mayFetch(new URL("https://www.ikea.com/th/en/p/x")), true);
  assert.equal(mayFetch(new URL("https://shop.example:8443/")), false);
  assert.equal(mayFetch(new URL("ftp://shop.example/")), false);
});
