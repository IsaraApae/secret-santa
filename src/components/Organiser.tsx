"use client";

import { Bell, Check, HelpCircle, Gift, KeyRound, Pencil, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { askConfirm } from "@/lib/client/confirm";
import { api, deviceId, dropKey, errorText, forgetGroup, organiserKey, rememberGroup } from "@/lib/client/store";
import { hasThai } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { AdminAction, AdminView } from "@/lib/server/groups";
import { Countdown, DrawShow, GiftBox, GroupFacts, GuessResults, useRoomEntrance } from "./Festive";
import { detailsBody, DetailsFields, type DetailValues } from "./DetailsFields";
import { PeopleEditor, type EditPerson, type Pair } from "./PeopleEditor";
import { ShareCard, useCopy } from "./ShareCard";
import { Callout, ICON, langOf, Section, Sheet, Sticker } from "./ui";

export function Organiser({ id }: { id: string }) {
  const t = useT();
  const fromUrl = useSearchParams().get("k");
  const [key, setKey] = useState<string | null>(null);
  const [view, setView] = useState<AdminView | null>(null);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<"details" | "people" | null>(null);
  const [origin, setOrigin] = useState("");
  const reminder = useCopy();
  const router = useRouter();
  // The names on show while they're drawn.
  const [drawing, setDrawing] = useState<string[] | null>(null);
  useRoomEntrance();

  // Only the newest answer is shown: a check sent just before a change and answered just after it would
  // put the old lists back, and editing people from those would undo the change. Checks also wait while
  // a change is on its way.
  const latest = useRef(0);
  const changing = useRef(0);

  /** A change, or with `check` the regular look for news, which never shows or clears an error. */
  const send = useCallback(
    async (k: string, action: AdminAction, check = false) => {
      if (check && changing.current) return false;
      const n = ++latest.current;
      if (!check) changing.current++;
      try {
        const res = await api<AdminView>(`/api/g/${id}/admin`, { key: k, device: deviceId(), action });
        if (res.ok) {
          if (n === latest.current) setView(res.data);
          if (!check) setError("");
          rememberGroup({ id, name: res.data.name, key: k });
          return true;
        }
        if (res.error === "forbidden") {
          // Another phone made this group (or manages it): this one's copy of the key is no use.
          dropKey(id);
          setView(null);
          setKey(null);
          setError(t("errNotOrganiser"));
          return false;
        }
        // A check that fails is simply tried again a few seconds later.
        if (!check) setError(errorText(t, res));
        return false;
      } finally {
        if (!check) changing.current--;
      }
    },
    [id, t],
  );

  useEffect(() => {
    setOrigin(location.origin);
    // Only the phone that made the group holds its key. A key in an address (an old organiser link) is
    // never taken up, so passing a link around can't make anyone else an organiser; it's only cleared away.
    if (fromUrl) router.replace(`/o/${id}`);
    const k = organiserKey(id) ?? null;
    setKey(k);
    if (!k) {
      setError(t("errNotOrganiser"));
      return;
    }
    send(k, { type: "status" });
    // Keeps the lists current while the organiser watches, and catches up the
    // moment they come back to the page.
    // Stops once the server has refused this phone (its key is dropped then).
    const refresh = () => !document.hidden && organiserKey(id) && send(k, { type: "status" }, true);
    const i = setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fromUrl]);

  if (!view) {
    return error ? <div className="pt-4"><Callout tone="error">{error}</Callout></div> : <p className="py-10 text-center text-ink-2">{t("loading")}</p>;
  }

  const opened = view.members.filter((m) => m.opened).length;
  const inviteUrl = `${origin}/g/${id}`;
  // A sheet starts without the page's last error, so it only shows its own.
  const openSheet = (which: "details" | "people") => {
    setError("");
    setSheet(which);
  };

  function reminderText() {
    const names = (list: AdminView["members"]) => list.map((m) => m.name).join(", ");
    const unopened = view!.members.filter((m) => !m.opened);
    return [
      t("reminderLead", { name: view!.name }),
      unopened.length ? t("reminderUnopened", { names: names(unopened) }) : "",
      !unopened.length ? t("reminderAllDone") : "",
      inviteUrl,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function drawNow() {
    const ok = await askConfirm({ title: t("drawTitle"), message: t("drawBody"), confirmLabel: t("drawNow") });
    const names = view!.members.map((m) => m.name);
    if (ok && (await send(key!, { type: "draw" }))) setDrawing(names);
  }

  async function revealGuesses() {
    const ok = await askConfirm({ title: t("revealTitle"), message: t("revealBody"), confirmLabel: t("revealConfirm") });
    if (ok) send(key!, { type: "revealGuesses" });
  }

  async function drawAgain() {
    const ok = await askConfirm({ title: t("drawAgainTitle"), message: t("drawAgainBody"), confirmLabel: t("drawAgain"), destructive: true });
    const names = view!.members.map((m) => m.name);
    if (ok && (await send(key!, { type: "newRound" }))) setDrawing(names);
  }

  async function deleteGroup() {
    const ok = await askConfirm({ title: t("deleteTitle", { name: view!.name }), message: t("deleteBody"), confirmLabel: t("delete"), destructive: true });
    if (!ok) return;
    const res = await api(`/api/g/${id}/admin`, { key, device: deviceId(), action: { type: "delete" } });
    if (!res.ok) return setError(errorText(t, res));
    forgetGroup(id);
    router.push("/");
  }

  async function resetPin(memberId: string, name: string) {
    const ok = await askConfirm({ title: t("resetPinTitle", { name }), message: t("resetPinBody"), confirmLabel: t("resetPin"), destructive: true });
    if (ok) send(key!, { type: "resetPin", memberId });
  }

  return (
    <div className="room space-y-6">
      {drawing && <DrawShow names={drawing} onDone={() => setDrawing(null)} />}
      <header className="space-y-3 px-1 pt-2 text-center">
        <h1 lang={langOf(view.name)} className={`large-title break-words ${hasThai(view.name) ? "leading-[1.6]" : ""}`}>{view.name}</h1>
        <GroupFacts budget={view.budget} date={view.date} />
        {/* Below the facts, not on the title: script names swash past their box. */}
        <button type="button" className="chip min-h-10" onClick={() => openSheet("details")}>
          <Pencil size={16} {...ICON} aria-hidden />
          {t("editDetails")}
        </button>
      </header>

      {view.date && <Countdown date={view.date} />}

      {error && <Callout tone="error">{error}</Callout>}

      <ShareCard url={inviteUrl} groupName={view.name} />

      <Callout tone="success" icon={<ShieldCheck size={20} {...ICON} />}>
        <p className="font-semibold">{t("privateTitle")}</p>
        <p className="mt-1">{t("privateBody")}</p>
        <Link href={`/g/${id}`} className="btn-green mt-3 h-12">
          <Gift size={18} {...ICON} aria-hidden />
          {t("openMine")}
        </Link>
      </Callout>

      <Section
        title={view.drawn ? t("statusTitle") : t("joinedTitle")}
        action={
          <button type="button" className="chip min-h-10 shrink-0 whitespace-nowrap" onClick={() => openSheet("people")}>
            <Users size={16} {...ICON} aria-hidden />
            {t("editPeople")}
          </button>
        }
      >
        <ul className="card rows taped relative tilt-r">
          <li className="flex items-center gap-3 px-5 pt-4 pb-3 font-serif text-[15px]">
            {!view.members.length && <Sticker name="megaphone" size={40} className="-rotate-6" />}
            {view.drawn ? t("statusCount", { n: opened, total: view.members.length }) : view.members.length ? t(view.members.length === 1 ? "joinedOne" : "joinedCount", { n: view.members.length }) : t("joinedNone")}
          </li>
          {view.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2 pr-2 pl-5">
              <span className="min-w-0 flex-1">
                <span lang={langOf(m.name)} className="block truncate font-medium">{m.name}</span>
                <span className="block text-[13px] text-ink-2">
                  {[m.opened ? t("stOpened") : m.claimed ? t("stJoined") : t("stWaiting"), m.hasWishes && t("hasWishes")].filter(Boolean).join(" · ")}
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

      {!view.drawn && (
        <div className="card relative space-y-2 p-4">
          <GiftBox state="still" size={58} className="pin-sticker" />
          <button type="button" className="btn-primary h-14 w-full text-[20px]" disabled={view.members.length < 3} onClick={drawNow}>
            {t("drawNow")}
          </button>
          <p className="px-1 text-[14px] leading-snug text-ink-2">{view.members.length < 3 ? t("needThree") : t("drawHint")}</p>
        </div>
      )}

      {view.drawn && (
      <div className="card relative tilt-l nudge-l space-y-2 p-4">
        <GiftBox state="still" size={58} className="pin-sticker" />
        <button type="button" className="btn-green h-12 w-full" onClick={() => reminder.copy(reminderText())}>
          {reminder.copied ? <Check size={20} {...ICON} aria-hidden /> : <Bell size={20} {...ICON} aria-hidden />}
          {reminder.copied ? t("copied") : t("copyReminder")}
        </button>
        <p className="px-1 text-[13px] leading-snug text-ink-2">{t("reminderHint")}</p>
      </div>
      )}

      {view.guesses ? (
        <GuessResults results={view.guesses} />
      ) : view.drawn && (
        <Section title={t("guessTitle")} sticker="question">
          <div className="card tilt-r nudge-r space-y-2 p-4">
            <p className="px-1 font-serif text-[15px]">{t("guessedCount", { n: view.guessedCount, total: view.members.length })}</p>
            <button type="button" className="btn-primary h-12 w-full" onClick={revealGuesses}>
              <HelpCircle size={20} {...ICON} aria-hidden />
              {t("revealGuesses")}
            </button>
            <p className="px-1 text-[13px] leading-snug text-ink-2">{t("revealHint")}</p>
          </div>
        </Section>
      )}

      <Section title={t("moreActions")} sticker="ornament">
        <div className="card space-y-3 p-4">
          {view.drawn && (
            <>
              <button type="button" className="btn-secondary h-12 w-full" onClick={drawAgain}>
                <RefreshCw size={20} {...ICON} aria-hidden />
                {t("drawAgain")}
              </button>
              <p className="px-1 text-[13px] leading-snug text-ink-2">{t("drawAgainHint")}</p>
            </>
          )}
          <button type="button" className="btn-secondary h-12 w-full !text-danger" onClick={deleteGroup}>
            <Trash2 size={20} {...ICON} aria-hidden />
            {t("deleteGroup")}
          </button>
          <p className="px-1 text-[13px] leading-snug text-ink-2">{t("deleteGroupHint")}</p>
        </div>
      </Section>

      {sheet === "details" && <DetailsSheet view={view} onClose={() => setSheet(null)} onSave={(body) => send(key!, { type: "details", ...body })} />}
      {sheet === "people" && <PeopleSheet view={view} onClose={() => setSheet(null)} onSave={(people, pairs) => send(key!, { type: "people", people, pairs })} error={error} />}
    </div>
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
    const redraw = view.drawn && (!samePeople || key(pairs) !== key(view.pairs as Pair[]));
    if (redraw && !(await askConfirm({ title: t("redrawTitle"), message: t("redrawBody"), confirmLabel: t("redrawConfirm"), destructive: true }))) return;
    if (await onSave(people.map((p) => ({ ...p, name: p.name.trim() })), pairs)) onClose();
  }

  return (
    <Sheet open onClose={onClose} title={t("editPeople")} onConfirm={save} confirmDisabled={(view.drawn && people.length < 3) || people.some((p) => !p.name.trim())}>
      <div className="space-y-4">
        {view.drawn && <Callout tone="warn">{t("redrawWarn")}</Callout>}
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
