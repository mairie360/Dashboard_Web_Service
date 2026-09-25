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

**One front = one BFF = one contract.** This front only talks to BFF_Dashboard through `contracts/openapi.json`: the catch-all proxy is the only route handler, and there are no session adapters towards BFF User (the first name comes from `/dashboard/bootstrap`). Don't add another BFF URL, route handler or `@mairie360/*-openapi` package; `tests/network-contract.test.cjs` fails if you do.

- `tests/bff.mock-servers.test.cjs` — `tests/support/front-app.cjs` runs the front in memory: it replaces `global.fetch`, routes same-origin URLs to the `src/app/**/route.ts` handlers (static segments before the catch-all, like the App Router), sends the `accessToken` cookie, and lets server-side calls reach only the allowed mock origin (anything else throws and is recorded in `violations`). BFF_Dashboard is a real local HTTP server (`ContractMockServer`) driven by `contracts/openapi.json` (= the published package): it rejects undeclared paths/methods/query params and validates mocked success responses. `afterEach` fails on any front or mock violation. `/openapi.json` / `/swagger.json` are the one deliberate out-of-contract forward (handled with `allowDeviation`).
- `tests/dashboard-page.mock-servers.test.cjs` — renders the real `src/app/page.tsx` (with the library `DashboardModule`) through `tests/support/server-view.cjs` (`react-dom/server` with hook state kept between passes, same file in every front, see `../CLAUDE.md`) on top of `FrontApp` and the BFF_Dashboard mock: loading state, data of `/dashboard/bootstrap`, unavailable sources, BFF/proxy errors and quick actions are asserted on the HTML. `installReactRuntime()` runs before the page is required.
- `tests/network-contract.test.cjs` — static AST checks: `requestBff` calls must use a literal path + method present in `contracts/openapi.json`, only `src/lib/bff-client.ts` / `src/lib/bff-proxy.ts` may call `fetch`, `forwardToBff` is only called with `configuredBffUrl()`, the only `process.env.*BFF*` variables are the BFF_Dashboard ones, `contracts/` holds only `openapi.json`, the only `*openapi*` dependency is `@mairie360/bff-dashboard-openapi` pinned to `X.X.X`, and `contracts/openapi.json` deep-equals its rebuild. Keep call sites literal or the test fails.
- `tests/support/openapi-contract.ts`, `contract-mock-server.ts` and `orval-contract.ts` are verbatim copies of the BFFs' (`BFF_Dashboard`, `BFF_Calendar`); keep them identical rather than editing locally. They are type-checked by `next build` (tsconfig includes `**/*.ts`).

### OpenAPI contract

The single contract is the **published** `@mairie360/bff-dashboard-openapi` package (orval output, no `openapi.json` inside), pinned to an exact `X.X.X` in `dependencies` — never a range, a `0.0.0-dev/staging` prerelease or the local `BFFs/BFF_Dashboard` checkout (which may hold unreleased changes). Code imports response types straight from the package (`import type { DashboardBootstrap } from '@mairie360/bff-dashboard-openapi/model'`, re-exported by `src/lib/dashboard-view.ts`); there is no generated `.d.ts` (same approach as `Login_Web_Service`). `contracts/openapi.json` (proxy allowlist, test mock) is rebuilt from the installed package by `scripts/contracts.mjs` through `tests/support/orval-contract.ts`; never hand-edit it.

```bash
npm install --save-exact @mairie360/bff-dashboard-openapi@X.X.X   # adopt a new published contract
npm run contracts:sync      # rebuild contracts/openapi.json from the installed package (--generate is an alias)
npm run contracts:check     # fail if the pin is not X.X.X, the install differs or the JSON drifted
```

The security/performance stacks default `BFF_DASHBOARD_IMAGE` to `ghcr.io/mairie360/bff-dashboard:<same X.X.X>` (a test enforces it), so bump both together. Orval only types success responses, so the rebuilt contract declares `2XX` only: BFF error statuses are undocumented, and mocked errors in tests need `outOfContract: true`. The commands only need the package installed (`NODE_AUTH_TOKEN`). `BFF_CONTRACT_DIR` no longer exists; this differs from the other fronts' `scripts/contracts.mjs` and from `Fronts/CLAUDE.md`.

## Architecture

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `HEAD` is implied wherever `GET` is declared; `/openapi.json` and `/swagger.json` are always forwarded (GET/HEAD). The current contract only declares `/health`, `/check_apis` and `/dashboard/bootstrap`. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `DASHBOARD_BFF_URL` → `BFF_DASHBOARD_BASE_URL` (fallback `http://localhost:4007`); resolved at request time on the server.
- **Client calls** — pages call same-origin paths (e.g. `/dashboard/bootstrap`) through `requestBff` (`src/lib/bff-client.ts`), which throws a plain `Error` carrying `{ error: { message } }` / `{ message }` from the body (or `Le service a répondu <status>.`); authentication relies solely on the `accessToken` cookie.
- `src/app/page.tsx` makes a single `requestBff('/dashboard/bootstrap')` call (`src/lib/bff-client.ts`), maps it onto `DashboardModule` from `@mairie360/lib-components` through `src/lib/dashboard-view.ts` and shows per-source unavailability. Event dates arrive as `YYYY-MM-DD` or `DD-MM-YYYY` (BFF Calendar format, relayed unchanged): the mapper normalizes them and drops events with an unparseable `startsAt`, because `DashboardModule` formats it with `Intl` and an invalid date throws and breaks the whole page. Project/task due dates (ISO 8601 instants from BFF Project) are displayed through `formatDueDate` (`fr-FR`, fixed `Europe/Paris` zone for instants, UTC for date-only values, so output does not depend on the machine's zone). Quick actions link to other fronts via `NEXT_PUBLIC_*_FRONT_URL`; reports are explicitly marked unavailable.
- **Security headers** — `src/middleware.ts` (matcher excludes `/api`, `/_next/*` and paths with a dot) only sets a per-request nonce `Content-Security-Policy` (built in `src/lib/content-security-policy.ts`, forwarded to Next.js via request headers); there is no auth gate and no `auth-session.ts`, so unauthenticated users are not redirected by this app. `src/app/layout.tsx` forces dynamic rendering for that reason: a prerendered page would carry no nonce and its scripts would be blocked. Any new external origin (images, fonts, browser-side API calls) must be added to that policy.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them). The `NEXT_PUBLIC_*_FRONT_URL` links used by `page.tsx` are inlined at **build time** (defaults `https://<module>.dev.mairie360-eip.fr/`), so changing them requires a rebuild.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@v2.3.1` (`package_name: dashboard-front`, `node_version: "23"`, `cicd_version: v2.3.1`, kept in sync by Renovate, `secrets: inherit`). Up to the dev release it runs: `npm ci` → `npm run lint` + `npm audit --audit-level=high` (high/critical advisories block) → `npm run build` → `npm test --if-present` (uploads `coverage/lcov.info` to Codecov) → on `main`, builds `Dockerfile` with `NODE_AUTH_TOKEN` as build-arg and pushes `ghcr.io/mairie360/dashboard-front:dev-<sha>` / `dev-latest`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (Node 22) runs `contracts:check` and `test:contracts` on every push/PR.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5000`, `CMD node server.js`.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, and BFF_Dashboard with the BFFs it aggregates — BFF User/Project/Calendar are there for BFF_Dashboard, the front service only gets `DASHBOARD_BFF_URL`; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (spider + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js` (pages, `/health`, `/dashboard/bootstrap` through the proxy) with a JWT minted from `JWT_SECRET`; thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` and `development.Dockerfile` are still the unmodified template (a `projects` service behind an nginx that mounts a non-existent `nginx.conf`, `npm ci` without the GitHub Packages token) and do not start this module; rely on `docker-compose-security.yml` / `docker-compose-performance.yml` for a working stack definition.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.
