# PaisaPath setup and authorized data integrations

## Local database and accounts

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set a PostgreSQL `DATABASE_URL`, `BETTER_AUTH_URL`, and a cryptographically random `BETTER_AUTH_SECRET` of at least 32 characters.
3. Run `npm run db:generate`, then `npm run db:migrate`.
4. Optionally run `npm run db:seed` to insert the explicitly fictional 120-product catalogue and demo observations. Re-running the seed updates those same demo rows; it does not remove unrelated records.
5. Run `npm run dev`.

The initial migration creates tables, indexes, and foreign keys in an empty PostgreSQL schema. It has not been applied to any database. `db:migrate` uses `prisma migrate deploy`; review the migration and backup any existing data before applying it to a database that is not empty.

## Demo and verified data are separate

All catalogue products and prices currently rendered by the storefront are fictional demo records. Seeded products, offers, and observations carry `isDemo = true`; they have no merchant URLs, are not marked available, and must never be represented as verified seller offers. The product pages remain usable without a database through the local demo catalogue.

Provider offers must resolve every submitted identifier to one non-demo product and match its brand and variant exactly. Ambiguous, missing, or variant-mismatched products are rejected rather than guessed. The normalization and persistence path is implemented, but no external provider adapter is enabled.

An authorized internal catalog process can register a non-demo product identity with `POST /api/internal/products`, authenticated by the shared `CRON_SECRET`. The request requires a supported category slug, product slug, name, brand, variant, normalized variant key, authoritative source name and HTTPS source URL, plus one to ten exact identifier pairs (`type` and `value`). This endpoint stores catalog identity and attribution only; it does not create an offer or price observation.

## Provider access still required

- **Amazon:** The official [Creators API documentation](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction) identifies `GetItems` and its `OffersV2` resource. Access requires enrollment in the Associates program for the target marketplace, at least 10 qualifying sales in the preceding 30 days, registration/approval for API access, and generated credentials. Amazon's current onboarding and licensing terms must be rechecked for India before implementing requests. No Amazon endpoint, request signing, or credentials are hard-coded here.
- **Flipkart:** The official [Flipkart Affiliate site](https://affiliate.flipkart.com/) advertises affiliate product APIs/tools, but the linked API documentation/FAQ could not be verified. Obtain current API documentation, account approval, credentials, attribution rules, rate limits, and price-caching terms directly from Flipkart before enabling a provider.

Do not scrape pages, bypass login/CAPTCHAs/anti-bot measures, or convert demo values into provider data. `ProviderAdapter`, validation, exact product matching, persistence, retry policy, `429` handling, and a protected synchronization route are ready for an authorized adapter. The synchronization route deliberately returns `503` until a provider adapter and its product request setup are supplied.

For a scheduled run, configure the hosting platform's scheduler to send `POST /api/internal/prices/sync` and `POST /api/internal/alerts/evaluate` with `Authorization: Bearer $CRON_SECRET`. The price route currently reports that no provider work was performed. Alert evaluation only considers non-demo, available INR observations observed within 24 hours and not past their freshness expiry. It creates deduplicated pending notification records; no email or push notification is sent.

`NotificationDeliveryProvider` defines the delivery contract for queued alerts. Selecting an email/push service, obtaining credentials, and adding a delivery worker that records the provider response remain external work; queued or pending never means delivered.

## Search APIs and SEO

`GET /api/products` supports `q`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`, `page`, and `pageSize`. When no database is configured, it serves the clearly marked mock catalogue. Set `SITE_URL` to the canonical HTTPS origin before deployment so `sitemap.xml` can advertise category and product pages; without it the sitemap is empty and `robots.txt` omits the sitemap URL.
