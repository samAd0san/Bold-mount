# Bold Mount

Storefront and community site for **Bold Mount** — Sunnah superfoods (Talbeenah, premium dates, Sidr honey, dry fruits, modest wear) and community services (Khidmat-e-Khalq, Zakat, volunteer guidance, free Qur’an giveaways, Umrah Badal).

Live: https://bold-mount.vercel.app

There is no backend. Every order, booking, pledge and request ends in a **pre-filled WhatsApp message** to Bold Mount, where price, delivery and payment are confirmed personally.

## Run it locally

```bash
npm install
npm run dev -- -p 3100   # http://localhost:3100 (hot reload)
npm run build            # production build — run before pushing
npm run lint
```

Node 20+ is recommended.

## Pages

| Area | Routes |
|------|--------|
| Shop | `/` · `/shop` (category tiles, sort, filters, `?q=` search) · `/talbeenah` · `/dates` · `/honey` · `/dry-fruits` · `/wearings` · `/product/[slug]` · `/cart` |
| Serve & Give | `/khidmat-e-khalq` · `/zakat` (calculator + pledge) · `/volunteer` · `/giveaway` · `/umrah` (packages + booking) |
| Info | `/about` · `/contact` · `/faq` · `/policies/shipping` (Delivery & Returns) · `/policies/privacy` · `/policies/terms` · `/credits` |

## Where to change things

| To change… | Edit |
|------------|------|
| Products, prices, pack sizes, product photos | `lib/products.ts` (prices are **placeholders** — whole rupees) |
| Categories in the header row, home tiles and footer | `lib/sections.ts` |
| Any image path | `lib/media.ts` (files live in `public/images/…`) |
| WhatsApp number, email, free-delivery threshold, announcement bar | `lib/site.ts` |
| WhatsApp message wording | `lib/whatsapp.ts` |
| Umrah Badal packages | `app/umrah/page.tsx` |
| Colours, fonts, shared styles | `app/globals.css` (Tailwind v4 `@theme` tokens) |

## How ordering works

1. Customer adds products to the cart (saved in their browser).
2. Checkout collects name, mobile and a drop address — or a one-tap location pin.
3. WhatsApp opens with the full order filled in; Bold Mount confirms availability, delivery and payment there.

Delivery is doorstep delivery by Bold Mount; free above the threshold in `lib/site.ts`.

## Content rules

- **Halal imagery:** no images of women and no human faces anywhere. Clothing is shown on hangers or folded; hands alone are fine.
- **No cure claims:** food copy must not claim to treat or cure disease (FSSAI). Posters that do are kept out of the site.
- **Religious references:** add a Qur’an verse, hadith or fatwa only with a verified source and citation.
- **Photos:** use only free-licence images (Unsplash, Pexels, Pixabay, or Creative Commons with credit). Record each one in the matching `credits.json`; the `/credits` page lists them automatically.
- Images that must not ship (faces, claims, superseded files) go in `archive/not-deployed-images/` — outside `public/`, so they are never deployed. The folder is listed in `.gitignore`, so add new files there with `git add -f`. Don’t delete them.

## Deploy

Vercel builds automatically from GitHub:

- push to **`main`** → production (bold-mount.vercel.app)
- push any other branch → a preview deployment (visible to the Vercel team)

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · framer-motion · zustand · lucide-react
