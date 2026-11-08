// End-to-end check of the API against a running server: node scripts/smoke.mjs [baseUrl]
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://localhost:3000";
// The organiser's phone: creating and managing a group send it, and the key only works from it.
const device = "smoke-phone-0123456789";
const post = async (path, body) => {
  if (path === "/api/g" || path.endsWith("/admin")) body = { device, ...body };
  const res = await fetch(base + path, { method: "POST", body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
};
const get = async (path) => (await fetch(base + path)).json();

const names = ["Ann", "Beam", "Chai", "Dao", "Em", "Fah"];
const details = { budget: 500, date: "2026-12-24", note: "" };

// Create an empty group; bad input is refused
assert.equal((await post("/api/g", { ...details })).status, 400);
let r = await post("/api/g", { name: "Smoke party", ...details });
assert.equal(r.status, 200, JSON.stringify(r.data));
const { id, key } = r.data;
const g = `/api/g/${id}`;
assert.equal((await get(g)).drawn, false);
assert.equal((await get(g)).members.length, 0);

// Too few people can't be drawn
assert.equal((await post(`${g}/admin`, { key, action: { type: "draw" } })).data.error, "need_three");

// People join themselves with the link
const sessions = {};
for (const n of names) {
  const j = await post(`${g}/join`, { name: n, pin: "1234" });
  assert.equal(j.status, 200, JSON.stringify(j.data));
  sessions[n] = j.data;
}
assert.equal((await post(`${g}/join`, { name: "ANN", pin: "1234" })).data.error, "duplicate_name");
assert.equal((await post(`${g}/join`, { name: "Bad", pin: "12" })).status, 400);

// Before the draw: a member's page works but has no person, and game actions wait
const early = await post(`${g}/me`, { ...sessions.Ann, action: { type: "load" } });
assert.equal(early.status, 200);
assert.equal(early.data.person, null);
// It brings the public group page with it, so a signed-in page polls once, not twice
assert.deepEqual(early.data.group, await get(g));
assert.equal((await post(`${g}/me`, { ...sessions.Ann, action: { type: "ask", text: "hi" } })).status, 200);
assert.equal((await post(`${g}/admin`, { key, action: { type: "revealGuesses" } })).data.error, "not_drawn");
assert.equal((await post(`${g}/admin`, { key, action: { type: "newRound" } })).data.error, "not_drawn");
const early2 = await post(`${g}/me`, { ...sessions.Chai, action: { type: "wishes", wishes: [] } });
assert.equal(early2.status, 200);

// Exclusions set before the draw, and only the organiser can draw
const joined = await get(g);
const idOf = (n) => joined.members.find((m) => m.name === n).id;
const everyone = joined.members.map(({ id, name }) => ({ id, name }));
const setPairs = (pairs) => post(`${g}/admin`, { key, action: { type: "people", people: everyone, pairs } });
const allAgainstAnn = names.slice(1).map((n) => [idOf("Ann"), idOf(n)]);
assert.equal((await setPairs(allAgainstAnn)).status, 200);
assert.equal((await post(`${g}/admin`, { key, action: { type: "draw" } })).data.error, "impossible");
assert.equal((await get(g)).drawn, false);
assert.equal((await setPairs([[idOf("Ann"), idOf("Beam")]])).status, 200);
assert.equal((await post(`${g}/admin`, { key: "wrong-key", action: { type: "draw" } })).status, 403);
assert.equal((await post(`${g}/admin`, { key, action: { type: "draw" } })).status, 200);
assert.equal((await get(g)).drawn, true);
assert.equal((await post(`${g}/join`, { name: "Late", pin: "1234" })).data.error, "closed");

// Nothing public or organiser-facing can contain who drew whom
const pub = await get(g);
assert.equal(pub.members.length, 6);
const ids = Object.fromEntries(pub.members.map((m) => [m.name, m.id]));
const leaks = (o) => /"(s:|person|withPerson|sealed|target)/.test(JSON.stringify(o));
assert.ok(!leaks(pub));
assert.equal((await post(`${g}/admin`, { key: "wrong-key", action: { type: "status" } })).status, 403);
// The right key from another phone, as from an old organiser link, is refused too
assert.equal((await post(`${g}/admin`, { device: "another-phone-0123456", key, action: { type: "status" } })).status, 403);
const admin = await post(`${g}/admin`, { key, action: { type: "status" } });
assert.equal(admin.status, 200);
assert.ok(!leaks(admin.data));
assert.deepEqual(Object.keys(admin.data.members[0]).sort(), ["claimed", "hasWishes", "id", "name", "opened"]);

// The organiser key is not a member login
assert.equal((await post(`${g}/me`, { memberId: ids.Ann, token: key, action: { type: "load" } })).status, 401);

// Everyone claims, and the draw is valid
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
const seen = (await post(`${g}/me`, { ...sessions[santa], action: { type: "load" } })).data.person.wishes[0];
assert.equal(seen.title, "Pink mug");
// A typed price, as an older page still sends, is dropped: only the shop's own page can say what it costs
assert.equal(seen.price, undefined);
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

// Answers reach the Santa
const about = { likes: "coffee, cats", sizes: "M", avoid: "nuts" };
await post(`${g}/me`, { ...sessions.Chai, action: { type: "about", about } });
assert.deepEqual((await post(`${g}/me`, { ...sessions[santa], action: { type: "load" } })).data.person.about, about);

// Guessing: no answer before the reveal, nobody can guess themselves
const guess = (n, target) => post(`${g}/me`, { ...sessions[n], action: { type: "guess", target } });
const beamView = await guess("Beam", ids.Beam);
assert.equal(beamView.data.myGuess, null);
const beamSanta = santaOf("Beam");
const wrongFor = (n) => names.find((x) => x !== n && x !== santaOf(n));
const guessed = await guess("Beam", ids[beamSanta]);
assert.equal(guessed.data.myGuess, ids[beamSanta]);
assert.equal(guessed.data.guesses, null);
assert.equal((await get(g)).guesses, null);
await guess("Chai", ids[wrongFor("Chai")]);
const counted = (await post(`${g}/admin`, { key, action: { type: "status" } })).data;
assert.equal(counted.guessedCount, 2);
assert.equal(counted.guesses, null);
assert.ok(!JSON.stringify(counted).includes("myGuess"));

// Only the organiser can reveal. The table says who was right, never whom they named.
assert.equal((await post(`${g}/admin`, { key: "wrong", action: { type: "revealGuesses" } })).status, 403);
const revealed = await post(`${g}/admin`, { key, action: { type: "revealGuesses" } });
assert.equal(revealed.status, 200);
const table = (await get(g)).guesses;
assert.equal(table.find((r) => r.name === "Beam").correct, true);
assert.equal(table.find((r) => r.name === "Chai").correct, false);
assert.equal(table.find((r) => r.name === "Chai").guessed, true);
assert.equal(table.find((r) => r.name === "Ann").guessed, false);
assert.equal(table[0].name, "Beam");
assert.deepEqual(Object.keys(table[0]).sort(), ["correct", "guessed", "name"]);
assert.deepEqual((await guess("Ann", ids.Dao)).data.myGuess, null);

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
// A redraw reopens guessing and forgets old guesses
assert.equal(chaiAfter.myGuess, null);
assert.equal(chaiAfter.guesses, null);

// PIN reset cancels the old device token, and the person can choose a new PIN
const reset = await post(`${g}/admin`, { key, action: { type: "resetPin", memberId: ids.Em } });
assert.equal(reset.status, 200);
assert.equal((await post(`${g}/me`, { ...sessions.Em, action: { type: "load" } })).status, 401);
const pubAfter = await get(g);
assert.equal(pubAfter.members.find((m) => m.name === "Em").claimed, false);

// A new round avoids every previous match and never exposes them
const beforeRound = {};
for (const n of ["Ann", "Beam", "Chai", "Fah"]) beforeRound[n] = (await post(`${g}/me`, { ...sessions[n], action: { type: "load" } })).data.person.name;
const fresh = await post(`${g}/admin`, { key, action: { type: "newRound" } });
assert.equal(fresh.status, 200);
assert.ok(!leaks(fresh.data));
assert.ok(fresh.data.members.every((m) => !m.opened ));
for (const n of Object.keys(beforeRound)) assert.notEqual((await post(`${g}/me`, { ...sessions[n], action: { type: "load" } })).data.person.name, beforeRound[n]);

// Repeated wrong PINs lock that name for a while
let last;
for (let i = 0; i < 10; i++) last = await post(`${g}/claim`, { memberId: ids.Chai, pin: "0000" });
assert.equal(last.data.error, "too_many");

// Only the organiser can delete, and deleting removes the group
const doomed = await post("/api/g", { name: "Delete me", budget: null, date: null, note: "" });
const dg = `/api/g/${doomed.data.id}`;
assert.equal((await post(`${dg}/admin`, { key: "wrong", action: { type: "delete" } })).status, 403);
assert.equal((await post(`${dg}/admin`, { key: doomed.data.key, action: { type: "delete" } })).status, 200);
assert.equal((await get(dg)).error, "not_found");

// Leave nothing behind
assert.equal((await post(`${g}/admin`, { key, action: { type: "delete" } })).status, 200);

console.log("All smoke checks passed.");
