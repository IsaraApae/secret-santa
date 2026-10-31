// End-to-end check of the API against a running server: node scripts/smoke.mjs [baseUrl]
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3000";
const post = async (path, body) => {
  const res = await fetch(base + path, { method: "POST", body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
};
const get = async (path) => (await fetch(base + path)).json();

const names = ["Ann", "Beam", "Chai", "Dao", "Em", "Fah"];
const people = names.map((name, i) => ({ id: `t${i}`, name }));

// Create, with Ann and Beam kept apart
let r = await post("/api/g", { name: "Smoke party", budget: 500, date: "2026-12-24", note: "", people, pairs: [["t0", "t1"]] });
assert.equal(r.status, 200, JSON.stringify(r.data));
const { id, key } = r.data;
const g = `/api/g/${id}`;

// Bad input is refused
assert.equal((await post("/api/g", { name: "x", budget: null, date: null, note: "", people: people.slice(0, 2), pairs: [] })).status, 400);
assert.equal((await post("/api/g", { name: "x", budget: null, date: null, note: "", people: [...people, { id: "z", name: "ANN" }], pairs: [] })).data.error, "duplicate_name");
const impossible = [["t0", "t1"], ["t0", "t2"], ["t0", "t3"], ["t0", "t4"], ["t0", "t5"]];
assert.equal((await post("/api/g", { name: "x", budget: null, date: null, note: "", people, pairs: impossible })).data.error, "impossible");

// Nothing public or organiser-facing can contain who drew whom
const pub = await get(g);
assert.equal(pub.members.length, 6);
const ids = Object.fromEntries(pub.members.map((m) => [m.name, m.id]));
const leaks = (o) => /"(s:|person|withPerson|sealed|target)/.test(JSON.stringify(o));
assert.ok(!leaks(pub));
assert.equal((await post(`${g}/admin`, { key: "wrong-key", action: { type: "status" } })).status, 403);
const admin = await post(`${g}/admin`, { key, action: { type: "status" } });
assert.equal(admin.status, 200);
assert.ok(!leaks(admin.data));
assert.deepEqual(Object.keys(admin.data.members[0]).sort(), ["claimed", "giftReady", "hasWishes", "id", "name", "opened", "resets"]);

// The organiser key is not a member login
assert.equal((await post(`${g}/me`, { memberId: ids.Ann, token: key, action: { type: "load" } })).status, 401);

// Everyone claims, and the draw is valid
const sessions = {};
const claimAll = async () => {
  const views = {};
  for (const n of Object.keys(ids)) {
    const c = await post(`${g}/claim`, { memberId: ids[n], pin: "1234" });
    assert.equal(c.status, 200);
    sessions[n] = { memberId: ids[n], token: c.data.token };
    views[n] = (await post(`${g}/me`, { ...sessions[n], action: { type: "load" } })).data;
  }
  return views;
};
let views = await claimAll();
const check = (v) => {
  const got = Object.entries(v).map(([n, x]) => [n, x.person.name]);
  assert.equal(new Set(got.map(([, p]) => p)).size, got.length, "everyone receives once");
  for (const [n, p] of got) assert.notEqual(n, p);
};
check(views);
assert.notEqual(views.Ann.person.name, "Beam");
assert.notEqual(views.Beam.person.name, "Ann");

// PINs: wrong PIN refused, tokens don't work for another person, malformed refused
assert.equal((await post(`${g}/claim`, { memberId: ids.Ann, pin: "9999" })).data.error, "wrong_pin");
assert.equal((await post(`${g}/claim`, { memberId: ids.Ann, pin: "abcd" })).status, 400);
assert.equal((await post(`${g}/me`, { memberId: ids.Beam, token: sessions.Ann.token, action: { type: "load" } })).status, 401);

// Opened tracker
await post(`${g}/me`, { ...sessions.Ann, action: { type: "open" } });
const status = (await post(`${g}/admin`, { key, action: { type: "status" } })).data;
assert.equal(status.members.find((m) => m.name === "Ann").opened, true);
assert.equal(status.members.find((m) => m.name === "Beam").opened, false);

// Wish lists reach only the Santa; dangerous links are refused
const wish = { id: "w1", title: "Pink mug", url: "https://shopee.co.th/Pink-Mug-i.1.2", price: 199, note: "" };
const santaOf = (name) => Object.keys(views).find((n) => views[n].person.name === name);
await post(`${g}/me`, { ...sessions.Chai, action: { type: "wishes", wishes: [wish] } });
const santa = santaOf("Chai");
assert.equal((await post(`${g}/me`, { ...sessions[santa], action: { type: "load" } })).data.person.wishes[0].title, "Pink mug");
const notSanta = names.find((n) => n !== santa && n !== "Chai");
assert.notEqual((await post(`${g}/me`, { ...sessions[notSanta], action: { type: "load" } })).data.person.name, "Chai");
assert.equal((await post(`${g}/me`, { ...sessions.Chai, action: { type: "wishes", wishes: [{ ...wish, url: "javascript:alert(1)" }] } })).status, 400);

// Anonymous chat: Santa asks, the person replies, and the reply never names the Santa
await post(`${g}/me`, { ...sessions[santa], action: { type: "ask", text: "Which colour?" } });
const inbox = (await post(`${g}/me`, { ...sessions.Chai, action: { type: "reply", text: "Pink" } })).data;
assert.deepEqual(inbox.withSanta.map((m) => [m.from, m.text]), [["santa", "Which colour?"], ["person", "Pink"]]);
assert.ok(!JSON.stringify(inbox.withSanta).includes(santa));
const back = (await post(`${g}/me`, { ...sessions[santa], action: { type: "load" } })).data;
assert.equal(back.withPerson.at(-1).text, "Pink");

// Answers reach the Santa, and "gift ready" reaches the organiser without saying who it's for
const about = { likes: "coffee, cats", sizes: "M", avoid: "nuts" };
await post(`${g}/me`, { ...sessions.Chai, action: { type: "about", about } });
assert.deepEqual((await post(`${g}/me`, { ...sessions[santa], action: { type: "load" } })).data.person.about, about);
const readied = (await post(`${g}/me`, { ...sessions[santa], action: { type: "giftReady", ready: true } })).data;
assert.equal(readied.giftReady, true);
const withGift = await post(`${g}/admin`, { key, action: { type: "status" } });
assert.equal(withGift.data.members.find((m) => m.name === santa).giftReady, true);
assert.ok(!leaks(withGift.data));

// Renaming keeps the draw
const before = (await post(`${g}/me`, { ...sessions.Em, action: { type: "load" } })).data.person.name;
const round = names.map((n) => ({ id: ids[n], name: n === "Fah" ? "Fah S." : n }));
const adminPairs = status.pairs;
assert.equal((await post(`${g}/admin`, { key, action: { type: "people", people: round, pairs: adminPairs } })).status, 200);
const after = (await post(`${g}/me`, { ...sessions.Em, action: { type: "load" } })).data.person.name;
assert.equal(after === "Fah S." ? "Fah" : after, before);
assert.equal((await post(`${g}/me`, { ...sessions.Ann, action: { type: "load" } })).data.redrawn, false);

// Adding and removing someone redraws, keeps wishes and PINs, clears messages and opened
const changed = [...round.filter((p) => p.name !== "Dao"), { id: "new-1", name: "Gift" }];
const redraw = await post(`${g}/admin`, { key, action: { type: "people", people: changed, pairs: adminPairs } });
assert.equal(redraw.status, 200);
assert.equal(redraw.data.members.length, 6);
assert.ok(redraw.data.members.every((m) => !m.opened));
assert.equal((await post(`${g}/me`, { ...sessions.Dao, action: { type: "load" } })).status, 401);
const annAfter = (await post(`${g}/me`, { ...sessions.Ann, action: { type: "load" } })).data;
assert.equal(annAfter.redrawn, true);
const chaiAfter = (await post(`${g}/me`, { ...sessions.Chai, action: { type: "load" } })).data;
assert.equal(chaiAfter.me.wishes.length, 1);
assert.equal(chaiAfter.withSanta.length, 0);

// PIN reset cancels the old device token and is publicly visible
const reset = await post(`${g}/admin`, { key, action: { type: "resetPin", memberId: ids.Em } });
assert.equal(reset.status, 200);
assert.equal((await post(`${g}/me`, { ...sessions.Em, action: { type: "load" } })).status, 401);
const pubAfter = await get(g);
assert.equal(pubAfter.members.find((m) => m.name === "Em").resets, 1);
assert.equal(pubAfter.members.find((m) => m.name === "Em").claimed, false);

// A new round avoids every previous match and never exposes them
const beforeRound = {};
for (const n of ["Ann", "Beam", "Chai", "Fah"]) beforeRound[n] = (await post(`${g}/me`, { ...sessions[n], action: { type: "load" } })).data.person.name;
const fresh = await post(`${g}/admin`, { key, action: { type: "newRound" } });
assert.equal(fresh.status, 200);
assert.ok(!leaks(fresh.data));
assert.ok(fresh.data.members.every((m) => !m.opened && !m.giftReady));
for (const n of Object.keys(beforeRound)) assert.notEqual((await post(`${g}/me`, { ...sessions[n], action: { type: "load" } })).data.person.name, beforeRound[n]);

// Repeated wrong PINs lock that name for a while
let last;
for (let i = 0; i < 10; i++) last = await post(`${g}/claim`, { memberId: ids.Chai, pin: "0000" });
assert.equal(last.data.error, "too_many");

// Only the organiser can delete, and deleting removes the group
const doomed = await post("/api/g", { name: "Delete me", budget: null, date: null, note: "", people, pairs: [] });
const dg = `/api/g/${doomed.data.id}`;
assert.equal((await post(`${dg}/admin`, { key: "wrong", action: { type: "delete" } })).status, 403);
assert.equal((await post(`${dg}/admin`, { key: doomed.data.key, action: { type: "delete" } })).status, 200);
assert.equal((await get(dg)).error, "not_found");

// Leave nothing behind
assert.equal((await post(`${g}/admin`, { key, action: { type: "delete" } })).status, 200);

console.log("All smoke checks passed.");
