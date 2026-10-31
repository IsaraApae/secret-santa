import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Who drew whom is only ever stored encrypted, bound to the group and giver, so
 * a sealed name can't be read from the database or copied onto another person.
 */
function keyFor(secret: string, groupId: string): Buffer {
  return createHmac("sha256", secret).update(`seal:${groupId}`).digest();
}

export function seal(secret: string, groupId: string, giverId: string, receiverId: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFor(secret, groupId), iv);
  c.setAAD(Buffer.from(giverId));
  const body = Buffer.concat([c.update(receiverId, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

/** Throws if the value was tampered with, or sealed for a different person or group. */
export function unseal(secret: string, groupId: string, giverId: string, sealed: string): string {
  const raw = Buffer.from(sealed, "base64url");
  const d = createDecipheriv("aes-256-gcm", keyFor(secret, groupId), raw.subarray(0, 12));
  d.setAAD(Buffer.from(giverId));
  d.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8");
}

export function safeEqual(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 32).toString("base64url");
}

/** Remembers a member on their device. A new salt (PIN reset) cancels old tokens. */
export function memberToken(secret: string, groupId: string, memberId: string, salt: string): string {
  return createHmac("sha256", secret).update(`member:${groupId}:${memberId}:${salt}`).digest("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}
