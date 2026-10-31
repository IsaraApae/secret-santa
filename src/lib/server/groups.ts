import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { drawNames } from "../draw";
import type { AboutMe, Details, People, WishItem } from "../schema";
import { hashPin, memberToken, safeEqual, seal, sha256, unseal } from "../seal";
import { kv, sealSecret } from "./kv";

/*
 * One Redis hash per group:
 *   meta      details, organiser key hash, exclusions, round
 *   m:<id>    the person's name
 *   s:<id>    who they drew, sealed. Only ever opened for that person.
 *   p:<id>    their PIN record
 *   o:<id>    the round in which they last opened their gift
 *   w:<id>    their wish list
 *   a:<id>    their answers: what they like, sizes, what to avoid
 *   g:<id>    the round in which they marked their gift as ready
 *   r:<id>    how many times the organiser has reset their PIN
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

const wishesOf = (g: Loaded, memberId: string): WishItem[] => JSON.parse(g.raw[`w:${memberId}`] ?? "[]");
const aboutOf = (g: Loaded, memberId: string): AboutMe => JSON.parse(g.raw[`a:${memberId}`] ?? '{"likes":"","sizes":"","avoid":""}');
const giftReady = (g: Loaded, memberId: string) => Number(g.raw[`g:${memberId}`] ?? 0) === g.meta.round;

function publicView(g: Loaded) {
  const { name, budget, date, note } = g.meta;
  return {
    name,
    budget,
    date,
    note,
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

/**
 * The one place names get drawn and written. Fields for the new draw go into a
 * single HSET so a failed draw changes nothing and a half-written draw can't exist.
 */
function planPeople(id: string, input: PeopleFields, known: string[], avoid: [string, string][] = []) {
  const seen = new Set<string>();
  for (const p of input.people) {
    const n = p.name.toLocaleLowerCase();
    if (seen.has(n)) return { error: "duplicate_name" as const, name: p.name };
    seen.add(n);
  }
  const issued = new Map(input.people.map((p) => [p.id, known.includes(p.id) ? p.id : newId()]));
  const realPairs = input.pairs
    .filter(([a, b]) => a !== b && issued.has(a) && issued.has(b))
    .map(([a, b]) => [issued.get(a)!, issued.get(b)!] as [string, string]);
  const ids = [...issued.values()];
  // Avoiding repeats is a preference: small groups may have no other draw left.
  const draw = drawNames(ids, realPairs, avoid) ?? drawNames(ids, realPairs);
  if (!draw) return { error: "impossible" as const };
  const fields: Record<string, string> = {};
  for (const p of input.people) fields[`m:${issued.get(p.id)}`] = p.name;
  for (const [g, r] of Object.entries(draw)) fields[`s:${g}`] = seal(sealSecret(), id, g, r);
  return { fields, pairs: realPairs, ids };
}

export async function createGroup(input: DetailFields & PeopleFields) {
  const id = newId(9);
  const plan = planPeople(id, input, []);
  if (plan.error) return plan;
  const key = newId(18);
  const meta: Meta = {
    name: input.name,
    budget: input.budget,
    date: input.date,
    note: input.note,
    adminHash: sha256(key),
    pairs: plan.pairs,
    round: 1,
  };
  await kv().hset(groupKey(id), { meta: JSON.stringify(meta), ...plan.fields });
  await touch(id);
  return { id, key };
}

// ---------- Members ------------------------------------------------------------

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
  const receiver = unseal(sealSecret(), g.id, memberId, g.raw[`s:${memberId}`]);
  const [withPerson, withSanta] = await Promise.all([readThread(g.id, receiver), readThread(g.id, memberId)]);
  return {
    me: { id: memberId, name: g.raw[`m:${memberId}`], wishes: wishesOf(g, memberId), about: aboutOf(g, memberId) },
    giftReady: giftReady(g, memberId),
    // They'd opened an earlier draw, so the name they remember is out of date.
    redrawn: Boolean(g.raw[`o:${memberId}`]) && Number(g.raw[`o:${memberId}`]) !== g.meta.round,
    person: { name: g.raw[`m:${receiver}`], wishes: wishesOf(g, receiver), about: aboutOf(g, receiver) },
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
  | { type: "giftReady"; ready: boolean }
  | { type: "ask"; text: string }
  | { type: "reply"; text: string };

export async function memberAction(id: string, memberId: string, token: string, action: MeAction) {
  const g = await authed(id, memberId, token);
  if (!g) return null;
  const field = (name: string, value: string) => {
    g.raw[name] = value;
    return kv().hset(groupKey(id), { [name]: value });
  };
  if (action.type === "open") await field(`o:${memberId}`, String(g.meta.round));
  if (action.type === "wishes") await field(`w:${memberId}`, JSON.stringify(action.wishes));
  if (action.type === "about") await field(`a:${memberId}`, JSON.stringify(action.about));
  if (action.type === "giftReady") await field(`g:${memberId}`, action.ready ? String(g.meta.round) : "0");
  if (action.type === "ask") await post(g, unseal(sealSecret(), id, memberId, g.raw[`s:${memberId}`]), "santa", action.text);
  if (action.type === "reply") await post(g, memberId, "person", action.text);
  if (action.type !== "load") await touch(id);
  return memberView(g, memberId);
}

// ---------- Organiser ------------------------------------------------------------

async function asAdmin(id: string, key: string) {
  const g = await load(id);
  return g && safeEqual(sha256(key), g.meta.adminHash) ? g : null;
}

/** What the organiser sees. Never contains a sealed field or who drew whom. */
function adminView(g: Loaded) {
  const pub = publicView(g);
  return {
    ...pub,
    pairs: g.meta.pairs,
    members: pub.members.map((m) => ({
      ...m,
      opened: Number(g.raw[`o:${m.id}`] ?? 0) === g.meta.round,
      hasWishes: wishesOf(g, m.id).length > 0 || Object.values(aboutOf(g, m.id)).some(Boolean),
      giftReady: giftReady(g, m.id),
    })),
  };
}

export type AdminView = ReturnType<typeof adminView>;

export type AdminAction =
  | { type: "status" }
  | ({ type: "details" } & DetailFields)
  | ({ type: "people" } & PeopleFields)
  | { type: "resetPin"; memberId: string }
  | { type: "newRound" }
  | { type: "delete" };

export async function adminAction(id: string, key: string, action: AdminAction) {
  const g = await asAdmin(id, key);
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

  if (action.type === "delete") {
    await store.del([groupKey(id), ...g.ids.map((m) => threadKey(id, m))]);
    return { view: null };
  }

  const people =
    action.type === "newRound"
      ? { people: g.ids.map((m) => ({ id: m, name: g.raw[`m:${m}`] })), pairs: g.meta.pairs }
      : action;
  // Opened only inside the server, to rule out last round's matches. Never returned.
  const lastRound = action.type === "newRound" ? g.ids.map((m): [string, string] => [m, unseal(sealSecret(), id, m, g.raw[`s:${m}`])]) : [];
  const plan = planPeople(id, people, g.ids, lastRound);
  if (plan.error) return plan;
  const samePeople = plan.ids.length === g.ids.length && plan.ids.every((m) => g.ids.includes(m));
  const pairKey = (p: [string, string][]) => p.map((x) => [...x].sort().join(">")).sort().join();
  if (action.type !== "newRound" && samePeople && pairKey(plan.pairs) === pairKey(g.meta.pairs)) {
    // Only names changed, so the draw stays as it is.
    const renames = Object.fromEntries(Object.entries(plan.fields).filter(([f]) => f.startsWith("m:")));
    await store.hset(groupKey(id), renames);
    return reload();
  }

  const removed = g.ids.filter((m) => !plan.ids.includes(m));
  await store.hset(groupKey(id), {
    ...plan.fields,
    meta: JSON.stringify({ ...g.meta, pairs: plan.pairs, round: g.meta.round + 1 }),
  });
  await store.hdel(groupKey(id), removed.flatMap((m) => ["m", "s", "p", "o", "w", "r", "a", "g"].map((f) => `${f}:${m}`)));
  // New Santas shouldn't read the old Santas' conversations.
  await store.del([...new Set([...g.ids, ...plan.ids])].map((m) => threadKey(id, m)));
  return reload();
}
