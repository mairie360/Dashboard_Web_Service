# Dashboard_Web_Service

Display a personalized summary of projects, tasks and events with quick links to business modules.

Afficher une synthèse personnalisée des projets, tâches et événements, avec des accès rapides aux modules métier.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The guides describe the implemented module, its current limitations, local setup, routes, data, verification and CI/CD.

`npm test` runs the existing contract/network suite and the Vitest component
suite. Use `npm run test:components` to check the dashboard's bootstrap states,
real-data rendering, keyboard focus and serious/critical axe findings alone.
The component fixtures are synthetic and stay in `tests/`; they are never
rendered in production.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Contracts and background / Contrats et compléments

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.

## Reviewed frontend packaging (MAIR-436 / #82)

Production and development use the official digest-pinned Node 24.21.0 image,
matching both consumer workflows. Export `NODE_AUTH_TOKEN` only for the build;
Compose provides the required `node_auth_token` BuildKit secret. The tracked
`.npmrc` is mounted read-only during `npm ci`; the credential is not a build
argument, copied file, or runtime secret. Keep the existing seven-day npm policy.
Production stays standalone/non-root on port 5000, with Node and curl but no
unused global package managers. The separate development Dockerfile retains
`/usr/src/projects`, user `projects`, port 3000 and `npm run dev`, now correctly
using `NODE_ENV=development`. All three Compose stacks still use the production
Dockerfile; their other services and business/test configuration are unchanged.

The 3.2.0 → 4.0.2 major shared-workflow upgrade has been reviewed: BuildKit secret
input, mandatory `npm test`, blocking Semgrep/Trivy, digest-based image promotion
and signatures are preserved without opt-outs. Version 4 removes its Dev
environment approval. This consumer retains the existing `Dev` approval in a
dedicated job **before the reusable main pipeline**; main CI now waits earlier.
PR and branch checks run when that approval job is skipped. Cancellation, failed
approval or a skipped main approval cannot authorize release. No environment
settings or shared CI code are modified; Staging/Prod gates remain unchanged.
The required legacy security status runs real blocking Semgrep and Gitleaks,
using published immutable scanner actions, alongside the shared security audit.

Run `node --test tests/ci-policy.test.cjs tests/packaging-policy.test.cjs`, then
the full tests, lint and contracts checks. Passing policy/runtime-base checks
alone does not prove a complete application image or deployed UI. Keep #82 open
until applicable green CI, integration, image/scans/signature/ZAP/k6 and the exact
compiled local copy are verified. Global MAIR-436 permissions, push filtering and
dependency criteria remain separate; no API/BFF or functional issue is closed
by this packaging slice.
