"use client";

import type { T } from "@/lib/i18n";

// What this device remembers. Losing it is fine: the PIN and organiser link get you back in.
function read<V>(key: string, fallback: V): V {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as V) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export interface Session {
  memberId: string;
  token: string;
}
export const getSession = (id: string) => read<Session | null>(`ss:member:${id}`, null);
export const setSession = (id: string, s: Session | null) => write(`ss:member:${id}`, s);

export interface SavedGroup {
  id: string;
  name: string;
  key?: string;
}
export const myGroups = () => read<SavedGroup[]>("ss:groups", []);
export function rememberGroup(g: SavedGroup) {
  const all = myGroups();
  const old = all.find((x) => x.id === g.id);
  write("ss:groups", [{ ...old, ...g }, ...all.filter((x) => x.id !== g.id)].slice(0, 30));
}
export const forgetGroup = (id: string) => write("ss:groups", myGroups().filter((g) => g.id !== id));
export const organiserKey = (id: string) => myGroups().find((g) => g.id === id)?.key;

export async function api<R>(path: string, body?: unknown): Promise<{ ok: true; data: R } | { ok: false; error: string; name?: string }> {
  try {
    const res = await fetch(path, body === undefined ? undefined : { method: "POST", body: JSON.stringify(body) });
    const data = await res.json();
    return res.ok ? { ok: true, data } : { ok: false, error: data.error ?? "server_error", name: data.name };
  } catch {
    return { ok: false, error: "server_error" };
  }
}

export function errorText(t: T, e: { error: string; name?: string }): string {
  if (e.error === "impossible") return t("errImpossible");
  if (e.error === "duplicate_name") return t("errDuplicate", { name: e.name ?? "" });
  if (e.error === "too_many") return t("errTooMany");
  if (e.error === "not_configured") return t("errNotConfigured");
  if (e.error === "forbidden") return t("errForbidden");
  if (e.error === "wrong_pin") return t("wrongPin");
  return t("errGeneric");
}

export const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { dateStyle: "long" });

export const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;
