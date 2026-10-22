# PaisaPath

PaisaPath is an India-first price-comparison storefront concept built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore.

> **Demo data:** The current catalogue contains 120 fictional products, seller names, INR prices, and price-history points. They are illustrative only—not verified products, merchant listings, live offers, discounts, or historical prices. Do not present demo data as live.

## Run locally

Requirements: Node.js 22.12 or newer and npm.

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The storefront and clearly labelled demo catalogue work without Firebase configuration.

## Features

- Responsive storefront, category pages, product detail pages, fictional seller comparisons, search, and product filters.
- Mock price-history charts with explicit demo labels.
- Firebase GitHub sign-in, secure server session cookies, private Firestore watchlists, and target-price alert records.
- Firestore server-side persistence for verified product identities, offers, and attributed observations.
- Firestore security rules, query indexes, sitemap, robots metadata, and focused tests.

Firebase-backed features remain unavailable until the project configuration and credentials in `.env.example` are configured. No live merchant provider is active by default.

## Firebase setup

1. Create or select a Firebase project and register a Web app. Copy its Web configuration into the `NEXT_PUBLIC_FIREBASE_*` variables in `.env`.
2. In Firebase Authentication, enable GitHub. Create a GitHub OAuth App, enter its Client ID and Client Secret in Firebase, and configure the callback URL shown by Firebase in the GitHub app. Add the production domain to Firebase's authorized domains.
3. Create a Cloud Firestore database. Deploy `firestore.rules` and `firestore.indexes.json` from the Firebase CLI:

   ```powershell
   npx firebase-tools deploy --only firestore --project ykfenqrivyxcdbqtuokc
   ```

4. Create a Firebase Admin service account and set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in the server environment. Never expose the private key to browser code or commit it.
5. Set `SITE_URL` and a high-entropy `CRON_SECRET`. Configure the same required variables in Vercel Project Settings → Environment Variables, then redeploy.

Use `.env.example` as the variable checklist. Store the GitHub OAuth secret in Firebase Authentication and service-account/provider secrets in Vercel settings; do not send them in chat. Full instructions and current merchant access limitations are in [docs/authorized-data-integrations.md](./docs/authorized-data-integrations.md).

## Scheduled endpoints

The internal price-sync and alert-evaluation endpoints require `Authorization: Bearer <CRON_SECRET>`. They do no work unless Firebase is configured and an authorized provider adapter is registered. Alert records are queued only; no email or push notification is sent.

## Checks

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```
