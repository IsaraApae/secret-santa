import { randomInt } from "node:crypto";

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Giver → receiver. Nobody draws themselves or someone they're excluded with
 * (exclusions work both ways), and `oneWay` lists exact giver → receiver matches
 * to rule out. Returns null when no valid draw exists.
 */
export function drawNames(ids: string[], pairs: [string, string][] = [], oneWay: [string, string][] = []): Record<string, string> | null {
  const barred = new Set([...pairs.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]), ...oneWay.map(([g, r]) => `${g}>${r}`)]);
  const allowed = (giver: string, receiver: string) => giver !== receiver && !barred.has(`${giver}>${receiver}`);

  // Reshuffling until one fits keeps every valid outcome equally likely.
  for (let i = 0; i < 5000; i++) {
    const r = shuffled(ids);
    if (ids.every((g, j) => allowed(g, r[j]))) return Object.fromEntries(ids.map((g, j) => [g, r[j]]));
  }

  // Only very tight exclusions get here. Bipartite matching finds a draw if one exists at all.
  const giverOf = new Map<string, string>();
  const assign = (giver: string, seen: Set<string>): boolean => {
    for (const r of shuffled(ids)) {
      if (seen.has(r) || !allowed(giver, r)) continue;
      seen.add(r);
      const current = giverOf.get(r);
      if (!current || assign(current, seen)) {
        giverOf.set(r, giver);
        return true;
      }
    }
    return false;
  };
  for (const g of shuffled(ids)) if (!assign(g, new Set())) return null;
  return Object.fromEntries([...giverOf].map(([r, g]) => [g, r]));
}
