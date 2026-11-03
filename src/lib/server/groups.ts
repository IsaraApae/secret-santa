import "server-only";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import type * as z from "zod/mini";
import { drawNames } from "../draw";
import type { AboutMe, Details, People, WishItem } from "../schema";
import type { ShopPrice } from "../price";
import { hashPin, memberToken, safeEqual, seal, sha256, unseal } from "../seal";
import { safeUrl } from "../shop";
import { fetchPrice } from "./fetchPrice";
import { kv, sealSecret } from "./kv";

/*
 * One Redis hash per group:
 *   meta      details, organiser key hash, exclusions, round
 *   dev       hash of the organiser's phone: the key only works from there
 *   m:<id>    the person's name
 *   s:<id>    who they drew, sealed. Only ever opened for that person.
 *   p:<id>    their PIN record
 *   o:<id>    the round in which they last opened their gift
 *   w:<id>    their wish list
 *   a:<id>    their answers: what they like, sizes, what to avoid
 *   q:<id>    who they guess their Santa is, and in which round
 *   r:<id>    how many times the organiser has reset their PIN
 *   sp:<id>   prices read from the links in their wish list, by link. Only the server writes these.
 * One list per person for the anonymous chat with whoever drew them. It's kept
 * under the receiver, so nothing stored ever says who the Santa is.
 */

const TTL = 60 * 60 * 24 * 180; // 180 days, refreshed on every write
const groupKey = (id: string) => `ss:g:${id}`;
const threadKey = (id: string, receiver: string) => `ss:t:${id}:${receiver}`;
const newId = (bytes = 6) => randomBytes(bytes).toString("base64url");

type DetailFields = z.infer<typeof Details>;
type PeopleFields = z.infer<typeof People>;
interface Meta extends DetailFields {
  adminHash: string;
  pairs: [string, string][];
  round: number;
  /** False while people are still joining. Absent on groups made before joining by link. */
  drawn?: boolean;
  /** The round whose guesses have been revealed. */
  guessesRound?: number;
}
export interface Msg {
  from: "santa" | "person";
  text: string;
  at: number;
}

interface Loaded {
  id: string;
  meta: Meta;
  raw: Record<string, string>;
  ids: string[];
}

export const isValidGroupId = (id: string) => /^[\w-]{12}$/.test(id);

async function load(id: string): Promise<Loaded | null> {
  if (!isValidGroupId(id)) return null;
  const raw = await kv().hgetall(groupKey(id));
  if (!raw.meta) return null;
  const ids = Object.keys(raw)
    .filter((f) => f.startsWith("m:"))
    .map((f) => f.slice(2));
  return { id, meta: JSON.parse(raw.meta), raw, ids };
}

async function touch(id: string) {
  await kv().expire(groupKey(id), TTL);
}

/** One look at a link's page: the price it stated, if any, and when. */
interface PriceCheck extends Partial<ShopPrice> {
  at: number;
}
const pricesOf = (g: { raw: Record<string, string> }, memberId: string): Record<string, PriceCheck> => JSON.parse(g.raw[`sp:${memberId}`] ?? "{}");
const savedWishes = (g: { raw: Record<string, string> }, memberId: string): WishItem[] => JSON.parse(g.raw[`w:${memberId}`] ?? "[]");

// A typed price from lists saved before they were removed never leaves the server; the only
// price shown is the one read from the shop's page.
function wishesOf(g: Loaded, memberId: string) {
  const prices = pricesOf(g, memberId);
  return savedWishes(g, memberId).map(({ id, title, url, note }) => {
    const p = url ? prices[url] : undefined;
    return { id, title, url, note, shopPrice: p?.amount && p.currency ? { amount: p.amount, currency: p.currency } : null };
  });
}

const PRICE_AGE = 6 * 60 * 60 * 1000; // read again after six hours

// One read per link per minute on this server, shared by everyone whose list has it.
const recentReads = new Map<string, Promise<ShopPrice | null>>();
function readOnce(link: string) {
  let read = recentReads.get(link);
  if (!read) {
    read = fetchPrice(link);
    recentReads.set(link, read);
    setTimeout(() => recentReads.delete(link), 60_000);
  }
  return read;
}

/**
 * Reads the prices on these people's wish lists that are new or six hours old, after the
 * response has gone, so neither saving nor opening a page waits for a shop.
 */
function refreshPrices(g: Loaded, memberIds: string[]) {
  const due = memberIds.map((memberId) => {
    const prices = pricesOf(g, memberId);
    const links = savedWishes(g, memberId)
      .map((w) => w.url && safeUrl(w.url))
      .filter((u): u is string => !!u && Date.now() - (prices[u]?.at ?? 0) >= PRICE_AGE);
    return { memberId, links: [...new Set(links)] };
  });
  if (!due.some((d) => d.links.length)) return;
  after(async () => {
    const links = [...new Set(due.flatMap((d) => d.links))].slice(0, 30);
    const read = new Map(await Promise.all(links.map(async (u) => [u, await readOnce(u)] as const)));
    // Fresh from the store: the lists may have changed while the shops answered.
    const now = { raw: await kv().hgetall(groupKey(g.id)) };
    if (!now.raw.meta) return;
    const fields: Record<string, string> = {};
    for (const { memberId } of due) {
      const old = pricesOf(now, memberId);
      const kept: Record<string, PriceCheck> = {};
      for (const w of savedWishes(now, memberId)) {
        const u = w.url && safeUrl(w.url);
        if (!u) continue;
        const fresh = read.get(u);
        kept[u] = read.has(u) ? { ...fresh, at: Date.now() } : old[u];
      }
      fields[`sp:${memberId}`] = JSON.stringify(Object.fromEntries(Object.entries(kept).filter(([, v]) => v)));
    }
    await kv().hset(groupKey(g.id), fields);
  });
}
const aboutOf = (g: Loaded, memberId: string): AboutMe => JSON.parse(g.raw[`a:${memberId}`] ?? '{"likes":"","sizes":"","avoid":""}');

function guessOf(g: Loaded, memberId: string): string | null {
  const rec: { round: number; target: string } | null = JSON.parse(g.raw[`q:${memberId}`] ?? "null");
  return rec && rec.round === g.meta.round && g.ids.includes(rec.target) ? rec.target : null;
}

const isDrawn = (g: Loaded) => g.meta.drawn !== false;
const guessesOpen = (g: Loaded) => g.meta.guessesRound === g.meta.round;

/**
 * After the reveal: who guessed right. Deliberately never says who anyone
 * guessed or who their Santa is, so it can't expose a match to the group.
 */
function guessResults(g: Loaded) {
  if (!guessesOpen(g)) return null;
  const santaOf = new Map(g.ids.map((giver) => [unseal(sealSecret(), g.id, giver, g.raw[`s:${giver}`]), giver]));
  return g.ids
    .map((id) => ({ name: g.raw[`m:${id}`], guessed: guessOf(g, id) !== null, correct: guessOf(g, id) === santaOf.get(id) }))
    .sort((a, b) => Number(b.correct) - Number(a.correct) || a.name.localeCompare(b.name));
}

function publicView(g: Loaded) {
  const { name, budget, date, note } = g.meta;
  return {
    name,
    budget,
    date,
    note,
    drawn: isDrawn(g),
    guesses: guessResults(g),
    members: g.ids
      .map((id) => ({
        id,
        name: g.raw[`m:${id}`],
        claimed: Boolean(g.raw[`p:${id}`]),
        resets: Number(g.raw[`r:${id}`] ?? 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type PublicGroup = ReturnType<typeof publicView>;

export async function getPublicGroup(id: string): Promise<PublicGroup | null> {
  const g = await load(id);
  return g && publicView(g);
}

/** Checks a list of people, giving anyone new a real id. */
function planNames(input: PeopleFields, known: string[]) {
  const seen = new Set<string>();
  for (const p of input.people) {
    const n = p.name.toLocaleLowerCase();
    if (seen.has(n)) return { error: "duplicate_name" as const, name: p.name };
    seen.add(n);
  }
  const issued = new Map(input.people.map((p) => [p.id, known.includes(p.id) ? p.id : newId()]));
  const pairs = input.pairs
    .filter(([a, b]) => a !== b && issued.has(a) && issued.has(b))
    .map(([a, b]) => [issued.get(a)!, issued.get(b)!] as [string, string]);
  const names: Record<string, string> = {};
  for (const p of input.people) names[`m:${issued.get(p.id)}`] = p.name;
  return { names, pairs, ids: [...issued.values()] };
}

/**
 * The one place names get drawn. The sealed fields go into a single HSET with
 * the rest, so a failed draw changes nothing and a half-written draw can't exist.
 */
function sealedDraw(id: string, ids: string[], pairs: [string, string][], avoid: [string, string][] = []) {
  // Avoiding repeats is a preference: small groups may have no other draw left.
  const draw = drawNames(ids, pairs, avoid) ?? drawNames(ids, pairs);
  if (!draw) return null;
  return Object.fromEntries(Object.entries(draw).map(([g, r]) => [`s:${g}`, seal(sealSecret(), id, g, r)]));
}

/** A group starts empty: people add themselves with the link, then the organiser draws. */
export async function createGroup(input: DetailFields, device: string) {
  const id = newId(9);
  const key = newId(18);
  const meta: Meta = {
    name: input.name,
    budget: input.budget,
    date: input.date,
    note: input.note,
    adminHash: sha256(key),
    pairs: [],
    round: 1,
    drawn: false,
  };
  await kv().hset(groupKey(id), { meta: JSON.stringify(meta), dev: sha256(device) });
  await touch(id);
  return { id, key };
}

// ---------- Members ------------------------------------------------------------

const MAX_PEOPLE = 50;

/** Someone adds themselves with the invite link, before the names are drawn. */
export async function join(id: string, name: string, pin: string) {
  const g = await load(id);
  if (!g) return { error: "not_found" as const };
  if (isDrawn(g)) return { error: "closed" as const };
  if (g.ids.length >= MAX_PEOPLE) return { error: "full" as const };
  if (g.ids.some((m) => g.raw[`m:${m}`].toLocaleLowerCase() === name.toLocaleLowerCase())) return { error: "duplicate_name" as const, name };
  const memberId = newId();
  const salt = newId(12);
  await kv().hset(groupKey(id), { [`m:${memberId}`]: name, [`p:${memberId}`]: JSON.stringify({ salt, hash: hashPin(pin, salt) }) });
  await touch(id);
  return { memberId, token: memberToken(sealSecret(), id, memberId, salt) };
}

/** First time sets the PIN, after that it checks it. Returns a device token. */
export async function claim(id: string, memberId: string, pin: string) {
  const g = await load(id);
  if (!g || !g.ids.includes(memberId)) return { error: "not_found" as const };
  const attempts = await kv().hit(`ss:pinfail:${id}:${memberId}`, 3600);
  if (attempts > 8) return { error: "too_many" as const };
  const salt = newId(12);
  const fresh = JSON.stringify({ salt, hash: hashPin(pin, salt) });
  const first = await kv().hsetnx(groupKey(id), `p:${memberId}`, fresh);
  const rec: { salt: string; hash: string } = first
    ? JSON.parse(fresh)
    : JSON.parse(g.raw[`p:${memberId}`] ?? (await kv().hgetall(groupKey(id)))[`p:${memberId}`]);
  if (!first && !safeEqual(hashPin(pin, rec.salt), rec.hash)) return { error: "wrong_pin" as const };
  await kv().del([`ss:pinfail:${id}:${memberId}`]);
  await touch(id);
  return { token: memberToken(sealSecret(), id, memberId, rec.salt), first };
}

async function authed(id: string, memberId: string, token: string) {
  const g = await load(id);
  const rec = g?.raw[`p:${memberId}`];
  if (!g || !g.ids.includes(memberId) || !rec) return null;
  const expected = memberToken(sealSecret(), id, memberId, JSON.parse(rec).salt);
  return safeEqual(expected, token) ? g : null;
}

const readThread = async (id: string, receiver: string): Promise<Msg[]> =>
  (await kv().lrange(threadKey(id, receiver))).map((m) => JSON.parse(m));

async function memberView(g: Loaded, memberId: string) {
  const receiver = isDrawn(g) ? unseal(sealSecret(), g.id, memberId, g.raw[`s:${memberId}`]) : null;
  const [withPerson, withSanta] = await Promise.all([receiver ? readThread(g.id, receiver) : [], readThread(g.id, memberId)]);
  // The group page too, from the same read, so a signed-in page needs one request to stay current.
  const group = publicView(g);
  return {
    group,
    me: { id: memberId, name: g.raw[`m:${memberId}`], wishes: wishesOf(g, memberId), about: aboutOf(g, memberId) },
    myGuess: guessOf(g, memberId),
    guesses: group.guesses,
    // They'd opened an earlier draw, so the name they remember is out of date.
    redrawn: Boolean(g.raw[`o:${memberId}`]) && Number(g.raw[`o:${memberId}`]) !== g.meta.round,
    joined: g.ids.length,
    // Null until the organiser draws.
    person: receiver && { name: g.raw[`m:${receiver}`], wishes: wishesOf(g, receiver), about: aboutOf(g, receiver) },
    withPerson,
    withSanta,
  };
}

export type MemberView = Awaited<ReturnType<typeof memberView>>;

const MAX_THREAD = 200;

async function post(g: Loaded, receiver: string, from: Msg["from"], text: string) {
  const key = threadKey(g.id, receiver);
  const count = (await kv().lrange(key)).length;
  if (count >= MAX_THREAD) return false;
  await kv().rpush(key, JSON.stringify({ from, text, at: Date.now() } satisfies Msg));
  await kv().expire(key, TTL);
  return true;
}

export type MeAction =
  | { type: "load" }
  | { type: "open" }
  | { type: "wishes"; wishes: WishItem[] }
  | { type: "about"; about: AboutMe }
  | { type: "guess"; target: string | null }
  | { type: "ask"; text: string }
  | { type: "reply"; text: string };

export async function memberAction(id: string, memberId: string, token: string, action: MeAction) {
  const g = await authed(id, memberId, token);
  if (!g) return null;
  const field = (name: string, value: string) => {
    g.raw[name] = value;
    return kv().hset(groupKey(id), { [name]: value });
  };
  // Nothing below depends on a draw except these, which wait for one.
  if (!isDrawn(g) && (action.type === "open" || action.type === "guess" || action.type === "ask" || action.type === "reply")) {
    return memberView(g, memberId);
  }
  if (action.type === "open") await field(`o:${memberId}`, String(g.meta.round));
  if (action.type === "wishes") await field(`w:${memberId}`, JSON.stringify(action.wishes));
  if (action.type === "about") await field(`a:${memberId}`, JSON.stringify(action.about));
  // Closed once revealed, and no feedback before that, so guessing can't be used to find the Santa.
  if (action.type === "guess" && !guessesOpen(g)) {
    const valid = action.target === null || (action.target !== memberId && g.ids.includes(action.target));
    if (valid) await field(`q:${memberId}`, action.target ? JSON.stringify({ round: g.meta.round, target: action.target }) : "null");
  }
  if (action.type === "ask") await post(g, unseal(sealSecret(), id, memberId, g.raw[`s:${memberId}`]), "santa", action.text);
  if (action.type === "reply") await post(g, memberId, "person", action.text);
  if (action.type !== "load") await touch(id);
  const view = await memberView(g, memberId);
  // Their own list, and the list of the person they drew: the two this page shows.
  refreshPrices(g, [memberId, ...(isDrawn(g) ? [unseal(sealSecret(), id, memberId, g.raw[`s:${memberId}`])] : [])]);
  return view;
}

// ---------- Organiser ------------------------------------------------------------

/**
 * The organiser key works only from the phone that made the group, so a key copied out of an old
 * organiser link is no use anywhere else. Groups made before that belong to the first phone that
 * manages them since.
 */
async function asAdmin(id: string, key: string, device: string) {
  const g = await load(id);
  if (!g || !safeEqual(sha256(key), g.meta.adminHash)) return null;
  if (!g.raw.dev && (await kv().hsetnx(groupKey(id), "dev", sha256(device)))) return g;
  const dev = g.raw.dev ?? (await kv().hgetall(groupKey(id))).dev;
  return dev && safeEqual(sha256(device), dev) ? g : null;
}

/** What the organiser sees. Never contains a sealed field or who drew whom. */
function adminView(g: Loaded) {
  const pub = publicView(g);
  return {
    ...pub,
    pairs: g.meta.pairs,
    guessedCount: g.ids.filter((m) => guessOf(g, m) !== null).length,
    members: pub.members.map((m) => ({
      ...m,
      opened: Number(g.raw[`o:${m.id}`] ?? 0) === g.meta.round,
      hasWishes: wishesOf(g, m.id).length > 0 || Object.values(aboutOf(g, m.id)).some(Boolean),
    })),
  };
}

export type AdminView = ReturnType<typeof adminView>;

export type AdminAction =
  | { type: "status" }
  | ({ type: "details" } & DetailFields)
  | ({ type: "people" } & PeopleFields)
  | { type: "resetPin"; memberId: string }
  | { type: "draw" }
  | { type: "newRound" }
  | { type: "revealGuesses" }
  | { type: "delete" };

export async function adminAction(id: string, key: string, device: string, action: AdminAction) {
  const g = await asAdmin(id, key, device);
  if (!g) return { error: "forbidden" as const };
  const reload = async () => {
    await touch(id);
    return { view: adminView((await load(id))!) };
  };
  const store = kv();

  if (action.type === "status") return { view: adminView(g) };

  if (action.type === "details") {
    const { name, budget, date, note } = action;
    await store.hset(groupKey(id), { meta: JSON.stringify({ ...g.meta, name, budget, date, note }) });
    return reload();
  }

  if (action.type === "resetPin") {
    if (!g.ids.includes(action.memberId)) return { error: "not_found" as const };
    await store.hdel(groupKey(id), [`p:${action.memberId}`]);
    // Public on the group page, so a reset can't quietly be used to peek at someone's name.
    await store.hset(groupKey(id), { [`r:${action.memberId}`]: String(Number(g.raw[`r:${action.memberId}`] ?? 0) + 1) });
    return reload();
  }

  if (action.type === "revealGuesses") {
    if (!isDrawn(g)) return { error: "not_drawn" as const };
    await store.hset(groupKey(id), { meta: JSON.stringify({ ...g.meta, guessesRound: g.meta.round }) });
    return reload();
  }

  if (action.type === "delete") {
    await store.del([groupKey(id), ...g.ids.map((m) => threadKey(id, m))]);
    return { view: null };
  }

  if (action.type === "draw") {
    if (isDrawn(g)) return { view: adminView(g) };
    if (g.ids.length < 3) return { error: "need_three" as const };
    const sealed = sealedDraw(id, g.ids, g.meta.pairs);
    if (!sealed) return { error: "impossible" as const };
    await store.hset(groupKey(id), { ...sealed, meta: JSON.stringify({ ...g.meta, drawn: true }) });
    return reload();
  }

  if (action.type === "newRound" && !isDrawn(g)) return { error: "not_drawn" as const };

  const people =
    action.type === "newRound"
      ? { people: g.ids.map((m) => ({ id: m, name: g.raw[`m:${m}`] })), pairs: g.meta.pairs }
      : action;
  const plan = planNames(people, g.ids);
  if (plan.error) return plan;
  const removedFields = g.ids
    .filter((m) => !plan.ids.includes(m))
    .flatMap((m) => ["m", "s", "p", "o", "w", "r", "a", "g", "q"].map((f) => `${f}:${m}`));

  if (!isDrawn(g)) {
    // Still joining: nothing to redraw.
    await store.hset(groupKey(id), { ...plan.names, meta: JSON.stringify({ ...g.meta, pairs: plan.pairs }) });
    await store.hdel(groupKey(id), removedFields);
    return reload();
  }

  const samePeople = plan.ids.length === g.ids.length && plan.ids.every((m) => g.ids.includes(m));
  const pairKey = (p: [string, string][]) => p.map((x) => [...x].sort().join(">")).sort().join();
  if (action.type !== "newRound" && samePeople && pairKey(plan.pairs) === pairKey(g.meta.pairs)) {
    // Only names changed, so the draw stays as it is.
    await store.hset(groupKey(id), plan.names);
    return reload();
  }

  if (plan.ids.length < 3) return { error: "need_three" as const };
  // Opened only inside the server, to rule out last round's matches. Never returned.
  const lastRound = action.type === "newRound" ? g.ids.map((m): [string, string] => [m, unseal(sealSecret(), id, m, g.raw[`s:${m}`])]) : [];
  const sealed = sealedDraw(id, plan.ids, plan.pairs, lastRound);
  if (!sealed) return { error: "impossible" as const };
  await store.hset(groupKey(id), {
    ...plan.names,
    ...sealed,
    meta: JSON.stringify({ ...g.meta, pairs: plan.pairs, round: g.meta.round + 1 }),
  });
  await store.hdel(groupKey(id), removedFields);
  // New Santas shouldn't read the old Santas' conversations.
  await store.del([...new Set([...g.ids, ...plan.ids])].map((m) => threadKey(id, m)));
  return reload();
}
