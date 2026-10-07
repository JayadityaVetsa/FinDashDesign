# FinDash

A financial workspace for the web: draggable market widgets, multiple dashboards, watchlists, company news and a portfolio tracker. Built with Next.js, React, TypeScript and **Neon PostgreSQL**, compatible with **Vercel**.

**[Open FinDash](https://fin-dash-design-ad43.vercel.app/)** · [Source code](https://github.com/JayadityaVetsa/FinDashDesign)

Create an account to start your own workspace, then connect your Finnhub key for live market data. The public deployment uses Neon Postgres for persistent, account-scoped storage.

## Deploy to Vercel

1. Import [this repository](https://github.com/JayadityaVetsa/FinDashDesign) into Vercel, or use the existing project.
2. In the Vercel project, open **Storage** and create/connect **Neon Postgres** from the Marketplace. Choose the plan appropriate for your usage. This supplies `DATABASE_URL` (the app also accepts `POSTGRES_URL`). Make sure the variable is available to **Production**; use a separate database/branch for **Preview** when possible.
3. Redeploy after connecting the database. The app creates its schema automatically when first used, with database locking to handle simultaneous serverless starts. No Supabase project or manual SQL setup is required.
4. Open the public site, select **Create an account**, and enter an email and password of at least 10 characters. Each user connects their own [Finnhub API key](https://finnhub.io/register) during onboarding and picks a starting layout.

Every user has a private workspace. Data persists in Neon, across Vercel function shutdowns, deploys and device changes. Neon can scale its compute to zero while idle and wake it automatically for queries; provider plan limits still apply. See [Neon on Vercel](https://vercel.com/marketplace/neon) and [Neon's scale-to-zero documentation](https://neon.com/docs/introduction/scale-to-zero).

**Pushing code alone does not create a cloud database or set Vercel environment variables.** The one-time Neon connection is required. Missing configuration is shown as a setup error instead of an endless spinner or a redirect loop.

## Local development

Use Node.js **22.13+** and the same Neon connection (preferably a separate development branch):

```bash
npm ci
```

Copy `.env.example` to `.env.local` and replace `DATABASE_URL` with your Neon connection string, then:

```bash
npm run dev
```

Open http://localhost:3000. The database connection stays on the server; never use a `NEXT_PUBLIC_` prefix for it. `.env.local` is ignored by Git. Do not paste the connection string into an issue or commit it.

To initialize the schema explicitly:

```bash
npm run db:migrate
```

The schema uses `findash_` table/function prefixes to avoid colliding with other apps. Initialization is idempotent and preserves existing data.

## What works

- Email/password accounts with scrypt password hashes, hashed random session tokens, HttpOnly/SameSite cookies, rate limiting and same-origin checks. HTTPS deployments use Secure cookies.
- Account-scoped dashboard CRUD, active dashboard, theme and sidebar preference. Ownership is always checked on the server.
- Atomic onboarding that actually uses the selected preset, and safe retries that do not duplicate dashboards.
- Debounced, serialized layout/portfolio saves, visible failure messages, retry controls and account-scoped browser recovery of pending edits.
- Watchlist tickers, chart ticker/range and other widget settings persist to their dashboard.
- Empty portfolios remain empty; failed quotes do not show a fabricated total loss.
- Shared portfolio state across multiple portfolio widgets, stock search (**Ctrl/Command+K**), refresh controls, loading states and a usable mobile dashboard.
- Stale tabs cannot write one account's changes after another account signs in in the same browser.

Changes are fetched from the server when opening or reloading a workspace. An already-open tab on another device needs a reload to see changes made elsewhere.

## Market data

Live market data needs a valid Finnhub key. Availability depends on the plan and symbol coverage. Price history and some crypto/forex endpoints may require a paid plan; unavailable features show an error. Caching and in-flight deduplication are scoped to the API key, so another key cannot be incorrectly validated by cached data.

Keys are saved in the user's private database profile and sent to Finnhub for market requests. They are not encrypted at rest; protect database credentials, exports and operator access. No database credentials are exposed to the browser.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string; server-only |
| `POSTGRES_URL` | Accepted as a fallback for Vercel Postgres/Neon integrations |
| `APP_ORIGIN` | Optional exact public origin for CSRF checks; omit to support production and preview domains |
| `ALLOW_REGISTRATION` | Defaults to `true`; set `false` to close new registrations |

The app uses the Neon HTTP driver and database-backed sessions/rate limits, so it does not depend on persistent Vercel disk or process memory. Production builds do not require database credentials; runtime requests do.

## Backups and account recovery

Use Neon's backup/restore features for your plan, or export the PostgreSQL database with `pg_dump`. Keep exports private: they contain accounts, sessions and API keys. Use a separate Neon development/preview branch so testing does not mutate production data.

Email addresses serve as account identifiers and are not verified. There is no email password-reset service. The operator can reset an account with the CLI: set `FINDASH_NEW_PASSWORD` in your terminal environment, then run:

```bash
npm run reset-password -- you@example.com
```

The command loads `.env.local`, changes the password and revokes existing sessions. Remove `FINDASH_NEW_PASSWORD` from the environment afterward. An email verification/reset provider can be added separately if needed.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Unit tests cover save ordering, retry recovery, credential-scoped caching, presets, concurrent/atomic workspace initialization and password/session security. Production API tests cover account creation, authentication, ownership checks, CRUD, CSRF, empty portfolios, persistence across app restarts, stale tabs and logout. Tests run real PostgreSQL through PGlite using a local Neon HTTP gateway, so cloud credentials are not required for CI. Live Neon/Vercel connectivity must also be checked after the integrations are connected.

GitHub Actions runs these checks on pushes and pull requests. The framework was upgraded to the patched Next.js release. Development lint dependencies can still appear in `npm audit`; do not force a Next.js downgrade to address them.

## Previous Supabase accounts

Supabase Auth has been removed. Create a new FinDash account; previous Supabase accounts and data are not automatically imported. If your old Supabase project becomes available, export any dashboards/holdings you want to migrate.
