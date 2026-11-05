"use client";

import { Check, ExternalLink, EyeOff, Globe, Lock, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api, baht, errorText, getSession, rememberGroup, setSession, type Session } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import type { AboutMe, WishItem } from "@/lib/schema";
import type { MeAction, MemberView, Msg, PublicGroup } from "@/lib/server/groups";
import { hasThai } from "@/lib/format";
import { formatPrice, type ShopPrice } from "@/lib/price";
import { parseShopPaste, safeUrl, SHOP_LABEL, shopOf, siteOf, type Shop } from "@/lib/shop";
import { Countdown, Fall, GiftBox, GroupFacts, GiftTag, GuessResults, useArrivals, useRoomEntrance } from "./Festive";
import { Callout, Choice, cx, ICON, PinPad, Section, Segmented, Sheet, Sticker } from "./ui";

type ActError = { error: string; name?: string };

export function MemberApp({ id, initial }: { id: string; initial: PublicGroup }) {
  const t = useT();
  const [group, setGroup] = useState(initial);
  const [session, setSess] = useState<Session | null>(null);
  const [view, setView] = useState<MemberView | null>(null);
  const [ready, setReady] = useState(false);
  // You, just after joining here: your tag drops into Who's in.
  const [joined, setJoined] = useState<string | null>(null);

  const signOut = useCallback(() => {
    setSession(id, null);
    setSess(null);
    setView(null);
    api<PublicGroup>(`/api/g/${id}`).then((r) => r.ok && setGroup(r.data));
  }, [id]);

  const act = useCallback(
    async (s: Session, action: MeAction, onError?: (e: ActError) => void) => {
      const res = await api<MemberView>(`/api/g/${id}/me`, { ...s, action });
      if (res.ok) {
        setView(res.data);
        setGroup(res.data.group);
      } else if (res.error === "signed_out") signOut();
      else onError?.(res);
      return res.ok;
    },
    [id, signOut],
  );

  useEffect(() => {
    rememberGroup({ id, name: initial.name });
    const s = getSession(id);
    setSess(s);
    setReady(true);
    if (s) act(s, { type: "load" });
  }, [id, initial.name, act]);

  // Every few seconds while on screen, and straight away on coming back to the page.
  // Signed in, your own page brings the group with it, so that's one request, not two.
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      if (session) act(session, { type: "load" });
      else api<PublicGroup>(`/api/g/${id}`).then((r) => r.ok && setGroup(r.data));
    };
    const i = setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [id, session, act]);

  useRoomEntrance();

  return (
    <div className="room space-y-6">
      <header className="space-y-3 px-1 pt-2 text-center">
        <h1 className={cx("large-title break-words", hasThai(group.name) && "leading-[1.6]")}>{group.name}</h1>
        <GroupFacts budget={group.budget} date={group.date} />
      </header>
      {group.date && <Countdown date={group.date} />}
      {group.note && <p className="card px-5 py-4 text-[15px] leading-snug whitespace-pre-wrap">{group.note}</p>}

      {(view?.guesses ?? group.guesses) && <GuessResults results={(view?.guesses ?? group.guesses)!} />}

      {!ready || (session && !view) ? (
        <p className="py-10 text-center text-ink-2">{t("loading")}</p>
      ) : session && view ? (
        <Signedin view={view} act={(a, onError) => act(session, a, onError)} signOut={signOut} budget={group.budget} members={group.members} joined={joined} />
      ) : (
        <Picker
          id={id}
          group={group}
          onSession={(s, isNew) => {
            setSession(id, s);
            setSess(s);
            setJoined(isNew ? s.memberId : null);
            act(s, { type: "load" });
          }}
        />
      )}
    </div>
  );
}

// ---------- Picking your name ----------------------------------------------------

function Picker({ id, group, onSession }: { id: string; group: PublicGroup; onSession: (s: Session, isNew?: boolean) => void }) {
  const t = useT();
  // People who join while you're on this page drop into the list.
  const tags = useArrivals<HTMLUListElement>(group.members.map((m) => m.id), "drop-in");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [picked, setPicked] = useState<PublicGroup["members"][number] | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function joinGroup() {
    setJoining(true);
    setJoinError("");
    const res = await api<{ memberId: string; token: string }>(`/api/g/${id}/join`, { name: newName.trim(), pin: newPin });
    setJoining(false);
    if (res.ok) onSession(res.data, true);
    else setJoinError(errorText(t, res));
  }

  async function submit() {
    if (!picked) return;
    setBusy(true);
    setError("");
    const res = await api<{ token: string }>(`/api/g/${id}/claim`, { memberId: picked.id, pin });
    setBusy(false);
    if (res.ok) onSession({ memberId: picked.id, token: res.data.token });
    else {
      setError(errorText(t, res));
      setPin("");
    }
  }

  return (
    <>
      {group.drawn ? (
        <Callout tone="info">{t("closedHint")}</Callout>
      ) : (
        <Section title={t("joinTitle")} sticker="tree">
          <form
            className="card space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              joinGroup();
            }}
          >
            <p className="px-1 text-[14px] leading-snug text-ink-2">{t("joinHint")}</p>
            <input className="input" maxLength={40} autoComplete="given-name" value={newName} placeholder={t("yourName")} aria-label={t("yourName")} onChange={(e) => setNewName(e.target.value)} />
            <p className="label pt-1 text-center">{t("pin")}</p>
            <PinPad value={newPin} onChange={setNewPin} label={t("pin")} />
            {joinError && <Callout tone="error">{joinError}</Callout>}
            <button type="submit" className="btn-primary h-14 w-full text-[20px]" disabled={!newName.trim() || newPin.length !== 4 || joining}>
              {joining ? t("joining") : t("joinButton")}
            </button>
          </form>
        </Section>
      )}

      {group.members.length > 0 && (
      <Section title={group.drawn ? t("whoAreYou") : t("alreadyJoined")} sticker="info">
        <div className="card space-y-4 px-4 pt-4 pb-5">
          <p className="px-1 text-center font-serif text-[15px]">
            {t("whoAreYouSub")}
            {group.members.some((m) => m.claimed) && <span className="block text-[13px] text-ink-2">{t("lockHint")}</span>}
          </p>
          {/* The same paper tags as "Who's in", to tap: yours opens the PIN sheet. */}
          <ul ref={tags.ref} className="flex flex-wrap justify-center gap-x-2.5 gap-y-3">
            {group.members.map((m, i) => (
              <li key={m.id} className={cx("max-w-full", tags.arrive(m.id))}>
                <button
                  type="button"
                  className="press block max-w-full rounded-lg"
                  aria-label={m.claimed ? `${m.name}, ${t("pinTaken")}` : m.name}
                  onClick={() => {
                    setPicked(m);
                    setPin("");
                    setError("");
                  }}
                >
                  <NameTag name={m.name} index={i}>
                    {m.claimed && <Lock size={13} {...ICON} aria-hidden className="shrink-0 text-ink-3" />}
                  </NameTag>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      )}

      <Sheet open={Boolean(picked)} onClose={() => setPicked(null)} title={picked ? t("hiName", { name: picked.name }) : ""} subtitle={picked?.claimed ? t("enterPin") : t("choosePin")}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="text-[15px] leading-snug text-ink-2">{picked?.claimed ? t("enterPinSub") : t("choosePinSub")}</p>
          <PinPad value={pin} onChange={setPin} label={picked?.claimed ? t("enterPin") : t("choosePin")} autoFocus />
          {error && <Callout tone="error">{error}</Callout>}
          <button type="submit" className="btn-primary h-12 w-full" disabled={pin.length !== 4 || busy}>
            {t("continue")}
          </button>
        </form>
      </Sheet>
    </>
  );
}

// ---------- Signed in -------------------------------------------------------------

function Signedin({
  view,
  act,
  signOut,
  budget,
  members,
  joined,
}: {
  view: MemberView;
  act: (a: MeAction, onError?: (e: ActError) => void) => Promise<boolean>;
  signOut: () => void;
  budget: number | null;
  members: PublicGroup["members"];
  joined: string | null;
}) {
  const t = useT();
  const [tab, setTab] = useState<"person" | "mine">("person");
  const [renaming, setRenaming] = useState(false);
  const unread = view.withSanta.at(-1)?.from === "santa";
  return (
    <>
      <Segmented
        label={t("tabPerson")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "person", label: t("tabPerson") },
          {
            value: "mine",
            label: (
              <span className="inline-flex items-center gap-1.5">
                {t("tabMine")}
                {unread && <span className="size-2 rounded-full bg-santa" aria-label={t("santaTitle")} />}
              </span>
            ),
          },
        ]}
      />
      {tab === "person" ? <PersonTab view={view} act={act} budget={budget} /> : <MineTab view={view} act={act} members={members} />}
      <WhoIsIn members={members} meId={view.me.id} joined={joined} />
      <div className="flex flex-wrap justify-center">
        <button type="button" className="btn-ghost text-[15px]" onClick={() => setRenaming(true)}>
          <Pencil size={16} {...ICON} aria-hidden />
          {t("changeName")}
        </button>
        <button type="button" className="btn-ghost text-[15px]" onClick={signOut}>
          {t("signOut", { name: view.me.name })}
        </button>
      </div>
      {renaming && <RenameSheet name={view.me.name} act={act} onClose={() => setRenaming(false)} />}
    </>
  );
}

/** Fixing your own name. Everyone sees the new one, your Santa included; nothing else changes. */
function RenameSheet({ name, act, onClose }: { name: string; act: (a: MeAction, onError?: (e: ActError) => void) => Promise<boolean>; onClose: () => void }) {
  const t = useT();
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const next = value.trim();
  async function save() {
    if (next === name) return onClose();
    setBusy(true);
    setError("");
    const ok = await act({ type: "rename", name: next }, (e) => setError(errorText(t, e)));
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <Sheet open onClose={onClose} title={t("changeName")} confirmForm="rename" confirmLabel={t("save")} confirmDisabled={!next || busy}>
      <form
        id="rename"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <p className="text-[15px] leading-snug text-ink-2">{t("changeNameHint")}</p>
        <input className="input" maxLength={40} autoComplete="given-name" value={value} aria-label={t("yourName")} placeholder={t("yourName")} onChange={(e) => setValue(e.target.value)} />
        {error && <Callout tone="error">{error}</Callout>}
      </form>
    </Sheet>
  );
}

/** Everyone in the group, by name. The join page lists them anyway; never who drew whom. */
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

/** A person as a small paper gift tag, punched at one end and a little off true. Yours is the red one. */
function NameTag({ name, index, me, children }: { name: string; index: number; me?: boolean; children?: React.ReactNode }) {
  return (
    <span
      className={cx(
        "flex max-w-full items-center gap-2 rounded-r-lg rounded-l-[14px] border-[1.5px] py-1.5 pr-3.5 pl-2 text-[15px] shadow-[0_3px_6px_rgb(0_0_0/0.14)]",
        me ? "border-transparent bg-[var(--santa)] text-[var(--paper-light)]" : "border-[rgb(44_40_37/0.25)] bg-[var(--paper-light)] text-[#2c2825]",
        TILTS[index % TILTS.length],
      )}
    >
      <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full ring-[1.5px]", me ? "bg-[var(--santa-deep)] ring-[var(--ribbon)]" : "bg-[var(--paper)] ring-[rgb(44_40_37/0.35)]")} />
      <span className="min-w-0 truncate font-medium">{name}</span>
      {children}
    </span>
  );
}

function WhoIsIn({ members, meId, joined }: { members: PublicGroup["members"]; meId: string; joined: string | null }) {
  const t = useT();
  // Your tag, just after joining, and anyone who joins while you're here drop in.
  const tags = useArrivals<HTMLUListElement>(members.map((m) => m.id), "drop-in", joined);
  return (
    <Section
      title={t("whosIn")}
      action={<span className="pb-1 font-serif text-[15px] text-ink-2">{t(members.length === 1 ? "countPerson" : "countPeople", { n: members.length })}</span>}
    >
      <ul ref={tags.ref} className="card flex flex-wrap justify-center gap-x-2.5 gap-y-3 px-4 py-5">
        {members.map((m, i) => {
          const me = m.id === meId;
          return (
            <li key={m.id} className={cx("max-w-full", tags.arrive(m.id))}>
              <NameTag name={m.name} index={i} me={me}>
                {me && <span className="shrink-0 font-label text-[12px] opacity-85">{t("you").toLowerCase()}</span>}
              </NameTag>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** The gift stays wrapped on every visit, so the name is never on screen by surprise. */
function PersonTab({ view, act, budget }: { view: MemberView; act: (a: MeAction) => Promise<boolean>; budget: number | null }) {
  const t = useT();
  const [stage, setStage] = useState<"wrapped" | "shake" | "open">("wrapped");

  if (!view.person) {
    return (
      <div className="space-y-3 pt-4 text-center">
        <GiftBox />
        <p className="font-script text-[44px] leading-tight text-gold">{t("waitingTitle")}</p>
        <p className="card tilt-r px-4 py-3 text-[15px] leading-snug">{t("waitingBody", { n: view.joined })}</p>
      </div>
    );
  }
  const person = view.person;

  function unwrap() {
    if (stage !== "wrapped") return;
    setStage("shake");
    setTimeout(() => setStage("open"), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
    act({ type: "open" });
  }

  if (stage !== "open") {
    return (
      <>
        {view.redrawn && <Callout tone="warn">{t("redrawn")}</Callout>}
        <button type="button" className="block w-full space-y-3 px-6 pt-4 pb-2 text-center" onClick={unwrap}>
          <GiftBox state={stage === "shake" ? "shake" : "idle"} />
          <span className="block">
            <span className="block font-script text-[44px] leading-tight text-gold">{t("tapToUnwrap")}</span>
            <span className="mt-2 inline-flex items-center gap-2 text-[15px] text-cream/85">
              <EyeOff size={17} {...ICON} className="shrink-0 text-gold" />
              {t("unwrapHint")}
            </span>
          </span>
        </button>
      </>
    );
  }

  return (
    <>
      <Fall kind="confetti" />
      <section className="relative pt-4 pb-2">
        <div className="pointer-events-none absolute inset-x-0 top-0">
          <GiftBox state="open" />
        </div>
        <GiftTag lead={t("youDrew")} name={person.name} foot={t("keepSecret")} />
      </section>

      {(person.about.likes || person.about.sizes || person.about.avoid) && (
        <Section title={t("aboutOf", { name: person.name })} sticker="mitten">
          <dl className="card rows taped tilt-r nudge-r relative">
            {(
              [
                ["likesLabel", person.about.likes],
                ["sizesLabel", person.about.sizes],
                ["avoidLabel", person.about.avoid],
              ] as const
            ).map(
              ([label, value]) =>
                value && (
                  <div key={label} className="flex gap-3 px-5 py-3">
                    <dt className="w-20 shrink-0 text-[15px] text-ink-2">{t(label)}</dt>
                    <dd className="min-w-0 break-words">{value}</dd>
                  </div>
                ),
            )}
          </dl>
        </Section>
      )}

      <Section title={t("theirWishes", { name: person.name })} sticker="stocking">
        {person.wishes.length ? (
          <ul className="card rows">
            {person.wishes.map((w) => (
              <WishRow key={w.id} wish={w} />
            ))}
          </ul>
        ) : (
          <p className="card flex items-center gap-3 px-5 py-4 text-[15px] text-ink-2">
            <Sticker name="stocking" size={44} className="-rotate-6" />
            {t("noWishes", { name: person.name })}
          </p>
        )}
      </Section>

      <GiftSearch likes={person.about.likes} budget={budget} />

      <Chat
        title={t("askTitle", { name: person.name })}
        hint={t("askHint")}
        messages={view.withPerson}
        mine="santa"
        theirLabel={person.name}
        placeholder={t("askPlaceholder")}
        onSend={(text) => act({ type: "ask", text })}
      />
    </>
  );
}

function MineTab({ view, act, members }: { view: MemberView; act: (a: MeAction) => Promise<boolean>; members: PublicGroup["members"] }) {
  const t = useT();
  const [editing, setEditing] = useState<WishItem | "new" | null>(null);
  // The wish just saved shows a tick for a moment; a new one slips onto the list as well.
  const [ticked, setTicked] = useState<string | null>(null);
  const wishes = view.me.wishes;
  const rows = useArrivals<HTMLUListElement>(wishes.map((w) => w.id), "slip-in");

  async function save(wish: WishItem) {
    const next = wishes.some((w) => w.id === wish.id) ? wishes.map((w) => (w.id === wish.id ? wish : w)) : [...wishes, wish];
    setEditing(null);
    if (!(await act({ type: "wishes", wishes: next }))) return;
    setTicked(wish.id);
    setTimeout(() => setTicked((id) => (id === wish.id ? null : id)), 1800);
  }

  return (
    <>
      <Section
        title={t("myWishesTitle")}
        action={
          <button type="button" className="chip min-h-9 shrink-0 whitespace-nowrap" disabled={wishes.length >= 30} onClick={() => setEditing("new")}>
            <Plus size={16} {...ICON} aria-hidden />
            {t("addWish")}
          </button>
        }
      >
        {wishes.length ? (
          <ul ref={rows.ref} className="card rows taped relative">
            <li className="px-5 pt-4 pb-3 text-[14px] text-ink-2">{t("myWishesHint")}</li>
            {wishes.map((w) => (
              <WishRow
                key={w.id}
                wish={w}
                className={rows.arrive(w.id)}
                ticked={ticked === w.id}
                actions={
                  <>
                    <button type="button" className="icon-plain" aria-label={t("editWish")} onClick={() => setEditing(w)}>
                      <Pencil size={18} {...ICON} aria-hidden />
                    </button>
                    <button type="button" className="icon-plain" aria-label={t("remove")} onClick={() => act({ type: "wishes", wishes: wishes.filter((x) => x.id !== w.id) })}>
                      <Trash2 size={18} {...ICON} aria-hidden />
                    </button>
                  </>
                }
              />
            ))}
          </ul>
        ) : (
          <p className="card flex items-center gap-3 px-5 py-4 text-[15px] text-ink-2">
            <Sticker name="gift" size={44} className="-rotate-6" />
            <span>
              {t("myWishesHint")} {t("noMyWishes")}
            </span>
          </p>
        )}
      </Section>

      {view.person && <GuessForm view={view} members={members} act={act} />}

      <AboutForm about={view.me.about} onSave={(about) => act({ type: "about", about })} />

      <Chat title={t("santaTitle")} hint={t("santaHint")} messages={view.withSanta} mine="person" theirLabel={t("yourSanta")} placeholder={t("replyPlaceholder")} empty={t("santaEmpty")} onSend={(text) => act({ type: "reply", text })} />

      {editing && <WishSheet wish={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  );
}

// ---------- Getting to know your person ----------------------------------------------

function GuessForm({ view, members, act }: { view: MemberView; members: PublicGroup["members"]; act: (a: MeAction) => Promise<boolean> }) {
  const t = useT();
  const [choice, setChoice] = useState(view.myGuess ?? "");
  const [saved, setSaved] = useState(false);
  const closed = view.guesses !== null;
  const changed = choice !== (view.myGuess ?? "");
  return (
    <Section title={t("guessTitle")} sticker="question">
      <form
        className="card tilt-r relative space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ type: "guess", target: choice || null })) setSaved(true);
        }}
      >
        <p className="px-1 text-[14px] leading-snug text-ink-2">{closed ? t("guessLocked") : t("guessHint")}</p>
        <Choice
          value={choice}
          disabled={closed}
          label={t("guessTitle")}
          placeholder={t("guessPick")}
          options={[
            { value: "", label: t("guessPick") },
            ...members.filter((m) => m.id !== view.me.id).map((m) => ({ value: m.id, label: m.name })),
          ]}
          onChange={(v) => {
            setSaved(false);
            setChoice(v);
          }}
        />
        {!closed && (
          <button type="submit" className="btn-green h-12 w-full" disabled={!changed}>
            {saved && !changed && <Check size={20} {...ICON} aria-hidden />}
            {saved && !changed ? t("saved") : t("guessSave")}
          </button>
        )}
      </form>
    </Section>
  );
}

function AboutForm({ about, onSave }: { about: AboutMe; onSave: (a: AboutMe) => Promise<boolean> }) {
  const t = useT();
  const [value, setValue] = useState(about);
  const [saved, setSaved] = useState(false);
  const changed = value.likes !== about.likes || value.sizes !== about.sizes || value.avoid !== about.avoid;
  const field = (key: keyof AboutMe, placeholder: string, max: number) => (
    <input
      className="input"
      maxLength={max}
      value={value[key]}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => {
        setSaved(false);
        setValue({ ...value, [key]: e.target.value });
      }}
    />
  );
  return (
    <Section title={t("aboutTitle")} sticker="mitten">
      <form
        className="card tilt-l space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await onSave({ likes: value.likes.trim(), sizes: value.sizes.trim(), avoid: value.avoid.trim() })) setSaved(true);
        }}
      >
        <p className="px-1 text-[13px] leading-snug text-ink-2">{t("aboutHint")}</p>
        {field("likes", t("aboutLikes"), 200)}
        {field("sizes", t("aboutSizes"), 120)}
        {field("avoid", t("aboutAvoid"), 200)}
        <button type="submit" className="btn-secondary h-12 w-full" disabled={!changed}>
          {saved && !changed && <Check size={20} {...ICON} aria-hidden />}
          {saved && !changed ? t("saved") : t("save")}
        </button>
      </form>
    </Section>
  );
}

/** Opens each shop's own search, starting from the first thing the person says they like. */
function GiftSearch({ likes, budget }: { likes: string; budget: number | null }) {
  const t = useT();
  const [query, setQuery] = useState(likes.split(/[,\n]/)[0].trim() || t("giftWord"));
  const q = encodeURIComponent(query.trim());
  const shops: [Shop, string][] = [
    ["shopee", `https://shopee.co.th/search?keyword=${q}`],
    ["lazada", `https://www.lazada.co.th/catalog/?q=${q}`],
    ["tiktok", `https://www.tiktok.com/search?q=${q}`],
    ["taobao", `https://s.taobao.com/search?q=${q}`],
    ["aliexpress", `https://www.aliexpress.com/wholesale?SearchText=${q}`],
    ["temu", `https://www.temu.com/search_result.html?search_key=${q}`],
  ];
  return (
    <Section title={t("findGift")} sticker="palette">
      <div className="card tilt-r nudge-r space-y-3 p-4">
        <p className="px-1 text-[13px] text-ink-2">{budget !== null ? t("findGiftHint", { budget: baht(budget) }) : t("findGiftHintNoBudget")}</p>
        <input className="input" maxLength={60} value={query} aria-label={t("searchWord")} onChange={(e) => setQuery(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          {shops.map(([shop, url]) => (
            <a key={shop} href={url} target="_blank" rel="noreferrer noopener" className="btn-secondary h-11 gap-1.5 !px-3 text-[15px]">
              <Search size={15} {...ICON} aria-hidden className="shrink-0" />
              <span className="truncate">{SHOP_LABEL[shop]}</span>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ---------- Wishes ------------------------------------------------------------------

/** Where a link really goes: the same plain globe and site name for every link, a big shop's or not. */
function SiteName({ site }: { site: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-[14px] text-ink-2">
      <Globe size={14} {...ICON} aria-hidden className="shrink-0" />
      <span className="truncate">{site}</span>
    </span>
  );
}

function WishRow({
  wish,
  actions,
  className,
  ticked,
}: {
  wish: WishItem & { shopPrice?: ShopPrice | null };
  actions?: React.ReactNode;
  className?: string;
  ticked?: boolean;
}) {
  const t = useT();
  // Checked again on the way out: never render a stored link we wouldn't accept.
  const url = wish.url && safeUrl(wish.url);
  const shop = url ? shopOf(url) : null;
  const site = url ? siteOf(url) : null;
  return (
    <li className={cx("flex items-start gap-1 py-3.5 pr-2 pl-5", className)}>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium break-words">
          {wish.title}
          {ticked && (
            <span className="saved-tick ml-2 inline-grid size-6 place-items-center rounded-full bg-accent align-[-5px] text-accent-ink" aria-hidden>
              <Check size={15} strokeWidth={3} />
            </span>
          )}
        </p>
        {site && <SiteName site={site} />}
        {/* Read from the shop's own page by the server, never typed in. */}
        {wish.shopPrice && site && (
          <p className="tnum font-label text-[16px]">{t("priceAt", { price: formatPrice(wish.shopPrice), shop: shop ? SHOP_LABEL[shop] : site })}</p>
        )}
        {wish.note && <p className="text-[15px] leading-snug break-words text-ink-2">{wish.note}</p>}
        {url && (
          <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-accent-strong">
            <ExternalLink size={16} {...ICON} aria-hidden />
            {shop ? t("openIn", { shop: SHOP_LABEL[shop] }) : t("openLink")}
          </a>
        )}
      </div>
      {actions}
    </li>
  );
}

function WishSheet({ wish, onClose, onSave }: { wish: WishItem | null; onClose: () => void; onSave: (w: WishItem) => void }) {
  const t = useT();
  const [link, setLink] = useState(wish?.url ?? "");
  const [url, setUrl] = useState<string | null>(wish?.url ?? null);
  const [title, setTitle] = useState(wish?.title ?? "");
  const [note, setNote] = useState(wish?.note ?? "");
  const site = url ? siteOf(url) : null;
  const badLink = link.trim() !== "" && !url;

  function onLink(text: string) {
    const parsed = parseShopPaste(text);
    setUrl(parsed?.url ?? null);
    setLink(parsed?.url ?? text);
    if (parsed?.title && !title.trim()) setTitle(parsed.title.slice(0, 120));
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={wish ? t("editWish") : t("addWish")}
      confirmDisabled={!title.trim() || badLink}
      onConfirm={() =>
        onSave({
          id: wish?.id ?? crypto.randomUUID().slice(0, 12),
          title: title.trim(),
          url,
          note: note.trim(),
        })
      }
    >
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="label block px-3 leading-snug">{t("pasteLink")}</span>
          <input className="input" inputMode="url" autoComplete="off" value={link} placeholder="https://" onChange={(e) => onLink(e.target.value)} />
        </label>
        <div className="flex min-h-6 items-center gap-2 px-3 text-[13px] leading-snug text-ink-2">
          {badLink ? <span className="text-danger">{t("badLink")}</span> : site ? <SiteName site={site} /> : t("pasteLinkHint")}
        </div>
        <input className="input" maxLength={120} value={title} placeholder={t("wishTitle")} aria-label={t("wishTitle")} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" maxLength={200} value={note} placeholder={t("wishNote")} aria-label={t("wishNote")} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Sheet>
  );
}

// ---------- Anonymous chat -------------------------------------------------------------

/** A sealed paper envelope that grows out of the send button and flies off, then is gone. */
function Envelope() {
  const [flying, setFlying] = useState(true);
  if (!flying) return null;
  return (
    <svg viewBox="0 0 48 34" width="46" height="33" aria-hidden className="envelope-fly" onAnimationEnd={() => setFlying(false)}>
      <rect x="2" y="2" width="44" height="30" rx="4" fill="var(--paper-light)" stroke="var(--sticker)" strokeWidth="3" />
      <path d="M4 5l20 15L44 5" fill="none" stroke="#2c2825" strokeOpacity=".35" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="19" r="5" fill="var(--santa)" />
    </svg>
  );
}

function Chat({
  title,
  hint,
  messages,
  mine,
  theirLabel,
  placeholder,
  empty,
  onSend,
}: {
  title: string;
  hint: string;
  messages: Msg[];
  mine: Msg["from"];
  theirLabel: string;
  placeholder: string;
  empty?: string;
  onSend: (text: string) => Promise<boolean>;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  // Each sent message folds into an envelope that flies off; the number keys a fresh one per send.
  const [sent, setSent] = useState(0);
  const bubbles = useArrivals<HTMLUListElement>(messages.map((_, i) => String(i)), "msg-in");

  async function send() {
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    if (await onSend(value)) {
      setText("");
      setSent((n) => n + 1);
    }
    setBusy(false);
  }

  return (
    <Section title={title}>
      <div className="card relative space-y-3 p-4">
        <GiftBox state="still" size={54} className="pin-sticker" />
        <p className="px-1 pr-12 text-[14px] leading-snug text-ink-2">{hint}</p>
        {messages.length === 0 && empty && <p className="px-1 text-[15px] text-ink-2">{empty}</p>}
        {messages.length > 0 && (
          <ul ref={bubbles.ref} className="space-y-2">
            {messages.map((m, i) => (
              <li key={i} className={cx("flex flex-col", m.from === mine ? "items-end" : "items-start", bubbles.arrive(String(i)))}>
                <span className="px-3 pb-0.5 text-[13px] text-ink-2">{m.from === mine ? t("you") : theirLabel}</span>
                <span className={cx("max-w-[85%] rounded-xl px-4 py-2 leading-snug break-words whitespace-pre-wrap", m.from === mine ? "bg-accent text-accent-ink" : "tag text-ink")}>{m.text}</span>
              </li>
            ))}
          </ul>
        )}
        <form
          className="relative flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input className="input" maxLength={500} value={text} placeholder={placeholder} aria-label={placeholder} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="press grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label={t("send")} disabled={busy || !text.trim()}>
            <Send size={20} {...ICON} aria-hidden />
          </button>
          {sent > 0 && <Envelope key={sent} />}
        </form>
      </div>
    </Section>
  );
}
