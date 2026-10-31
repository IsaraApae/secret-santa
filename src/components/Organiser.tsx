"use client";

import { Bell, Check, CircleDashed, Copy, Gift, KeyRound, Pencil, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { askConfirm } from "@/lib/client/confirm";
import { api, baht, errorText, forgetGroup, formatDate, organiserKey, rememberGroup } from "@/lib/client/store";
import { useLang, useT } from "@/lib/i18n";
import type { AdminView } from "@/lib/server/groups";
import { Countdown } from "./Festive";
import { detailsBody, DetailsFields, PeopleEditor, type DetailValues, type EditPerson, type Pair } from "./PeopleEditor";
import { ShareCard, useCopy } from "./ShareCard";
import { Callout, cx, ICON, Section, Sheet } from "./ui";

export function Organiser({ id }: { id: string }) {
  const t = useT();
  const { lang } = useLang();
  const fromUrl = useSearchParams().get("k");
  const [key, setKey] = useState<string | null>(fromUrl);
  const [view, setView] = useState<AdminView | null>(null);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<"details" | "people" | null>(null);
  const [origin, setOrigin] = useState("");
  const { copied, copy } = useCopy();
  const reminder = useCopy();
  const router = useRouter();

  const send = useCallback(
    async (k: string, action: object) => {
      const res = await api<AdminView>(`/api/g/${id}/admin`, { key: k, action });
      if (res.ok) {
        setView(res.data);
        setError("");
        rememberGroup({ id, name: res.data.name, key: k });
        return true;
      }
      setError(errorText(t, res));
      return false;
    },
    [id, t],
  );

  useEffect(() => {
    setOrigin(location.origin);
    const k = fromUrl ?? organiserKey(id) ?? null;
    setKey(k);
    if (!k) {
      setError(t("errForbidden"));
      return;
    }
    send(k, { type: "status" });
    // Keeps the opened list current while the organiser watches.
    const i = setInterval(() => !document.hidden && send(k, { type: "status" }), 20000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fromUrl]);

  if (!view) {
    return error ? <div className="pt-4"><Callout tone="error">{error}</Callout></div> : <p className="py-10 text-center text-ink-2">{t("loading")}</p>;
  }

  const opened = view.members.filter((m) => m.opened).length;
  const ready = view.members.filter((m) => m.giftReady).length;
  const inviteUrl = `${origin}/g/${id}`;

  function reminderText() {
    const names = (list: AdminView["members"]) => list.map((m) => m.name).join(", ");
    const unopened = view!.members.filter((m) => !m.opened);
    const noGift = view!.members.filter((m) => !m.giftReady);
    return [
      t("reminderLead", { name: view!.name }),
      unopened.length ? t("reminderUnopened", { names: names(unopened) }) : "",
      noGift.length ? t("reminderNoGift", { names: names(noGift) }) : "",
      !unopened.length && !noGift.length ? t("reminderAllDone") : "",
      inviteUrl,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function drawAgain() {
    const ok = await askConfirm({ title: t("drawAgainTitle"), message: t("drawAgainBody"), confirmLabel: t("drawAgain"), destructive: true });
    if (ok) send(key!, { type: "newRound" });
  }

  async function deleteGroup() {
    const ok = await askConfirm({ title: t("deleteTitle", { name: view!.name }), message: t("deleteBody"), confirmLabel: t("delete"), destructive: true });
    if (!ok) return;
    const res = await api(`/api/g/${id}/admin`, { key, action: { type: "delete" } });
    if (!res.ok) return setError(errorText(t, res));
    forgetGroup(id);
    router.push("/");
  }

  async function resetPin(memberId: string, name: string) {
    const ok = await askConfirm({ title: t("resetPinTitle", { name }), message: t("resetPinBody"), confirmLabel: t("resetPin"), destructive: true });
    if (ok) send(key!, { type: "resetPin", memberId });
  }

  return (
    <>
      <header className="space-y-1 px-1 pt-3">
        <p className="text-[13px] font-semibold text-accent-strong">{t("organiser")}</p>
        <div className="flex items-start justify-between gap-2">
          <h1 className="large-title min-w-0 break-words">{view.name}</h1>
          <button type="button" className="icon-btn" aria-label={t("editDetails")} onClick={() => setSheet("details")}>
            <Pencil size={20} {...ICON} aria-hidden />
          </button>
        </div>
        <p className="text-ink-2">
          {[view.budget !== null && t("budgetLine", { amount: baht(view.budget) }), view.date && formatDate(view.date, lang)].filter(Boolean).join(" · ")}
        </p>
      </header>

      {view.date && (
        <div className="card p-4">
          <Countdown date={view.date} />
        </div>
      )}

      {error && <Callout tone="error">{error}</Callout>}

      <ShareCard url={inviteUrl} groupName={view.name} />

      <Callout tone="success" icon={<ShieldCheck size={20} {...ICON} />}>
        <p className="font-semibold">{t("privateTitle")}</p>
        <p className="mt-1">{t("privateBody")}</p>
        <Link href={`/g/${id}`} className="btn-secondary mt-3 h-11">
          <Gift size={18} {...ICON} aria-hidden />
          {t("openMine")}
        </Link>
      </Callout>

      <Section
        title={`${t("statusCount", { n: opened, total: view.members.length })} · ${t("giftsCount", { n: ready, total: view.members.length })}`}
        action={
          <button type="button" className="chip min-h-9 shrink-0 whitespace-nowrap" onClick={() => setSheet("people")}>
            <Users size={16} {...ICON} aria-hidden />
            {t("editPeople")}
          </button>
        }
      >
        <ul className="card rows overflow-hidden">
          {view.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2 pr-2 pl-5">
              <span className={cx("grid size-7 shrink-0 place-items-center rounded-full", m.opened ? "bg-accent text-accent-ink" : m.claimed ? "bg-accent-soft text-accent-strong" : "bg-field text-ink-2")} aria-hidden>
                {m.opened ? <Check size={16} {...ICON} /> : m.claimed ? <Gift size={15} {...ICON} /> : <CircleDashed size={16} {...ICON} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.name}</span>
                <span className="block text-[13px] text-ink-2">
                  {[m.opened ? t("stOpened") : m.claimed ? t("stJoined") : t("stWaiting"), m.giftReady && t("stGiftReady"), m.hasWishes && t("hasWishes"), m.resets > 0 && t("pinResetBadge", { n: m.resets })].filter(Boolean).join(" · ")}
                </span>
              </span>
              {m.claimed && (
                <button type="button" className="icon-plain" aria-label={`${t("resetPin")}: ${m.name}`} onClick={() => resetPin(m.id, m.name)}>
                  <KeyRound size={20} {...ICON} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <div className="card space-y-2 p-4">
        <button type="button" className="btn-secondary h-12 w-full" onClick={() => reminder.copy(reminderText())}>
          {reminder.copied ? <Check size={20} {...ICON} aria-hidden /> : <Bell size={20} {...ICON} aria-hidden />}
          {reminder.copied ? t("copied") : t("copyReminder")}
        </button>
        <p className="px-1 text-[13px] leading-snug text-ink-2">{t("reminderHint")}</p>
      </div>

      <Section title={t("moreActions")}>
        <div className="card space-y-3 p-4">
          <button type="button" className="btn-secondary h-12 w-full" onClick={drawAgain}>
            <RefreshCw size={20} {...ICON} aria-hidden />
            {t("drawAgain")}
          </button>
          <p className="px-1 text-[13px] leading-snug text-ink-2">{t("drawAgainHint")}</p>
          <button type="button" className="btn-secondary h-12 w-full text-danger" onClick={deleteGroup}>
            <Trash2 size={20} {...ICON} aria-hidden />
            {t("deleteGroup")}
          </button>
          <p className="px-1 text-[13px] leading-snug text-ink-2">{t("deleteGroupHint")}</p>
        </div>
      </Section>

      <div className="space-y-2 px-1 text-center">
        <button type="button" className="btn-ghost" onClick={() => copy(`${origin}/o/${id}?k=${key}`)}>
          {copied ? <Check size={18} {...ICON} aria-hidden /> : <Copy size={18} {...ICON} aria-hidden />}
          {copied ? t("copied") : t("saveOrganiserLink")}
        </button>
        <p className="text-[13px] text-ink-2">{t("saveOrganiserHint")}</p>
      </div>

      {sheet === "details" && <DetailsSheet view={view} onClose={() => setSheet(null)} onSave={(body) => send(key!, { type: "details", ...body })} />}
      {sheet === "people" && <PeopleSheet view={view} onClose={() => setSheet(null)} onSave={(people, pairs) => send(key!, { type: "people", people, pairs })} error={error} />}
    </>
  );
}

function DetailsSheet({ view, onClose, onSave }: { view: AdminView; onClose: () => void; onSave: (b: ReturnType<typeof detailsBody>) => Promise<boolean> }) {
  const t = useT();
  const [value, setValue] = useState<DetailValues>({
    name: view.name,
    budget: view.budget === null ? "" : String(view.budget),
    date: view.date ?? "",
    note: view.note,
  });
  return (
    <Sheet
      open
      onClose={onClose}
      title={t("editDetails")}
      confirmDisabled={!value.name.trim()}
      onConfirm={async () => {
        if (await onSave(detailsBody(value))) onClose();
      }}
    >
      <DetailsFields value={value} onChange={setValue} />
    </Sheet>
  );
}

function PeopleSheet({ view, onClose, onSave, error }: { view: AdminView; onClose: () => void; onSave: (p: EditPerson[], pairs: Pair[]) => Promise<boolean>; error: string }) {
  const t = useT();
  const [people, setPeople] = useState<EditPerson[]>(view.members.map(({ id, name }) => ({ id, name })));
  const [pairs, setPairs] = useState<Pair[]>(view.pairs as Pair[]);

  async function save() {
    const was = new Set(view.members.map((m) => m.id));
    const samePeople = people.length === was.size && people.every((p) => was.has(p.id));
    const key = (list: Pair[]) => list.map((p) => [...p].sort().join(">")).sort().join();
    const redraw = !samePeople || key(pairs) !== key(view.pairs as Pair[]);
    if (redraw && !(await askConfirm({ title: t("redrawTitle"), message: t("redrawBody"), confirmLabel: t("redrawConfirm"), destructive: true }))) return;
    if (await onSave(people.map((p) => ({ ...p, name: p.name.trim() })), pairs)) onClose();
  }

  return (
    <Sheet open onClose={onClose} title={t("editPeople")} onConfirm={save} confirmDisabled={people.length < 3 || people.some((p) => !p.name.trim())}>
      <div className="space-y-4">
        <Callout tone="warn">{t("redrawWarn")}</Callout>
        {error && <Callout tone="error">{error}</Callout>}
        <PeopleEditor
          people={people}
          pairs={pairs}
          onChange={(a, b) => {
            setPeople(a);
            setPairs(b);
          }}
        />
      </div>
    </Sheet>
  );
}
