# Finite — built on Arcade

From first heartbeat to big dreams. Parents capture a child's memories across five chapters. Finite turns each one into a one-of-one physical keepsake through the Arcade API, plus a memory page behind a QR code.

## Run it (5 minutes)

```bash
npm install
cp .env.example .env.local    # then paste your key after ARCADE_API_KEY=
npm run dev                   # open http://localhost:3000
```

- **Check the connection:** open http://localhost:3000/health. It should say **live** and list your Arcade categories.
- **No key?** The app runs in **demo mode**: a banner shows, and patterns, products and checkout are clearly labelled placeholders.
- **Keep the key safe.** It lives only in `.env.local` (git-ignored) and is used only on the server, in `app/api/arcade/[action]/route.ts`.

## Demo path (3 minutes)

1. Open **Siya's story**.
2. Go to **Her first real smile** and choose **Turn this memory into a keepsake**.
3. Click **Generate design**. Arcade takes about 1–2 minutes.
4. Choose **Love it — put it on a product**, then **Nursery pillow cover**.
5. Click **Make it**, then **Buy**. This opens Arcade's hosted checkout.

The confirmation page shows a QR code that links back to the memory page.

### Fingerprint demo (2 minutes)

Open **Fingerprint** in the nav.

- **Fingerprint pendant.** Pick a shape, an initial and a metal (live from Arcade), then **Design the pendant**. Arcade designs and prices a real piece in about a minute. Jewelry is made from a prompt only: Arcade's API refuses reference images for jewelry, so the swirl is Arcade's engraving, not the child's actual print.
- **Fingerprint keepsake.** Upload a photo of the real fingerprint (ink on white paper works best). It goes to Arcade as a reference image (`references/createUpload` → `references/create` → `patterns/create` with `referenceIds`), then continues into the normal product → make → buy flow.

**Pre-bake before you present.** Run the path once before going on stage. Designs and products are saved in the browser's localStorage. Afterwards, the memory's design page opens straight to the finished pattern, so the live demo doesn't wait on generation. Use the *same browser* for the demo. Avoid "Reset demo family" (at the bottom of the story page), which clears it.

## What's in it

| Area | Where |
|---|---|
| Arcade client (POST + Bearer + User-Agent, `dropShip: true`, `fit: fill`) | `lib/arcade.ts` |
| Server proxy for all Arcade calls; demo-mode fallback | `app/api/arcade/[action]/route.ts`, `lib/demo.ts` |
| Browser-side polling (every 5s, 3-minute timeout, resumes after refresh) | `lib/client.ts` |
| Design engine: memory + chapter rules + parent personas → prompt and story card | `lib/brief.ts` |
| Chapter trigger: a milestone-tagged memory queues a draft keepsake | `lib/store.tsx` (`addMemory`) |
| Landing page, timeline, memory page, design flow, keepsake/checkout, subscription and gift pages | `app/*` |

## Rules it follows

- **Nothing about products is hardcoded.** Categories come from `categories/list` (print only). Options come from `categories/get`, and only `available` values are offered. **Make it** is enabled only when `canManufacture` is true, and the *complete returned* selection is sent.
- **Prices are never invented.** The app shows `unitPrice` exactly as `products/get` returns it.
- **Only IDs are stored, never image URLs.** Arcade's URLs are short-lived, so images are re-fetched each time they're shown.
- **Retries are idempotent.** A retry reuses its `requestId`; a variation gets a new one.

Billing for the Finite Chapters subscription is stubbed (demo billing). Plans are $19/month (Chapters) and $39/month (Chapters Heirloom).
