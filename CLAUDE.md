# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 15 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting the home dashboard (aggregated projects / tasks / events). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_Dashboard**. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

## Commands

Private `@mairie360/*` packages come from GitHub Packages: `.npmrc` reads `NODE_AUTH_TOKEN`, so export a token with `read:packages` before installing or building images (the `@mairie360/bff-user-openapi` test devDependency is private too).

```bash
npm ci
npm run dev -- --port 5000         # needs the BFF(s) reachable, see "BFF URL" below
npm run build && npm run start -- --port 5000
npm run lint                             # next lint (next/core-web-vitals + next/typescript)
npm test                                 # node:test on tests/*.test.cjs + lcov in coverage/lcov.info (what CI runs)
npm run test:contracts                   # same tests, no coverage
node --test --test-name-pattern="<name>" tests/proxy.test.cjs   # single test
```

Tests are plain CommonJS `node:test` files (no Jest/Vitest, no DOM); new tests must match `tests/*.test.cjs`. They `require('./support/load-ts.cjs')` first, which transpiles `.ts` on the fly (`typescript.transpileModule`, inline source maps so `--enable-source-maps` reports coverage on `.ts` lines) and resolves the `@/*` alias. `npm test` enforces 60% lines/branches/functions, but node:test only counts files a test loads: `tests/network-contract.test.cjs` requires every `src/**/*.ts`, so a new `.ts` module must load outside Next.js; `.tsx` files are never covered, which is why page logic lives in `src/lib/dashboard-view.ts`. Source-mapped coverage marks erased lines (type imports, comments) as uncovered.

### Contract-driven tests

- `tests/bff.mock-servers.test.cjs` — `tests/support/front-app.cjs` runs the front in memory: it replaces `global.fetch`, routes same-origin URLs to the `src/app/**/route.ts` handlers (static segments before the catch-all, like the App Router), sends the `accessToken` cookie, and lets server-side calls reach only the allowed mock origins (anything else throws and is recorded in `violations`). The BFFs are real local HTTP servers (`ContractMockServer`): BFF_Dashboard from `contracts/openapi.json`, BFF User from the installed `@mairie360/bff-user-openapi` devDependency (orval output parsed by `orval-contract.ts`; pinned to the `bff-user` image version of the security/performance stacks, a test enforces it). Mocks reject undeclared paths/methods/query params and validate mocked responses; orval types only success statuses, so BFF User error replies need `outOfContract: true`. `afterEach` fails on any front or mock violation. `/openapi.json` / `/swagger.json` are the one deliberate out-of-contract forward (handled with `allowDeviation`).
- `tests/network-contract.test.cjs` — static AST checks: `requestBff` calls must use a literal path + method present in `contracts/openapi.json`, `userBffRequest` paths must exist in the BFF User contract for the enclosing `GET`/`POST` handler, and only `src/lib/bff-client.ts` / `src/lib/bff-proxy.ts` may call `fetch`. Keep call sites literal or the test fails.
- `tests/support/openapi-contract.ts`, `contract-mock-server.ts`, `orval-contract.ts` are verbatim copies of the BFFs' (`BFF_Dashboard`, `BFF_Calendar`); keep them identical rather than editing locally. They are type-checked by `next build` (tsconfig includes `**/*.ts`).

### OpenAPI contract

`contracts/openapi.json` is a committed copy of BFF_Dashboard's contract and `src/contracts/bff.d.ts` is generated from it (`openapi-typescript@7.10.1`, pinned in `scripts/contracts.mjs`). Never hand-edit either file.

```bash
BFF_CONTRACT_DIR=../../BFFs/BFF_Dashboard/contracts npm run contracts:sync   # copy the BFF contract and regenerate types
npm run contracts:generate  # regenerate types from the local snapshot
npm run contracts:check     # fail if types are stale, or if the BFF checkout at $BFF_CONTRACT_DIR has a different contract
```

The script's default source `../BFF_Dashboard/contracts` resolves to `Fronts/BFF_Dashboard`, which does not exist in the EIP checkout, so always set `BFF_CONTRACT_DIR` (without it, `check` silently skips the BFF comparison). All three commands `npm exec` `openapi-typescript`, so they need network access.

## Architecture

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `HEAD` is implied wherever `GET` is declared; `/openapi.json` and `/swagger.json` are always forwarded (GET/HEAD). The current contract only declares `/health`, `/check_apis` and `/dashboard/bootstrap`. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `DASHBOARD_BFF_URL` → `BFF_DASHBOARD_BASE_URL` (fallback `http://localhost:4007`); resolved at request time on the server.
- **Session adapters** — `src/app/api/{user/me,auth/me,auth/session,auth/logout}/route.ts` call `userBffRequest` (`src/lib/user-bff-proxy.ts`), which reuses `forwardToBff` against BFF User (`USER_BFF_URL` → `BFF_USER_API_URL`, fallback `http://localhost:4000`).
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

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, BFF User, BFF_Dashboard and its dependencies; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (spider + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js` (pages, `/health`, `/api/user/me`, `/dashboard/bootstrap` through the proxy) with a JWT minted from `JWT_SECRET`; thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` and `development.Dockerfile` are still the unmodified template (a `projects` service behind an nginx that mounts a non-existent `nginx.conf`, `npm ci` without the GitHub Packages token) and do not start this module; rely on `docker-compose-security.yml` / `docker-compose-performance.yml` for a working stack definition.
