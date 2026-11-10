import "server-only";
import { kv, StorageNotConfiguredError } from "./kv";

export function jsonError(status: number, error: string, extra: object = {}) {
  return Response.json({ error, ...extra }, { status });
}

/**
 * Wraps a route handler so unexpected failures become clean JSON errors. Every answer is marked not to
 * be kept: they carry names, wish lists and messages, which have no place in a browser's or proxy's cache.
 */
export async function safely(fn: () => Promise<Response>): Promise<Response> {
  let res: Response;
  try {
    res = await fn();
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) res = jsonError(503, "not_configured");
    else {
      console.error(e);
      res = jsonError(500, "server_error");
    }
  }
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/** Reads a JSON body with a size cap. Returns undefined on bad/oversized input. */
export async function readJson(req: Request, maxBytes = 64_000): Promise<unknown> {
  const body = await req.text();
  if (body.length > maxBytes) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/** True when this IP has gone over the limit for the bucket in the last hour. */
export async function overLimit(req: Request, bucket: string, perHour: number): Promise<boolean> {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const n = await kv().hit(`ss:rl:${bucket}:${ip}:${Math.floor(Date.now() / 3_600_000)}`, 3600);
  return n > perHour;
}
