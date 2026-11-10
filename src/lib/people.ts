interface Named {
  id: string;
  name: string;
}

/**
 * The list to save from the organiser's Edit people sheet. The sheet holds the group as it was when it
 * opened, and the group can change while it's open: people join with the link, and anyone can fix their
 * own name. Saved as it stands, the sheet's list would remove the newcomers and put the old names back.
 * `seen` is the list the sheet opened with, so only what differs from it is the organiser's doing:
 * a name they didn't touch keeps whatever it is now, and anyone they never saw stays in the group.
 */
export function organiserChanges(saved: Named[], seen: Named[], now: Named[]): Named[] {
  const seenName = new Map(seen.map((p) => [p.id, p.name]));
  const nameNow = new Map(now.map((p) => [p.id, p.name]));
  const kept = saved.map((p) => (seenName.get(p.id) === p.name && nameNow.has(p.id) ? { id: p.id, name: nameNow.get(p.id)! } : p));
  const joinedSince = now.filter((p) => !seenName.has(p.id) && !saved.some((s) => s.id === p.id));
  return [...kept, ...joinedSince];
}
