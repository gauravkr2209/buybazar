# PaisaPath setup and authorized data integrations

## Firebase project setup

1. Install with `npm ci` and copy `.env.example` to `.env`.
2. Register a Firebase Web app and configure `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` is optional.
3. Enable GitHub under Firebase Authentication sign-in providers. Create a GitHub OAuth App and enter its Client ID and Client Secret in Firebase. Copy Firebase's callback URL into the GitHub OAuth App settings, and add the production hostname to Firebase's authorized domains.
4. Create the Firestore database. Create an Admin SDK service account and configure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` only in server-side environments. The private key accepts `\n`-escaped line breaks.
5. Deploy Firestore rules and indexes with `npx firebase-tools deploy --only firestore --project <firebase-project-id>`.
6. Set `SITE_URL` and a high-entropy `CRON_SECRET`. Configure the same environment values in Vercel and redeploy.

The Admin SDK bypasses Firestore Security Rules, so API routes must continue to authenticate and scope all user records by the verified Firebase UID. The checked-in Firestore rules deny direct client database access. Do not loosen these rules to `allow read, write: if true`.

The Firestore collections are:

- `products/{slug}` for verified catalog identity and source attribution.
- `products/{slug}/offers/{offerId}` for current attributed seller offers.
- `products/{slug}/offers/{offerId}/observations/{observationId}` for timestamped price observations.
- `merchants/{merchantId}` and `productIdentifiers/{identifierHash}` for normalized seller/product matching.
- `users/{uid}/watchlist/{productSlug}`, `users/{uid}/alerts/{alertId}`, and alert-owned `notifications` for private account data.

The fictional catalogue remains in the static mock module and works without Firebase. It is never copied to Firestore as verified price data.

## Demo and verified data are separate

The 120 products, seller names, INR prices, and charts rendered by the storefront are fictional demo records. They are not verified offers. Provider observations must match every supplied product identifier to exactly one non-demo product with the same brand and variant. Missing, ambiguous, or mismatched products are rejected.

`POST /api/internal/products` registers a non-demo product identity and source attribution. It is protected by `CRON_SECRET`; it does not create an offer or observation.

## Amazon Creators API

Official current documentation:

- [Creators API onboarding](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/onboarding/register-for-creators-api)
- [GetItems](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/api-reference/operations/get-items)
- [OffersV2 resource](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/api-reference/resources/offersV2)
- [Best programming practices and cache times](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/concepts/best-programming-practices)
- [India Associates agreement](https://affiliate-program.amazon.in/help/operating/agreement)

The documented requirements include Associates enrollment and acceptance, qualifying sales, Creators API approval, and marketplace-specific Partner Tag credentials. The API documentation states that the `Offers` resource may be cached for one hour. Do not persist Amazon offer prices as long-term price history unless Amazon has explicitly authorized that use under the India license. PaisaPath's cross-merchant comparison and long-term history need explicit confirmation that they are permitted by the account's current agreement. Provider credentials must remain server-side.

No Amazon adapter is enabled until credentials and permitted price-data retention are confirmed. Demo observations must never be substituted for provider responses.

## Flipkart Affiliate API

Official documentation:

- [Affiliate API overview](https://affiliate.flipkart.com/api-docs/affiliate_index.html)
- [Registration and API token headers](https://affiliate.flipkart.com/api-docs/af_register.html)
- [Product API reference](https://affiliate.flipkart.com/api-docs/af_prod_ref.html)
- [API FAQ](https://affiliate.flipkart.com/api-docs/af_faq.html)
- [Affiliate terms](https://affiliate.flipkart.com/terms-and-conditions)

The docs describe HTTPS API access using `Fk-Affiliate-Id` and `Fk-Affiliate-Token`, a limit of 20 API calls per second per affiliate, feed responses of 500 products per page, and feed URLs that expire within ten hours. Treat the token as a secret. Confirm the current terms for price caching, display, product comparison, and historical retention for your account before storing price observations. No Flipkart adapter is enabled until those terms and the account's access are confirmed.

## Synchronization, freshness, and alerts

`POST /api/internal/prices/sync` and `POST /api/internal/alerts/evaluate` require `Authorization: Bearer <CRON_SECRET>`. No provider is assumed active; the synchronization route returns `503` if no authorized adapter is registered and configured. Provider failures are surfaced without converting demo values to live offers.

Alert evaluation considers only non-demo, available INR observations within the freshness window. Duplicate notifications are prevented per alert and observation. Notifications are only queued; delivery requires a separately configured email or push service, and a queued status does not mean a notification was sent.

## Search and SEO

`GET /api/products` supports `q`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`, `page`, and `pageSize`. Without Firebase server credentials, it returns the clearly marked static demo catalogue. Set `SITE_URL` to the canonical HTTPS origin so the sitemap can include category and product pages.
