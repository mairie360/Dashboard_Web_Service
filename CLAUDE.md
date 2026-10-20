# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 15 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting the home dashboard (aggregated projects / tasks / events). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_Dashboard**. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

## Commands

Private `@mairie360/*` packages come from GitHub Packages: `.npmrc` reads `NODE_AUTH_TOKEN`, so export a token with `read:packages` before installing or building images.

```bash
npm ci
npm run dev -- --port 5000         # needs BFF_Dashboard reachable, see "BFF URL" below
npm run build && npm run start -- --port 5000
npm run lint                             # next lint (next/core-web-vitals + next/typescript)
npm test                                 # node:test on tests/*.test.cjs + lcov in coverage/lcov.info (what CI runs)
npm run test:contracts                   # same tests, no coverage
node --test --test-name-pattern="<name>" tests/proxy.test.cjs   # single test
```

Tests are plain CommonJS `node:test` files (no Jest/Vitest, no DOM); new tests must match `tests/*.test.cjs`. They `require('./support/load-ts.cjs')` first, which transpiles `.ts` on the fly (`typescript.transpileModule`, inline source maps so `--enable-source-maps` reports coverage on `.ts` lines) and resolves the `@/*` alias. `npm test` enforces 60% lines/branches/functions, but node:test only counts files a test loads: `tests/network-contract.test.cjs` requires every `src/**/*.ts`, so a new `.ts` module must load outside Next.js; `src/app/page.tsx` is loaded (and covered) by `tests/dashboard-page.mock-servers.test.cjs` only; page logic still lives in `src/lib/dashboard-view.ts`. Source-mapped coverage marks erased lines (type imports, comments) as uncovered.

### Contract-driven tests

**One front = one BFF = one contract.** This front only talks to BFF_Dashboard through `contracts/openapi.json`: the catch-all proxy is the only route handler, and there are no session adapters towards BFF User (the first name comes from `/dashboard/bootstrap`). The account menu navigates to Login's validated `/logout` page; Dashboard does not expire the shared cookie itself. Don't add another BFF URL, route handler or `@mairie360/*-openapi` package; `tests/network-contract.test.cjs` fails if you do.

- `tests/bff.mock-servers.test.cjs` — `tests/support/front-app.cjs` runs the front in memory: it replaces `global.fetch`, routes same-origin URLs to the `src/app/**/route.ts` handlers (static segments before the catch-all, like the App Router), sends the `accessToken` cookie, and lets server-side calls reach only the allowed mock origin (anything else throws and is recorded in `violations`). BFF_Dashboard is a real local HTTP server (`ContractMockServer`) driven by `contracts/openapi.json` (= the published package): it rejects undeclared paths/methods/query params and validates mocked success responses. `afterEach` fails on any front or mock violation. `/openapi.json` / `/swagger.json` are the one deliberate out-of-contract forward (handled with `allowDeviation`).
- `tests/dashboard-page.mock-servers.test.cjs` — renders the real `src/app/page.tsx` (with the library `DashboardModule`) through `tests/support/server-view.cjs` (`react-dom/server` with hook state kept between passes, same file in every front, see `../CLAUDE.md`) on top of `FrontApp` and the BFF_Dashboard mock: loading state, data of `/dashboard/bootstrap`, unavailable sources, BFF/proxy errors and quick actions are asserted on the HTML. `installReactRuntime()` runs before the page is required.
- `tests/network-contract.test.cjs` — static AST checks: every `bffDashboard.<operation>` call must exist in the generated client of the published package and no path literal is written by hand, only `src/lib/bff-client.ts` / `src/lib/bff-proxy.ts` may call `fetch`, axios is allowed only in `src/lib/bff-client.ts`, `forwardToBff` is only called with `configuredBffUrl()`, the only `process.env.*BFF*` variables are the BFF_Dashboard ones, `contracts/` holds only `openapi.json`, the only `*openapi*` dependency is `@mairie360/bff-dashboard-openapi` pinned to `X.X.X`, and `contracts/openapi.json` deep-equals its rebuild.
- `tests/support/openapi-contract.ts`, `contract-mock-server.ts` and `orval-contract.ts` are verbatim copies of the BFFs' (`BFF_Dashboard`, `BFF_Calendar`); keep them identical rather than editing locally. They are type-checked by `next build` (tsconfig includes `**/*.ts`).

### OpenAPI contract

The single contract is the **published** `@mairie360/bff-dashboard-openapi` package (orval output, no `openapi.json` inside), pinned to an exact version in `dependencies`: a release `X.Y.Z`, or the `0.0.0-dev.<sha40>` package the CICD publishes for each commit of BFF_Dashboard `main` (used since MAIR-509 while no release is cut), or, once that commit is released on staging, the `0.0.0-staging.<sha40>` package of the same commit, preferred on a staging release for readability (MAIR-600; `scripts/contract-version.mjs` is the policy, `0.0.0-staging.<short sha>` and ranges are refused) — never the local `BFFs/BFF_Dashboard` checkout (which may hold unpublished changes). Code imports response types straight from the package (`import type { DashboardBootstrap } from '@mairie360/bff-dashboard-openapi/model'`, re-exported by `src/lib/dashboard-view.ts`); there is no generated `.d.ts` (same approach as `Login_Web_Service`). `contracts/openapi.json` (proxy allowlist, test mock) is rebuilt from the installed package by `scripts/contracts.mjs` through `tests/support/orval-contract.ts`; never hand-edit it.

```bash
npm install --save-exact @mairie360/bff-dashboard-openapi@<version>   # adopt a new published contract (release X.Y.Z, 0.0.0-dev.<sha40> or 0.0.0-staging.<sha40>)
npm run contracts:sync      # rebuild contracts/openapi.json from the installed package (--generate is an alias)
npm run contracts:check     # fail if the pin is not an accepted exact version, the install differs or the JSON drifted
```

The security/performance stacks default `BFF_DASHBOARD_IMAGE` to the `ghcr.io/mairie360/bff-dashboard` image built from the same commit (`X.Y.Z`, `dev-<sha7>` for a dev package, or `staging-<sha7>` for a staging package; a test enforces it), so bump both together. The stacks also pin dev images of the APIs and the database (BFF_Dashboard calls no other BFF since MAIR-525 and needs `CORE_API_URL`, `PROJECT_API_URL` and `CALENDAR_API_URL`): the dev Liquibase needs `-Dallow_template_admin=true`, the database enforces argon2id hashes in `init-test.sql`, the dev APIs need `JWT_ALLOW_WEAK_SECRET` for the shared test secret and `RATE_LIMIT_ENABLED=false` (plus `RATE_LIMIT_PER_SECOND=0` on Calendar API, whose per-IP token bucket otherwise answers 429 under load), and BFF_Dashboard needs `JWT_SECRET` at startup. Orval only types success responses, so the rebuilt contract declares `2XX` only: BFF error statuses are undocumented, and mocked errors in tests need `outOfContract: true`. The commands only need the package installed (`NODE_AUTH_TOKEN`). `BFF_CONTRACT_DIR` no longer exists; this differs from the other fronts' `scripts/contracts.mjs` and from `Fronts/CLAUDE.md`.

## Architecture

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `HEAD` is implied wherever `GET` is declared; `/openapi.json` and `/swagger.json` are always forwarded (GET/HEAD). The current contract only declares `/health`, `/check_apis` and `/dashboard/bootstrap`. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `DASHBOARD_BFF_URL` → `BFF_DASHBOARD_BASE_URL`; resolved at request time on the server. Missing or invalid configuration returns an uncached 503 without contacting an upstream; configure the URL explicitly for local development too.
- **Client calls** — pages call the generated operations of `@mairie360/bff-dashboard-openapi` (`bffDashboard`, an axios instance whose adapter delegates to `requestBff` in `src/lib/bff-client.ts`; the paths such as `/dashboard/bootstrap` belong to the generated functions). `requestBff` throws a plain `Error` carrying `{ error: { message } }` / `{ message }` from the body (or `Le service a répondu <status>.`); authentication relies solely on the `accessToken` cookie.
- **Logout handoff** — `src/lib/logout.ts` validates the runtime `LOGIN_FRONT_URL` and navigates to its `/logout` page. Login owns shared-cookie expiry and its BFF User logout call; Dashboard makes no logout request and does not claim upstream session revocation (MAIR-143/MAIR-226).
- `src/app/page.tsx` makes a single `bffDashboard.getDashboardBootstrap()` call (`src/lib/bff-client.ts`), maps it onto `DashboardModule` from `@mairie360/lib-components` through `src/lib/dashboard-view.ts` and shows per-source unavailability. Event dates arrive as `YYYY-MM-DD` or `DD-MM-YYYY` (BFF Calendar format, relayed unchanged): the mapper normalizes them and drops events with an unparseable `startsAt`, because `DashboardModule` formats it with `Intl` and an invalid date throws and breaks the whole page. Project/task due dates (ISO 8601 instants from BFF Project) are displayed through `formatDueDate` (`fr-FR`, fixed `Europe/Paris` zone for instants, UTC for date-only values, so output does not depend on the machine's zone). Quick actions link to other fronts via `NEXT_PUBLIC_*_FRONT_URL`; reports are explicitly marked unavailable.
- **Early session UX and security headers (MAIR-404)** — `src/middleware.ts` checks cookie presence/known JWT expiry before applying the unchanged nonce CSP. Anonymous pages open validated runtime Login; known expiry opens central `/logout`, without local cookie expiry or another BFF. Missing/unsafe Login returns uncached503. Data and metadata without a usable cookie receive JSON401/no-store, not cross-origin redirects; `/openapi.json` and `/swagger.json` are explicit matcher entries despite their extension. Opaque/present tokens still require BFF authenticity/permission checks. The browser client hands a current401 to existing Login once per Location and ignores aborted reads;403/503/network errors do not log out. No `auth-session.ts` or new route is added. Allowed pages retain dynamic rendering and nonce propagation; external origins still require an explicit CSP change.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them). Active frontend URLs are read from the runtime environment by `src/lib/front-urls.ts` and validated by `src/lib/navigation.ts`; no deployment host is inlined at build time.

### Calendar display (MAIR-386)

The MAIR-386 mapper validates civil dates before Date.parse, so impossible days
and ambiguous deadline text stay verbatim. Event HH:mm clocks must not roll into
another day. The local unusableEventCount distinguishes rejected display values
from confirmed empty collections without changing the returned BFF source status.
All-unusable events render a labelled unavailable section with the general Calendar
action; partial results retain valid events. Explicit recovery uses the existing
guarded GET only. Preserve the established UTC/Paris deadline and local-clock
policies; this does not implement user timezone preferences or server corrections.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@<sha>` pinned to a CICD commit (`package_name: dashboard-front`, `node_version: "24.21.0"`, `cicd_version` = the same sha, each followed by a `# vX.Y.Z` comment so Renovate bumps them together with `dev-dependency-exception.yml`; `tests/cicd-pin.test.cjs` checks they agree) and passes only the `CODECOV_TOKEN` and `N8N_WEBHOOK_SECRET` secrets plus the release-journal ones (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`, org secrets used by CICD to commit `RELEASE_JOURNAL.md` on `main` after each release). It runs on `pull_request`, `workflow_dispatch` and on `push` to `main` only, so a PR branch no longer runs the pipeline twice (MAIR-436). The workflow token is read-only by default (`permissions: contents: read`); only the `CICD` job gets `contents`/`packages`/`id-token: write`, the cap the reusable workflow needs for its release jobs (dev image push + cosign signature, prod tag). `tests/workflow-permissions.test.cjs` (identical in the eight fronts) pins both rules. A separate read-only `required_security_scan` job runs Semgrep and Gitleaks under the legacy required check name. The reusable pipeline runs `npm ci` → `npm run lint` + `npm audit --omit=dev --audit-level=high` (blocking; the full audit is report-only) + Semgrep/Gitleaks → `npm run build` + `npm test` (Codecov) → on `main`, builds `Dockerfile` with the token as the BuildKit secret `node_auth_token` (never a build arg), scans it with Trivy, signs it with cosign and pushes `ghcr.io/mairie360/dashboard-front:dev-<sha>`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (exact Node 24.21.0) runs `contracts:check` and `test:contracts` on every PR and on pushes to `main`.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5000`, `CMD node server.js`.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, Project API, Calendar API and BFF_Dashboard, which reads those three APIs directly since MAIR-525 — the front service only gets `DASHBOARD_BFF_URL`; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (classic spider + AJAX spider `-j`, which renders the page in a headless browser so the BFF contract routes fetched by the bundle are scanned too, + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run; since MAIR-516 the server-error rule (100000) is no longer ignored, so a 5xx relayed by the proxy fails the scan.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js` (pages, `/health`, `/dashboard/bootstrap` through the proxy, the path the page uses) with a JWT minted from `JWT_SECRET`; strict status checks and thresholds fail the run. The pinned contract has no write operation, so there is no write scenario (MAIR-516).
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` and `development.Dockerfile` are still the unmodified template (a `projects` service behind an nginx that mounts a non-existent `nginx.conf`, `npm ci` without the GitHub Packages token) and do not start this module; rely on `docker-compose-security.yml` / `docker-compose-performance.yml` for a working stack definition.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.
