import "server-only";
import { Redis } from "@upstash/redis";
import { createClient, type RedisClientType } from "redis";

export class StorageNotConfiguredError extends Error {}

/** The few storage operations the app needs, same backends as Bill Splitter. */
interface Kv {
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, fields: Record<string, string>): Promise<void>;
  /** Sets the field only if it's empty. True if this call set it. */
  hsetnx(key: string, field: string, value: string): Promise<boolean>;
  hdel(key: string, fields: string[]): Promise<void>;
  rpush(key: string, value: string): Promise<number>;
  lrange(key: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<void>;
  del(keys: string[]): Promise<void>;
  /** Counts hits in a fixed time window. */
  hit(key: string, windowSec: number): Promise<number>;
}

function upstashKv(r: Redis): Kv {
  return {
    // With deserialisation off, Upstash returns the raw [field, value, ...] list.
    hgetall: async (k) => {
      const flat = ((await r.hgetall(k)) ?? []) as unknown as string[];
      return Object.fromEntries(flat.flatMap((f, i) => (i % 2 ? [] : [[f, flat[i + 1]]])));
    },
    hset: async (k, f) => void (await r.hset(k, f)),
    hsetnx: async (k, f, v) => (await r.hsetnx(k, f, v)) === 1,
    hdel: async (k, f) => void (f.length && (await r.hdel(k, ...f))),
    rpush: (k, v) => r.rpush(k, v),
    lrange: (k) => r.lrange<string>(k, 0, -1),
    expire: async (k, s) => void (await r.expire(k, s)),
    del: async (k) => void (k.length && (await r.del(...k))),
    hit: async (k, s) => {
      const n = await r.incr(k);
      if (n === 1) await r.expire(k, s);
      return n;
    },
  };
}

let tcpClient: Promise<RedisClientType> | null = null;

/** One connection per warm serverless instance, reconnecting after failures. */
function tcp(url: string): Promise<RedisClientType> {
  if (!tcpClient) {
    const client: RedisClientType = createClient({
      url,
      socket: { connectTimeout: 5000, reconnectStrategy: (n) => Math.min(n * 200, 2000) },
    });
    client.on("error", (e) => console.error("Redis error", e?.message ?? e));
    tcpClient = client
      .connect()
      .then(() => client)
      .catch((e) => {
        tcpClient = null;
        throw e;
      });
  }
  return tcpClient;
}

function tcpKv(url: string): Kv {
  return {
    hgetall: async (k) => ({ ...(await (await tcp(url)).hGetAll(k)) }),
    hset: async (k, f) => void (await (await tcp(url)).hSet(k, f)),
    hsetnx: async (k, f, v) => Boolean(await (await tcp(url)).hSetNX(k, f, v)),
    hdel: async (k, f) => void (f.length && (await (await tcp(url)).hDel(k, f))),
    rpush: async (k, v) => (await tcp(url)).rPush(k, v),
    lrange: async (k) => (await tcp(url)).lRange(k, 0, -1),
    expire: async (k, s) => void (await (await tcp(url)).expire(k, s)),
    del: async (k) => void (k.length && (await (await tcp(url)).del(k))),
    hit: async (k, s) => {
      const c = await tcp(url);
      const n = await c.incr(k);
      if (n === 1) await c.expire(k, s);
      return n;
    },
  };
}

/** Dev-only in-memory store so the whole flow works locally without Redis. */
function memoryKv(): Kv {
  const g = globalThis as unknown as { __ssMem?: Map<string, unknown> };
  const m = (g.__ssMem ??= new Map<string, unknown>());
  const hash = (k: string) => {
    if (!m.has(k)) m.set(k, new Map<string, string>());
    return m.get(k) as Map<string, string>;
  };
  const list = (k: string) => {
    if (!m.has(k)) m.set(k, [] as string[]);
    return m.get(k) as string[];
  };
  return {
    hgetall: async (k) => Object.fromEntries(hash(k)),
    hset: async (k, f) => Object.entries(f).forEach(([a, b]) => hash(k).set(a, b)),
    hsetnx: async (k, f, v) => {
      if (hash(k).has(f)) return false;
      hash(k).set(f, v);
      return true;
    },
    hdel: async (k, f) => f.forEach((x) => hash(k).delete(x)),
    rpush: async (k, v) => list(k).push(v),
    lrange: async (k) => [...list(k)],
    expire: async () => {},
    del: async (k) => k.forEach((x) => m.delete(x)),
    hit: async (k) => {
      const n = (Number(m.get(k)) || 0) + 1;
      m.set(k, n);
      return n;
    },
  };
}

const restUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const tcpUrl = process.env.REDIS_URL;

let cached: Kv | null = null;

export function kv(): Kv {
  if (cached) return cached;
  // Deserialisation off: values are stored as strings and parsed in one place.
  if (restUrl && restToken) cached = upstashKv(new Redis({ url: restUrl, token: restToken, automaticDeserialization: false }));
  else if (tcpUrl) cached = tcpKv(tcpUrl);
  else if (process.env.NODE_ENV !== "production") cached = memoryKv();
  else throw new StorageNotConfiguredError();
  return cached;
}

/** The key that encrypts who drew whom. */
export function sealSecret(): string {
  const s = process.env.SEAL_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-secret";
  throw new StorageNotConfiguredError();
}
