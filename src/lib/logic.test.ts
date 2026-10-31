import assert from "node:assert/strict";
import { test } from "node:test";
import { drawNames } from "./draw.ts";
import { hashPin, memberToken, seal, unseal } from "./seal.ts";
import { parseShopPaste, safeUrl, shopOf } from "./shop.ts";

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

  assert.equal(parseShopPaste("no link here"), null);
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(parseShopPaste("javascript:alert(1)"), null);
});
