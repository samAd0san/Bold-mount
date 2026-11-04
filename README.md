<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/images/brand/logo-ivory.png">
    <img src="public/images/brand/logo.png" alt="Bold Mount" height="120">
  </picture>
</p>

# Bold Mount

Storefront and community site for **Bold Mount** — Sunnah superfoods (Talbeenah, premium dates, Sidr honey, dry fruits, modest wear) and community services (Khidmat-e-Khalq, Zakat, volunteer guidance, free Qur’an giveaways, Umrah Badal).

Live: https://www.boldmount.store (boldmount.store and the old bold-mount.vercel.app forward there)

Products and categories live in MongoDB and are edited from **`/admin`** (PIN, default `1111`). Customers can pay online (Razorpay: UPI / Google Pay / PhonePe, cards, netbanking, Apple Pay) or send the order on WhatsApp; both land in the admin. Every form on the site (contact, zakat pledge, volunteer, giveaway, umrah booking) still opens WhatsApp and is also saved for the admin.

## Run it locally

```bash
npm install
cp .env.example .env     # then fill in the values (see the comments in .env.example)
npm run seed             # first time only: loads the original 5 categories + 23 products (never overwrites)
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
| Account | `/account` (Google sign-in, "My orders") · `/category/[slug]` (categories added in the admin) |
| Admin | `/admin` (dashboard) · `/admin/orders` · `/admin/products` · `/admin/categories` · `/admin/users` · `/admin/forms` · `/admin/settings` (change PIN) |

## Where to change things

| To change… | Edit |
|------------|------|
| Products, prices, pack sizes, product photos, shop categories | **`/admin`** → Products / Categories (photos upload to Cloudinary). Prices are whole rupees; the seeded ones are **placeholders** |
| The five "Serve & Give" sections in the header row, home tiles and footer | `lib/sections.ts` |
| Delivery charge below the free-delivery threshold | `lib/site.ts` (`deliveryFee`, a placeholder ₹50) |
| Any image path | `lib/media.ts` (files live in `public/images/…`) |
| WhatsApp number, email, free-delivery threshold, announcement bar | `lib/site.ts` |
| WhatsApp message wording | `lib/whatsapp.ts` |
| Umrah Badal packages | `app/umrah/page.tsx` |
| Colours, fonts, shared styles | `app/globals.css` (Tailwind v4 `@theme` tokens) |

## How ordering works

1. Customer adds products to the cart (saved in their browser).
2. Checkout collects name, mobile and a drop address — or a one-tap location pin.
3. **Pay online:** the server re-prices the cart from the database, creates a Razorpay order, and marks it paid only after checking Razorpay's signature. **Or order on WhatsApp:** WhatsApp opens with the order filled in, and the order is saved as "On WhatsApp".
4. Every order appears in `/admin/orders`, where its status is set (New → Confirmed → Delivered / Cancelled).

Delivery is doorstep delivery by Bold Mount; free above the threshold in `lib/site.ts`, otherwise `deliveryFee`.

## Backend

The API is Next.js route handlers in `app/api/*` (helpers in `lib/server/*`), deployed with the site on Vercel. Pages never touch the database directly — they read the catalog through `lib/catalog.ts` (cached for 60 seconds; admin edits refresh it straight away).

| Collection (db `boldmount`) | Holds |
|------|--------|
| `categories`, `products` | The catalog (name, prices per size, compare-at prices, multiple images, tags, active flag, sort order) |
| `orders` | Items, totals, customer, payment status, order status, Razorpay ids |
| `users` | Customers who signed in with Google |
| `forms` | Contact / zakat / volunteer / giveaway / umrah submissions |
| `visits` | Anonymous page views for the admin dashboard (bots skipped) |
| `settings`, `counters`, `admin_attempts` | Admin PIN (hashed), order numbers, PIN lockout |

Environment variables are listed in `.env.example`. The same values are set in Vercel (Production + Preview; `APP_URL` is Production only). **Razorpay keys are test keys** — switch to live keys after Bold Mount's own Razorpay KYC.

## Content rules

- **Halal imagery:** no images of women and no human faces anywhere. Clothing is shown on hangers or folded; hands alone are fine.
- **No cure claims:** food copy must not claim to treat or cure disease (FSSAI). Posters that do are kept out of the site.
- **Religious references:** add a Qur’an verse, hadith or fatwa only with a verified source and citation.
- **Photos:** use only free-licence images (Unsplash, Pexels, Pixabay, or Creative Commons with credit). Record each one in the matching `credits.json`; the `/credits` page lists them automatically.
- Images that must not ship (faces, claims, superseded files) go in `archive/not-deployed-images/` — outside `public/`, so they are never deployed. The folder is listed in `.gitignore`, so add new files there with `git add -f`. Don’t delete them.

## Deploy

Vercel builds automatically from GitHub:

- push to **`main`** → production (www.boldmount.store)
- push any other branch → a preview deployment (visible to the Vercel team)

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · framer-motion · zustand · lucide-react · MongoDB Atlas (mongoose) · Razorpay · Google sign-in · Cloudinary
