// zod/mini: the same checks as zod's usual chained API, written as functions, so the routes that check a
// request load a fraction of the library on a cold start (the first tap after a quiet spell).
import * as z from "zod/mini";
import { safeUrl } from "./shop";

const text = (max: number) => z.string().check(z.trim(), z.maxLength(max));
const id = (max = 40) => z.string().check(z.maxLength(max));

export const Person = z.object({ id: z.string().check(z.minLength(1), z.maxLength(40)), name: text(40).check(z.minLength(1)) });
const Pair = z.tuple([id(), id()]);

export const People = z.object({
  people: z.array(Person).check(z.maxLength(50)),
  pairs: z.array(Pair).check(z.maxLength(200)),
});

export const Details = z.object({
  name: text(60).check(z.minLength(1)),
  budget: z.nullable(z.int().check(z.gte(0), z.lte(10_000_000))),
  date: z.nullable(z.iso.date()),
  note: text(400),
});

/** The organiser's phone: a random id it keeps, so the group's key only works there. */
const Device = id(40).check(z.minLength(16));

export const CreateBody = z.object({ ...Details.shape, device: Device });

export const Pin = z.string().check(z.regex(/^\d{4}$/));

export const JoinBody = z.object({ name: text(40).check(z.minLength(1)), pin: Pin });

export const ClaimBody = z.object({ memberId: id(), pin: Pin });

// No price: anyone could type any number, and the shops don't let a server read the real one, so the
// Santa checks it at the link. A price from an older page is dropped, as unknown keys are.
export const Wish = z.object({
  id: id(),
  title: text(120).check(z.minLength(1)),
  url: z.nullable(text(2000)).check(z.refine((u) => u === null || safeUrl(u) !== null)),
  note: text(200),
});
export type WishItem = z.infer<typeof Wish>;

export const About = z.object({ likes: text(200), sizes: text(120), avoid: text(200) });
export type AboutMe = z.infer<typeof About>;

const Message = text(500).check(z.minLength(1));

export const MeBody = z.object({
  memberId: id(),
  token: id(100),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("load") }),
    z.object({ type: z.literal("open") }),
    z.object({ type: z.literal("wishes"), wishes: z.array(Wish).check(z.maxLength(30)) }),
    z.object({ type: z.literal("about"), about: About }),
    /** Who this person thinks their Santa is. */
    z.object({ type: z.literal("guess"), target: z.nullable(id()) }),
    /** Santa writing to the person they drew. */
    z.object({ type: z.literal("ask"), text: Message }),
    /** The person replying to their unknown Santa. */
    z.object({ type: z.literal("reply"), text: Message }),
    /** Fixing your own name, e.g. a typo or a nickname. */
    z.object({ type: z.literal("rename"), name: text(40).check(z.minLength(1)) }),
  ]),
});

export const AdminBody = z.object({
  key: id(100),
  device: Device,
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("status") }),
    z.object({ type: z.literal("details"), ...Details.shape }),
    /** `seen` is the list the organiser's sheet opened with, so a save changes only what they changed. */
    z.object({ type: z.literal("people"), ...People.shape, seen: z.optional(People.shape.people) }),
    z.object({ type: z.literal("resetPin"), memberId: id() }),
    /** The same group, freshly drawn: for next year. */
    z.object({ type: z.literal("draw") }),
    z.object({ type: z.literal("newRound") }),
    /** Closes guessing and shows who guessed right. */
    z.object({ type: z.literal("revealGuesses") }),
    z.object({ type: z.literal("delete") }),
  ]),
});
