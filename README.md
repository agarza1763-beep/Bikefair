# BikeFair

A marketplace built specifically for buying and selling **used bicycles** locally — not a general classifieds site. Fair prices, local transactions, safer meetups.

> **BikeFair** is a placeholder brand name. It's used consistently via `NEXT_PUBLIC_BRAND_NAME` (see `.env`) and a single `BRAND_NAME` constant (`src/lib/constants.ts`), so renaming the product later is a one-line change plus a find/replace of the literal string in a couple of legal pages.

## What this application does

- **Listings** for used bicycles across 13 categories (road, mountain, gravel, hybrid, commuter, BMX, cruiser, e-bike, kids, folding, touring, triathlon, other), with full specs (brand, model, year, frame material, groupset, wheelset, condition, mileage, upgrades).
- **Fair Value Guide** — a transparent, configurable, rules-based valuation engine that estimates a fair market value range for every listing and shows the buyer/seller exactly how it was calculated (see [Fair Value Guide](#fair-value-guide-the-core-differentiator) below).
- **Search & filtering** by type, brand, price, condition, frame material, state, e-bike, verified seller, and price-vs-fair-value.
- **Messaging** between buyers and sellers, with quick-message templates, offers, and block/report.
- **Meetup coordination** — public locations, participating bike shops (with clear "not a party to the transaction" disclaimers and an optional, separately-flagged professional inspection service), and a law-enforcement-supported location option that's explicitly labeled as informational and location-dependent (never implying BikeFair employs or pays police officers).
- **Reputation & verification** — email/phone verification (phone is a clearly-labeled demo stub, see below), Trusted Seller status computed from real transaction/review history, star ratings across four categories.
- **Reporting & safety** — reports (stolen-suspected, fraud, fake listing, etc.) route into an admin review queue; a suspected-stolen report also flags the listing's internal serial-number review rather than making any public accusation.
- **Serial number safety workflow** — sellers can submit a serial number; it's stored internally only (never rendered to any client, never included in any public API response) and goes through an admin review status (`Not verified → Pending review → Verified / Potential issue / Review required`).
- **Transactions recorded, not processed** — BikeFair never touches the bicycle's purchase price. Buyer and seller exchange payment and the bike offline, then each independently confirms "Transaction Completed" on the site, which records the transaction and (only then) applies a **separate, configurable marketplace fee** to the seller.
- **Admin dashboard** — users, listings (with feature/remove), reports, serial-number fraud/safety review, transactions, bike shops (verification), valuation rules (live-editable numeric knobs for the pricing engine), fees, and analytics (active users/listings, sold count, volume, revenue, popular categories/brands/cities).
- **Bike shop portal groundwork** — a `BikeShop` model with hours, inspection service flag/fee, verification, and a meetup counter, ready for a self-serve shop-owner portal later (see Roadmap).

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Frontend/Backend | Next.js 16 (App Router), TypeScript, Server Actions | One framework for pages, API, and mutations; Server Actions replace a separate REST layer for a cleaner, more type-safe MVP backend. |
| Styling | Tailwind CSS v4 | Fast to build a distinctive, non-generic design system with custom brand tokens (see `src/app/globals.css`). |
| Database ORM | Prisma | Clean, typed schema. |
| Database | **PostgreSQL** | Point `DATABASE_URL` at any Postgres instance — a free [Neon](https://neon.com) or [Supabase](https://supabase.com) project works fine, no server to manage. |
| Auth | NextAuth (Auth.js) v5, credentials + JWT sessions | Reputable, well-supported auth library; JWT strategy avoids needing the full adapter schema for an email/password-only MVP. |
| Image storage | Vercel Blob in production, local disk (`public/uploads`) in dev, behind a `StorageProvider` interface | `getStorageProvider()` picks Vercel Blob automatically once `BLOB_READ_WRITE_TOKEN` is set (Vercel injects it when a Blob store is attached), else falls back to local disk. S3/R2 also supported by implementing `S3StorageProvider` in `src/lib/storage.ts`. |
| Maps/geocoding | Deterministic demo geocoder behind a `geocode()` function | No Google Maps/Mapbox key is configured; swap in a real provider in `src/lib/geo.ts` without touching any caller. |
| Email | Console-logged "dev mailer" behind `sendMail()` | No email provider configured; verification links print to the terminal running `npm run dev`. Swap in Resend/SES/etc. in `src/lib/mailer.ts`. |
| Payments | Not implemented (by design) | The spec explicitly excludes bicycle-purchase payment processing from the MVP. A `PaymentRecord` table and fee engine exist for **marketplace fees only**, with a clean seam to add a real processor (e.g. Stripe) later. |

### Database setup

The app was originally developed against local SQLite (this build environment had no Postgres server available at the time) and later moved to PostgreSQL with a one-line provider change — the schema was written to be Postgres-compatible from the start (no SQLite-only types), so nothing else needed to change. "Enums" are still modeled as validated `String` columns rather than Prisma `enum` types (see `src/lib/constants.ts` for the TS union types and `src/lib/validation.ts` for the Zod schemas) — a holdover from the SQLite period that costs nothing on Postgres.

To run it:

1. Create a free Postgres project at [Neon](https://neon.com) or [Supabase](https://supabase.com) (or use any Postgres host you already have).
2. Copy its connection string into `DATABASE_URL` in `.env`.
3. Run `npm run db:push` to create the schema (or `npx prisma migrate dev` once you want real tracked migrations instead of `db push`).

## Project structure

```
prisma/
  schema.prisma        # Full data model (see below)
  seed.ts               # Realistic demo data — every row is flagged isDemo: true
src/
  app/                  # Next.js App Router pages (see route list below)
  components/           # UI (bike cards, valuation breakdown, layout, etc.)
  lib/
    valuation/           # The Fair Value engine — engine.ts, rules.ts, types.ts
    prisma.ts, session.ts, storage.ts, geo.ts, mailer.ts, fees.ts, validation.ts, constants.ts
  server/
    actions/             # "use server" mutations (auth, listings, messaging, offers, meetups, transactions, reviews, reports, saved, admin)
    queries/              # Read helpers shared across pages
  auth.ts                # NextAuth v5 config
  proxy.ts               # Route protection (Next.js 16's successor to middleware.ts)
```

### Pages implemented

`/`, `/browse`, `/bike/[id]`, `/sell`, `/sell/create`, `/messages`, `/messages/[id]`, `/saved`, `/meetups`, `/account` (+ `/listings`, `/transactions`, `/reviews`), `/value-guide`, `/safety`, `/how-it-works`, `/bike-shops`, `/bike-shops/[id]`, `/admin` (+ `/users`, `/listings`, `/reports`, `/serial-numbers`, `/transactions`, `/bike-shops`, `/valuation-rules`, `/fees`), `/terms`, `/privacy`, `/community-guidelines`, `/auth/sign-in`, `/auth/sign-up`, `/auth/verify-email`.

### Database schema

`User`, `EmailVerificationToken`, `Verification`, `Block`, `BikeListing`, `BikeImage`, `BikeComponent`, `BikeValuation`, `Conversation`, `Message`, `Offer`, `Meetup`, `BikeShop`, `Transaction`, `Review`, `Report`, `SerialNumberReview`, `AdminAction`, `SavedListing`, `Fee`, `PaymentRecord`, `ValuationRule` — see `prisma/schema.prisma` for full fields/relations.

## Fair Value Guide (the core differentiator)

`src/lib/valuation/` implements an `IValuationEngine` interface with one shipped implementation, `RulesBasedValuationEngine`:

1. **Base bicycle value** — from the original MSRP (if the seller provided one) depreciated by age, or from a category/brand-tier baseline when no MSRP is known.
2. **Frame material** adjustment (carbon/titanium premium, steel/chromoly discount).
3. **Groupset tier** adjustment — free-text groupset matched against a tier table (Dura-Ace/XTR down to Claris/Altus).
4. **Wheel upgrade** flat adjustment if the seller flags upgraded wheels.
5. **Condition** adjustment (New/Excellent/Good/Fair/Poor).
6. **Wear/mileage** adjustment.
7. **Local market** adjustment (keyed by state; defaults to neutral until real regional data is added).
8. Produces a **range** (± a configurable percentage) and classifies the asking price as 🟢 Fair / 🟡 Slightly above-below / 🔴 Significantly above-below.

Every numeric knob (depreciation curve, material multipliers, condition/wear adjustments, range width, fair-price tolerance) is a row in the `ValuationRule` table, editable live from **`/admin/valuation-rules`** — no redeploy needed. The full line-item breakdown (matching the "Base bicycle value / Condition adjustment / Wheel upgrade / ... / Estimated value" format from the spec) is persisted per listing in `BikeValuation.breakdown` (JSON) and rendered by `ValuationBreakdown` on both the listing page and the sell wizard.

**To upgrade later:** implement a new class satisfying `IValuationEngine` (e.g. `MarketCompsValuationEngine` backed by real sold-comp data, or `MLValuationEngine`) and swap the single line in `getValuationEngine()` — no caller changes required.

## Installation

### Prerequisites
- Node.js 20+ and npm
- A PostgreSQL database — a free [Neon](https://neon.com) or [Supabase](https://supabase.com) project takes about two minutes to create

### Setup

```bash
git clone <this-repo>
cd bikefair
npm install
cp .env.example .env      # then edit values: DATABASE_URL and a random AUTH_SECRET are required
npm run db:push           # creates the schema in your Postgres database
npm run db:seed           # loads realistic demo data (see below)
npm run dev                # http://localhost:3000
```

`npm install` also runs `prisma generate` automatically via a `postinstall` script.

## Environment variables

See `.env.example` for the full annotated list. The essentials to get running locally:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | A `postgresql://...` connection string (Neon/Supabase/any Postgres host). |
| `AUTH_SECRET` | Yes | Random 32-byte secret for NextAuth session signing. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` for local dev. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | No | Used by `prisma/seed.ts` to create the admin account; defaults shown below if unset. |
| `NEXT_PUBLIC_BRAND_NAME` | No | Defaults to "BikeFair". |
| `BLOB_READ_WRITE_TOKEN` | Production only | Set automatically by Vercel once a Blob store is attached to the project (Storage -> Create Database -> Blob). Leave unset locally to use local-disk image storage. |
| `STORAGE_PROVIDER`, `S3_*` | No | Alternative to Vercel Blob. Set `STORAGE_PROVIDER=s3` and implement `S3StorageProvider` (see `src/lib/storage.ts`) to go live on S3-compatible storage instead. |
| `MAPS_PROVIDER`, `GOOGLE_MAPS_API_KEY` | No | Leave unset to use the deterministic demo geocoder. |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` | No | Leave unset to log "sent" emails to the server console. |

## Creating an admin account

The seed script creates one for you:

- **Email:** value of `SEED_ADMIN_EMAIL` (default `admin@bikefair.demo`)
- **Password:** value of `SEED_ADMIN_PASSWORD` (default `Admin123!`)

To promote any other existing user to admin manually:

```bash
npx prisma studio
# open the User table, set that row's `role` field to ADMIN
```

## Seeding demo data

```bash
npm run db:seed
```

Loads: 1 admin, 7 demo buyer/seller users (mixed verification levels), 4 bike shops (one unverified, two offering paid inspection), 12 bike listings across every category with computed valuations, and one fully completed transaction with a review — so `/admin` analytics, `/browse` filters, and the reputation system all have real data on first run. **Every seeded row has `isDemo: true`** so it's always distinguishable from real user data (and can be bulk-removed later with `WHERE isDemo = true` before a production launch).

Demo logins (all demo non-admin users share one password):
- Admin: `admin@bikefair.demo` / `Admin123!`
- Any demo user (e.g. `sarah@bikefair.demo`, `marcus@bikefair.demo`, `jake@bikefair.demo`, ...): `Demo1234!`

## Running

```bash
npm run dev        # development, with hot reload
npm run build       # production build
npm run start        # run the production build
npm run db:studio     # Prisma Studio — browse/edit the database visually
```

## Deployment

1. Push this repo to GitHub, then import it into Vercel.
2. Set all required env vars in the Vercel project: `DATABASE_URL` (your Neon/Supabase connection string), `AUTH_SECRET`, `NEXTAUTH_URL` (your real domain).
3. Run `npx prisma migrate deploy` (after converting local `db push` history to a real migration with `npx prisma migrate dev --name init` once, committed to the repo) as part of your deploy step.
4. Attach a Blob store to the Vercel project (Storage -> Create Database -> Blob) so listing photos persist — Vercel sets `BLOB_READ_WRITE_TOKEN` automatically. Also configure real providers for email (Resend/SES), maps (Google/Mapbox), and — before accepting real listings — decide on an identity-verification provider and a payment processor for marketplace fees only.
5. Point your purchased domain at the Vercel project (Vercel's project settings give you the exact DNS records to add at your registrar).

## What remains to connect/configure before production

- **Object storage** — solved via Vercel Blob (`src/lib/storage.ts`, `VercelBlobStorageProvider`); just attach a Blob store to the Vercel project before launch (see Deployment above) so `BLOB_READ_WRITE_TOKEN` is set. Falls back to local disk (dev-only — doesn't persist on Vercel) when that token is absent.
- **Maps/geocoding** — currently a deterministic demo geocoder; implement the Google/Mapbox branch in `src/lib/geo.ts` and consider adding an interactive map to listing/meetup pages.
- **Email delivery** — currently logs to console; implement a provider in `src/lib/mailer.ts`.
- **Phone verification** — currently a clearly-labeled `(Demo)` stub (`verifyPhoneDemoAction` in `src/server/actions/auth.ts`) that accepts any number with no real OTP. Wire up a real SMS/OTP provider (e.g. Twilio Verify) before relying on "Verified User" status in production.
- **Identity verification** — not implemented at all (correctly not claimed anywhere in the UI/copy). Add a `Verification` row of `type: "IDENTITY"` once a real provider (Persona, Stripe Identity, etc.) is integrated — the verification-level logic in `recalculateVerificationLevel()` already accounts for it.
- **Theft-database integration** — the `SerialNumberReview` workflow is designed so a real registry (e.g. Bike Index, National Bike Registry) can be queried and used to pre-populate `status`, but no such integration exists yet — all review is currently manual via `/admin/serial-numbers`.
- **Payments** — marketplace fees are recorded (`PaymentRecord`) but not actually charged to a card; wire up a processor (e.g. Stripe) scoped **only** to marketplace fees, never the bicycle price.
- **Law-enforcement-supported meetups** — intentionally presented as informational only ("availability varies by location"); no such partnership exists. Do not remove that qualifier without an actual signed agreement with a local agency.
- **Rate limiting** — request validation (Zod) and auth/ownership checks are in place on every Server Action, but there's no dedicated rate-limiter yet; add one (e.g. Upstash Ratelimit) in front of `/auth/sign-up`, `/sell/create`'s image upload, and messaging before public launch.

## Legal/business items that need professional review before launch

- `/terms`, `/privacy`, and `/community-guidelines` are **placeholder text structured for straightforward attorney review** — they are not real legal documents. They already encode the required disclaimers (marketplace facilitates connections but doesn't process bicycle payments or take ownership; participating bike shops aren't parties to transactions; verification badges don't imply a background check; law-enforcement-supported meetups aren't a paid partnership) — but need a licensed attorney's sign-off before real users rely on them.
- Marketplace fee structure (`/admin/fees`) is fully configurable but the **default values are placeholders** — get real pricing signed off before launch.
- Confirm state-by-state legal requirements around secondhand-goods marketplaces / bicycle-specific resale regulations (some jurisdictions have pawnshop-adjacent reporting rules for used bike sales).
- If you do integrate a stolen-bike registry or law-enforcement partnership, have counsel review the exact language used so BikeFair never implies police involvement it hasn't actually contracted for.

## Roadmap: MVP → production marketplace

1. **Data**: switch to PostgreSQL; add proper migrations (`prisma migrate`); add composite indexes as query patterns emerge at scale.
2. **Geography**: the schema already supports multi-city/state/country (lat/lng + free-text city/state on every listing/user); add a real geocoder and distance-based sorting/search (`distanceMiles()` already exists in `src/lib/geo.ts` and just needs real coordinates).
3. **Valuation**: replace/augment `RulesBasedValuationEngine` with a comps-based or ML-based engine behind the same `IValuationEngine` interface, fed by real sold-transaction data as `Transaction` volume grows.
4. **Trust & safety**: real identity verification provider; theft-database integration for `SerialNumberReview`; automated fraud heuristics (velocity checks, image-hash duplicate detection) feeding into the existing `Report` queue.
5. **Bike shop portal**: self-serve shop signup/login (the `BikeShop.ownerUserId` relation already exists), shop-managed hours/services, and a real professional-inspection booking + payment flow.
6. **Payments**: Stripe (or similar) for marketplace fees only, plus payout handling for any future paid add-ons (featured listings, valuation reports).
7. **Mobile**: the web app is fully responsive; a native app would reuse the same Server Actions as an API layer, or a thin REST/GraphQL wrapper could be added around them.
8. **AI-assisted features**: bicycle identification from photos (brand/model/component auto-fill) and AI-assisted valuation, both as additional `IValuationEngine`/upload-pipeline implementations that don't require touching the pages that call them.
9. **Dealer accounts**: extend `User`/`BikeShop` with a dealer role and bulk-listing tools once demand appears.

## Design decisions worth knowing about

- **No Prisma `enum` types** — every "enum" field (category, condition, status, etc.) is a validated `String`, because Prisma enums aren't supported on SQLite; this keeps the exact same schema working on Postgres later with zero migration pain. Validation lives in `src/lib/constants.ts` (TS union types) and `src/lib/validation.ts` (Zod schemas).
- **Server Actions over a separate REST API** — every mutation (`src/server/actions/*.ts`) is a `"use server"` function with its own auth/ownership check and Zod validation, called directly from Server/Client Components. This is "a clean backend architecture" per the brief, with less boilerplate than a parallel `/api/*` layer, while `/api/auth/*` still exists for NextAuth's own routes.
- **Serial numbers never leave the server to unauthorized clients** — `fetchListingDetail()` explicitly strips the raw `serialNumber` field before returning data to any page; only `serialStatus` (an enum-like string) is public. The admin serial-number review page is the only place the raw value is ever rendered, and it's behind `requireAdmin()`.
