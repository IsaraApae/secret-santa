# Secret Santa

Draw names for a gift exchange and share one link. Nobody sees who drew whom, including the organiser.

```bash
npm install
npm run dev     # works locally with no setup: data lives in memory
npm test        # draw, encryption and shop-link checks
node scripts/smoke.mjs http://localhost:3000   # full API check against a running server
```

## Deploy on Vercel

1. Import this repository into Vercel.
2. Storage → Marketplace → add a Redis database (Upstash). This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. Add `SEAL_SECRET`, set to the output of `openssl rand -base64 32`. Never change it: existing draws become unreadable.

## How the secret is kept

- Each person's draw is encrypted with AES-256-GCM before it reaches the database, and no page or API returns it except to that person, after their PIN.
- Anonymous messages are stored under the receiver, so nothing stored names the Santa.
- The organiser can reset someone's PIN and could then claim that name, but the reset shows on the group page for everyone.
- Someone holding both the database and `SEAL_SECRET` could decrypt the draw on purpose. Keep that secret to yourself.
