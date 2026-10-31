"use client";

import { Check, ExternalLink, Gift, Lock, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, baht, errorText, getSession, rememberGroup, setSession, type Session } from "@/lib/client/store";
import { useT } from "@/lib/i18n";
import type { AboutMe, WishItem } from "@/lib/schema";
import type { MeAction, MemberView, Msg, PublicGroup } from "@/lib/server/groups";
import { parseShopPaste, safeUrl, SHOP_LABEL, shopOf, type Shop } from "@/lib/shop";
import { Countdown, Fall, GiftBox, GroupFacts, GiftTag, GuessResults } from "./Festive";
import { Callout, cx, ICON, Section, Segmented, Sheet } from "./ui";

export function MemberApp({ id, initial }: { id: string; initial: PublicGroup }) {
  const t = useT();
  const [group, setGroup] = useState(initial);
  const [session, setSess] = useState<Session | null>(null);
  const [view, setView] = useState<MemberView | null>(null);
  const [ready, setReady] = useState(false);

  const signOut = useCallback(() => {
    setSession(id, null);
    setSess(null);
    setView(null);
    api<PublicGroup>(`/api/g/${id}`).then((r) => r.ok && setGroup(r.data));
  }, [id]);

  const act = useCallback(
    async (s: Session, action: MeAction) => {
      const res = await api<MemberView>(`/api/g/${id}/me`, { ...s, action });
      if (res.ok) setView(res.data);
      else if (res.error === "signed_out") signOut();
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

  // New people, the draw and new messages all show up without a reload.
  useEffect(() => {
    const i = setInterval(() => {
      if (document.hidden) return;
      api<PublicGroup>(`/api/g/${id}`).then((r) => r.ok && setGroup(r.data));
      if (session) act(session, { type: "load" });
    }, 20000);
    return () => clearInterval(i);
  }, [id, session, act]);

  return (
    <>
      <header className="space-y-3 px-1 pt-2 text-center">
        <h1 className="large-title break-words">{group.name}</h1>
        <GroupFacts budget={group.budget} date={group.date} />
      </header>
      {group.date && <Countdown date={group.date} />}
      {group.note && <p className="card px-5 py-4 text-[15px] leading-snug whitespace-pre-wrap">{group.note}</p>}

      {(view?.guesses ?? group.guesses) && <GuessResults results={(view?.guesses ?? group.guesses)!} />}

      {!ready || (session && !view) ? (
        <p className="py-10 text-center text-ink-2">{t("loading")}</p>
      ) : session && view ? (
        <Signedin view={view} act={(a) => act(session, a)} signOut={signOut} budget={group.budget} members={group.members} />
      ) : (
        <Picker
          id={id}
          group={group}
          onSession={(s) => {
            setSession(id, s);
            setSess(s);
            act(s, { type: "load" });
            api<PublicGroup>(`/api/g/${id}`).then((r) => r.ok && setGroup(r.data));
          }}
        />
      )}
    </>
  );
}

// ---------- Picking your name ----------------------------------------------------

function Picker({ id, group, onSession }: { id: string; group: PublicGroup; onSession: (s: Session) => void }) {
  const t = useT();
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [picked, setPicked] = useState<PublicGroup["members"][number] | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  // The sheet focuses itself on open, so move on to the field straight after.
  useEffect(() => {
    if (picked) pinRef.current?.focus();
  }, [picked]);

  async function joinGroup() {
    setJoining(true);
    setJoinError("");
    const res = await api<{ memberId: string; token: string }>(`/api/g/${id}/join`, { name: newName.trim(), pin: newPin });
    setJoining(false);
    if (res.ok) onSession(res.data);
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
        <Section title={t("joinTitle")}>
          <form
            className="card space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              joinGroup();
            }}
          >
            <p className="px-1 text-[14px] leading-snug text-ink-2">{t("joinHint")}</p>
            <input className="input" maxLength={40} autoComplete="given-name" value={newName} placeholder={t("yourName")} aria-label={t("yourName")} onChange={(e) => setNewName(e.target.value)} />
            <input
              className="input tnum text-center text-[24px] tracking-[0.4em] placeholder:text-[17px] placeholder:tracking-normal"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={newPin}
              placeholder={t("pin")}
              aria-label={t("pin")}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
            />
            {joinError && <Callout tone="error">{joinError}</Callout>}
            <button type="submit" className="btn-primary h-14 w-full text-[20px]" disabled={!newName.trim() || newPin.length !== 4 || joining}>
              {joining ? t("joining") : t("joinButton")}
            </button>
          </form>
        </Section>
      )}

      {group.members.length > 0 && (
      <Section title={group.drawn ? t("whoAreYou") : t("alreadyJoined")}>
        <ul className="card rows">
          <li className="px-5 py-3 font-serif text-[15px]">{t("whoAreYouSub")}</li>
          {group.members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex min-h-13 w-full items-center gap-3 px-5 py-2 text-left hover:bg-[var(--hover)]"
                onClick={() => {
                  setPicked(m);
                  setPin("");
                  setError("");
                }}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                {m.resets > 0 && <span className="shrink-0 rounded-md bg-warn-soft px-2.5 py-0.5 text-[13px] text-warn">{t("pinResetBadge", { n: m.resets })}</span>}
                {m.claimed && (
                  <span className="flex shrink-0 items-center gap-1 text-[13px] text-ink-2">
                    <Lock size={14} {...ICON} aria-hidden /> {t("pinTaken")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
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
          <input
            ref={pinRef}
            className="input tnum text-center text-[28px] tracking-[0.5em]"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            aria-label={t("pin")}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
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
}: {
  view: MemberView;
  act: (a: MeAction) => Promise<boolean>;
  signOut: () => void;
  budget: number | null;
  members: PublicGroup["members"];
}) {
  const t = useT();
  const [tab, setTab] = useState<"person" | "mine">("person");
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
      <div className="text-center">
        <button type="button" className="btn-ghost text-[15px]" onClick={signOut}>
          {t("signOut", { name: view.me.name })}
        </button>
      </div>
    </>
  );
}

/** The gift stays wrapped on every visit, so the name is never on screen by surprise. */
function PersonTab({ view, act, budget }: { view: MemberView; act: (a: MeAction) => Promise<boolean>; budget: number | null }) {
  const t = useT();
  const [stage, setStage] = useState<"wrapped" | "shake" | "open">("wrapped");

  if (!view.person) {
    return (
      <div className="space-y-3 pt-4 text-center">
        <Fall kind="snow" />
        <GiftBox />
        <p className="font-script text-[42px] leading-tight text-gold">{t("waitingTitle")}</p>
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
        <Fall kind="snow" />
        {view.redrawn && <Callout tone="warn">{t("redrawn")}</Callout>}
        <button type="button" className="block w-full space-y-3 px-6 pt-4 pb-2 text-center" onClick={unwrap}>
          <GiftBox state={stage === "shake" ? "shake" : "idle"} />
          <span className="block">
            <span className="block font-script text-[42px] leading-tight text-gold">{t("tapToUnwrap")}</span>
            <span className="card tilt-r mt-3 block px-4 py-2.5 text-[15px]">{t("unwrapHint")}</span>
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

      <button
        type="button"
        role="checkbox"
        aria-checked={view.giftReady}
        className="card tilt-l nudge-l flex w-[calc(100%-10px)] items-center gap-3 px-5 py-3.5 text-left"
        onClick={() => act({ type: "giftReady", ready: !view.giftReady })}
      >
        <span className={cx("grid size-7 shrink-0 place-items-center rounded-full", view.giftReady ? "bg-accent text-accent-ink" : "bg-field text-ink-2")} aria-hidden>
          {view.giftReady ? <Check size={16} {...ICON} /> : <Gift size={15} {...ICON} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{t("giftReadyAsk")}</span>
          <span className="block text-[14px] leading-snug text-ink-2">{t("giftReadyHint")}</span>
        </span>
      </button>

      {(person.about.likes || person.about.sizes || person.about.avoid) && (
        <Section title={t("aboutOf", { name: person.name })}>
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

      <Section title={t("theirWishes", { name: person.name })}>
        {person.wishes.length ? (
          <ul className="card rows">
            {person.wishes.map((w) => (
              <WishRow key={w.id} wish={w} />
            ))}
          </ul>
        ) : (
          <p className="card px-5 py-4 text-[15px] text-ink-2">{t("noWishes", { name: person.name })}</p>
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
  const wishes = view.me.wishes;

  function save(wish: WishItem) {
    const next = wishes.some((w) => w.id === wish.id) ? wishes.map((w) => (w.id === wish.id ? wish : w)) : [...wishes, wish];
    setEditing(null);
    return act({ type: "wishes", wishes: next });
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
          <ul className="card rows taped relative">
            <li className="px-5 pt-4 pb-3 text-[14px] text-ink-2">{t("myWishesHint")}</li>
            {wishes.map((w) => (
              <WishRow
                key={w.id}
                wish={w}
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
          <p className="card px-5 py-4 text-[15px] text-ink-2">
            {t("myWishesHint")} {t("noMyWishes")}
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
    <Section title={t("guessTitle")}>
      <form
        className="card tilt-r relative space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act({ type: "guess", target: choice || null })) setSaved(true);
        }}
      >
        <p className="px-1 text-[14px] leading-snug text-ink-2">{closed ? t("guessLocked") : t("guessHint")}</p>
        <select
          className="input"
          value={choice}
          disabled={closed}
          aria-label={t("guessTitle")}
          onChange={(e) => {
            setSaved(false);
            setChoice(e.target.value);
          }}
        >
          <option value="">{t("guessPick")}</option>
          {members
            .filter((m) => m.id !== view.me.id)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
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
    <Section title={t("aboutTitle")}>
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
  ];
  return (
    <Section title={t("findGift")}>
      <div className="card tilt-r nudge-r space-y-3 p-4">
        <p className="px-1 text-[13px] text-ink-2">{budget !== null ? t("findGiftHint", { budget: baht(budget) }) : t("findGiftHintNoBudget")}</p>
        <input className="input" maxLength={60} value={query} aria-label={t("searchWord")} onChange={(e) => setQuery(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          {shops.map(([shop, url]) => (
            <a key={shop} href={url} target="_blank" rel="noreferrer noopener" className="btn-secondary h-11 gap-1.5 px-2 text-[13px]">
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

const SHOP_STYLE: Record<Shop, string> = {
  shopee: "bg-[#ee4d2d] text-white",
  lazada: "bg-[#1a1a7a] text-white",
  tiktok: "bg-[#111] text-white ring-1 ring-white/20",
};

function ShopBadge({ shop }: { shop: Shop }) {
  return <span className={cx("inline-block shrink-0 rounded-md px-2.5 py-0.5 text-[13px] font-semibold", SHOP_STYLE[shop])}>{SHOP_LABEL[shop]}</span>;
}

function WishRow({ wish, actions }: { wish: WishItem; actions?: React.ReactNode }) {
  const t = useT();
  // Checked again on the way out: never render a stored link we wouldn't accept.
  const url = wish.url && safeUrl(wish.url);
  const shop = url ? shopOf(url) : null;
  return (
    <li className="flex items-start gap-1 py-3.5 pr-2 pl-5">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium break-words">{wish.title}</p>
        <div className="flex flex-wrap items-center gap-2 text-[15px] text-ink-2">
          {shop && <ShopBadge shop={shop} />}
          {wish.price !== null && <span className="tnum">{baht(wish.price)}</span>}
        </div>
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
  const [price, setPrice] = useState(wish?.price == null ? "" : String(wish.price));
  const [note, setNote] = useState(wish?.note ?? "");
  const shop = url ? shopOf(url) : null;
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
          price: price ? Number(price) : null,
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
          {shop && <ShopBadge shop={shop} />}
          {badLink ? <span className="text-danger">{t("badLink")}</span> : !shop && t("pasteLinkHint")}
        </div>
        <input className="input" maxLength={120} value={title} placeholder={t("wishTitle")} aria-label={t("wishTitle")} onChange={(e) => setTitle(e.target.value)} />
        <input className="input tnum" inputMode="numeric" value={price} placeholder={t("wishPrice")} aria-label={t("wishPrice")} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 8))} />
        <input className="input" maxLength={200} value={note} placeholder={t("wishNote")} aria-label={t("wishNote")} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Sheet>
  );
}

// ---------- Anonymous chat -------------------------------------------------------------

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

  async function send() {
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    if (await onSend(value)) setText("");
    setBusy(false);
  }

  return (
    <Section
      title={title}
    >
      <div className="card relative space-y-3 p-4">
        <GiftBox state="still" size={54} className="pin-sticker" />
        <p className="px-1 pr-12 text-[14px] leading-snug text-ink-2">{hint}</p>
        {messages.length === 0 && empty && <p className="px-1 text-[15px] text-ink-2">{empty}</p>}
        {messages.length > 0 && (
          <ul className="space-y-2">
            {messages.map((m, i) => (
              <li key={i} className={cx("flex flex-col", m.from === mine ? "items-end" : "items-start")}>
                <span className="px-3 pb-0.5 text-[13px] text-ink-2">{m.from === mine ? t("you") : theirLabel}</span>
                <span className={cx("max-w-[85%] rounded-xl px-4 py-2 leading-snug break-words whitespace-pre-wrap", m.from === mine ? "bg-accent text-accent-ink" : "tag text-ink")}>{m.text}</span>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input className="input" maxLength={500} value={text} placeholder={placeholder} aria-label={placeholder} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="press grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label={t("send")} disabled={busy || !text.trim()}>
            <Send size={20} {...ICON} aria-hidden />
          </button>
        </form>
      </div>
    </Section>
  );
}
