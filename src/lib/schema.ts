import { z } from "zod";
import { safeUrl } from "./shop";

const text = (max: number) => z.string().trim().max(max);

export const Person = z.object({ id: z.string().min(1).max(40), name: text(40).min(1) });
const Pair = z.tuple([z.string().max(40), z.string().max(40)]);

export const People = z.object({
  people: z.array(Person).max(50),
  pairs: z.array(Pair).max(200),
});

export const Details = z.object({
  name: text(60).min(1),
  budget: z.number().int().min(0).max(10_000_000).nullable(),
  date: z.iso.date().nullable(),
  note: text(400),
});

export const CreateBody = Details;

export const Pin = z.string().regex(/^\d{4}$/);

export const JoinBody = z.object({ name: text(40).min(1), pin: Pin });

export const ClaimBody = z.object({ memberId: z.string().max(40), pin: Pin });

export const Wish = z.object({
  id: z.string().max(40),
  title: text(120).min(1),
  url: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .refine((u) => u === null || safeUrl(u) !== null),
  price: z.number().int().min(0).max(10_000_000).nullable(),
  note: text(200),
});
export type WishItem = z.infer<typeof Wish>;

export const About = z.object({ likes: text(200), sizes: text(120), avoid: text(200) });
export type AboutMe = z.infer<typeof About>;

const Message = text(500).min(1);

export const MeBody = z.object({
  memberId: z.string().max(40),
  token: z.string().max(100),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("load") }),
    z.object({ type: z.literal("open") }),
    z.object({ type: z.literal("wishes"), wishes: z.array(Wish).max(30) }),
    z.object({ type: z.literal("about"), about: About }),
    /** Who this person thinks their Santa is. */
    z.object({ type: z.literal("guess"), target: z.string().max(40).nullable() }),
    /** Santa writing to the person they drew. */
    z.object({ type: z.literal("ask"), text: Message }),
    /** The person replying to their unknown Santa. */
    z.object({ type: z.literal("reply"), text: Message }),
  ]),
});

export const AdminBody = z.object({
  key: z.string().max(100),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("status") }),
    z.object({ type: z.literal("details"), ...Details.shape }),
    z.object({ type: z.literal("people"), ...People.shape }),
    z.object({ type: z.literal("resetPin"), memberId: z.string().max(40) }),
    /** The same group, freshly drawn: for next year. */
    z.object({ type: z.literal("draw") }),
    z.object({ type: z.literal("newRound") }),
    /** Closes guessing and shows who guessed right. */
    z.object({ type: z.literal("revealGuesses") }),
    z.object({ type: z.literal("delete") }),
  ]),
});
