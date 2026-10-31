<img src="src/app/icon.svg" alt="" width="72" align="right">

# Secret Santa

Run a gift exchange from one link. Create a group, share the link, and everyone adds themselves. When everyone's in, draw names, and each person unwraps a gift to see who they drew. No accounts or apps needed.

**Live:** https://secret-santa-virid-one.vercel.app

<p>
  <img src="docs/screenshots/home.jpg" alt="Home page" width="240">
  <img src="docs/screenshots/new.jpg" alt="New group form with a big budget field" width="240">
  <img src="docs/screenshots/join.jpg" alt="Joining a group with a name and PIN" width="240">
</p>
<p>
  <img src="docs/screenshots/lobby.jpg" alt="Organiser's list of who has joined, with the Draw names button" width="240">
  <img src="docs/screenshots/unwrap.jpg" alt="A wrapped gift waiting to be tapped" width="240">
  <img src="docs/screenshots/reveal.jpg" alt="The name you drew, on a gift tag" width="240">
</p>
<p>
  <img src="docs/screenshots/wishes.jpg" alt="A wish list with Shopee, Lazada and TikTok Shop links" width="240">
  <img src="docs/screenshots/status.jpg" alt="Organiser's list of who has opened their name and bought a gift" width="240">
  <img src="docs/screenshots/results.jpg" alt="Table of who guessed their Santa correctly" width="240">
</p>

The screenshots use a demo group with made-up names.

## Features

**Running the draw**
- **One invite link** for the whole group, with Copy, Share, Messenger (on phones) and a QR code. You never type a list of names.
- **Draw when you're ready:** see who has joined, then draw once at least 3 people are in.
- **Exclusions:** keep couples or housemates from drawing each other.
- **Budget, party date and a note** for everyone: a big budget field with shortcuts, the site's own calendar, and a live countdown.
- **Change the group later:** add or remove people and everyone gets a new name. Renaming someone keeps the draw.
- **See who's ready:** who has joined, opened their name and bought a gift, without showing who it's for.
- **Copy a reminder:** a ready-made message for your group chat naming anyone still to open their name or buy a gift.
- **Draw again:** the same group for next year, avoiding last round's matches when the group is big enough.
- **Delete the group:** removes every name, wish list and message.

**Taking part**
- **Join with your name and a 4-digit PIN.** The PIN opens your page on another phone.
- **Unwrap a gift** to see who you drew, with falling snow and confetti. It wraps itself again on each visit, so the name is never on screen by surprise.
- **Wish lists:** paste a link from Shopee, Lazada or TikTok Shop. The site recognises the shop and fills in the product name when the link includes one.
- **A few things about you:** likes, sizes and "please no", for people without links to add.
- **Gift search:** search the three shops, starting from what your person likes.
- **Anonymous messages:** ask your person a question. They see "Your Santa" and can reply without learning who asked.
- **Guess your Santa:** pick who you think drew you, and change your mind until the organiser shows the results. The table shows only who was right, not who they named.

**Everywhere**
- An English interface. Names and wishes people type can be in Thai too, with matching Thai fonts.
- A festive poster look: blurred lights, gold script, torn paper notes and punched tickets, recorded in [DESIGN.md](DESIGN.md).
- Reduced motion is respected.

## How the secret is kept

- Each person's result is encrypted (AES-256-GCM) before it reaches the database, and is bound to that person and group.
- The server only returns a result to the person who drew it, after their PIN. The organiser's page never receives results.
- Anonymous messages are stored under the person receiving the gift, so nothing stored names their Santa.
- Guesses get no feedback before the reveal, so guessing can't be used to find your Santa.
- PINs are hashed with scrypt and lock for an hour after repeated wrong tries.

**What it can't prevent:**
- Anyone with the link can join before the draw, so organisers should check the list and remove anyone unexpected.
- An organiser could reset someone's PIN and log in as them. The reset then shows on the group page for everyone.
- Someone holding both the database and `SEAL_SECRET` could decrypt the results on purpose.
- With exactly 3 people, your own result reveals the whole circle, so the site warns about it when people are added by hand.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No setup is needed: data lives in memory until the server stops.

```bash
npm test                                      # draw, encryption and shop-link tests
node scripts/smoke.mjs http://localhost:3000  # full check against a running site
```

## Deploy your own

1. Import this repository into [Vercel](https://vercel.com).
2. Connect a Redis database from Storage → Marketplace. This sets `REDIS_URL`, or `KV_REST_API_URL` and `KV_REST_API_TOKEN` for Upstash.
3. Add `SEAL_SECRET` for Production, set to the output of `openssl rand -base64 32`.

> [!WARNING]
> Never change `SEAL_SECRET` after people have drawn names. Every existing draw becomes unreadable.

Groups expire 180 days after their last change.

## Built with

Next.js, React, Tailwind CSS, Redis and Zod.
