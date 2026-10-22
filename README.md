# PaisaPath

PaisaPath is an India-first price-comparison storefront concept built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

> **Demo data:** The current catalogue contains 120 fictional products, seller names, INR prices, and price-history points. They are illustrative only—not verified products, merchant listings, live offers, discounts, or historical prices. No price scraping or live provider integration is enabled.

## Run locally

Requirements: Node.js compatible with the installed Next.js version and npm.

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The storefront and catalogue work without a database.

## Features in this repository

- Responsive storefront, category pages, product detail pages, and fictional seller comparisons.
- Search, category and brand filters, INR demo-price filters, sorting, and URL-backed filter state.
- Illustrative price-history charts, with demo-data labels.
- Prisma/PostgreSQL schema and an initial additive migration.
- Better Auth configuration, user-scoped watchlist and target-alert APIs.
- Provider adapter and validation contracts for future authorized integrations.
- Sitemap, robots metadata, and focused tests.

Database-backed accounts, saved products, alerts, and real merchant comparisons are not available until the external services described below are configured.

## PostgreSQL and authentication setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_URL`, and a securely generated `BETTER_AUTH_SECRET` of at least 32 characters.
2. Generate the Prisma client and apply the migration:

   ```powershell
   npm run db:generate
   npm run db:migrate
   ```

3. Optionally insert the explicitly fictional demo catalogue:

   ```powershell
   npm run db:seed
   ```

Review the migration and back up any existing database before applying it. The seed refuses a collision with a live product slug, but the migration has not been applied as part of this repository setup.

For internal scheduled routes, configure a separate high-entropy `CRON_SECRET`. Keep `.env` and production secrets out of source control; configure production values using the hosting provider's environment-variable settings. `SITE_URL` should be the canonical HTTPS site origin.

## Checks

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Authorized price data

No provider adapter is currently enabled. The protected synchronization route deliberately returns `503` until a provider with approved credentials and verified terms is implemented. Do not scrape websites, bypass authentication or anti-bot protections, or present demo data as live. See [docs/authorized-data-integrations.md](./docs/authorized-data-integrations.md) for access requirements and remaining setup.

The existing adapter contract supports validation, exact product/variant matching, retry handling, and persisting attributed offers and observations. Email or push delivery is not configured; queued alert notifications do not mean a notification was delivered.
