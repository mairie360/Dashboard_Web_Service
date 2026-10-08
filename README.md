# Dashboard_Web_Service

## Published shared library — 9 October 2026

This frontend pins the real `@mairie360/lib-components@0.6.11` artifact published from library main `f2433185c5f52125698428b2610701a834efccf4`. Registry integrity and downloaded distribution files were verified. Only the exact UI pin and its root/package lock entries change; other dependencies, published BFF contracts, layouts, security and RGAA controls remain unchanged. Cross-consumer tests and browser evidence are recorded separately from main/dev delivery.

Dependency selection uses verified immutable registry metadata because npm 11.15 rejects the fresh release under the existing seven-day chooser and warns that its existing internal UI exclusion key is unsupported. Configuration remains unchanged; a normal locked installation must verify this candidate.

Ce front utilise le paquet réellement publié 0.6.11. Le verrou reprend les métadonnées et l’intégrité vérifiées du registre, sans changer les autres dépendances, la politique sept jours ou les contrats publiés. Installation, contrôles du consommateur, intégration main, snapshot et recette dev restent des étapes distinctes.


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

MAIR-455 / [issue #84](https://github.com/mairie360/Dashboard_Web_Service/issues/84):
failed bootstrap reads and unavailable sources offer explicit keyboard/click
recovery using the same published GET. One read runs at a time; confirmed cards
stay visible after a new refusal, and unmounted/aborted responses are ignored.
There is no automatic retry, invented data, new API/BFF operation or deployment
approval. Quick actions remain absent as required by MAIR-209.

MAIR-404 / [issue #87](https://github.com/mairie360/Dashboard_Web_Service/issues/87):
anonymous pages open configured Login before business reads; known expiry and a
current401 delegate to its existing Logout flow once. Aborted reads cannot
navigate,403/503/network failures stay recoverable. Data/metadata without a
usable cookie return uncachedJSON401, not a cross-origin redirect. Nonce CSP,
static headers and the one-BFF boundary remain unchanged. This is presence/expiry
UX gating, not signature validation, deployed authorization or server revocation.
No local cookie-domain setting or Dashboard logout endpoint is added.

Pages anonymes versLogin avant lecture métier ; expiration connue/401 courant
versLogout central une seule fois. Lectures annulées sans navigation,403/503/pannes
récupérables ; données/metadata sans cookie utilisable en401JSON uncached. Pas
validation de signature/droits déployés ou révocation serveur, ni deuxièmeBFF,
COOKIE_DOMAIN local ou replay. API/BFF, contrats et mécanisme Login inchangés.

Only the frontend service in the isolated security/performance Compose files
sets the existing Login URL to reserved `http://login.invalid/`. The unchanged
anonymous readiness probe accepts307 without following it; no real Login is
contacted or authenticated by this configuration. Authenticated ZAP/k6 requests,
all API/BFF services, scanning policies and deployment environments are unchanged.

MAIR-386 also guards invalid calendar display: impossible civil days and ambiguous
deadline text remain verbatim, never guessed by Date.parse. Unusable event dates
and HH:mm clocks are distinguished from confirmed empty collections; valid events
and Calendar navigation remain. Explicit bootstrap GET recovery reuses the existing
request guard. UTC/Paris deadline rules and the local event-clock representation
are preserved, not replaced with guessed account preferences or demo records.

MAIR-386 distingue aussi une date civile impossible ou une échéance ambiguë d’un
jour reconnu : valeur conservée telle quelle, sans jour inventé. Événements illisibles
signalés sans faux état vide, événements valides/navigation Calendrier conservés,
reprise explicite par le GET bootstrap existant. Aucun changement API/BFF ou de fuseau.

The composed candidate includes the reviewed packaging (#83) and published UI
pin (#86) alongside read recovery (#85). Cross-flow regressions cover initial
refusal, partial-source confirmation, another refusal, and confirmed empty data;
card navigation and logout errors remain independent of read recovery. Existing
security audits and the Dev approval stay blocking. Isolated checks do not imply
green remote CI, integration, image/deployment validation or refreshed local-current.

Paired reference QA (MAIR-180) also retains the 1.5rem vertical content inset on
desktop. The shared shell's desktop padding otherwise moves Dashboard's title
and cards down by 8.5px at the reference 17px scale. A Dashboard-only root class
and scoped CSS restore the original inset; mobile padding, requests, shared
library defaults and other consumers are unchanged.

La recette appariée (MAIR-180) conserve aussi la marge intérieure verticale de
1,5rem sur desktop : le shell partagé décalait titre et cartes de 8,5px à l’échelle
de référence de 17px. Classe racine et CSS propres à Dashboard rétablissent cette
marge, sans changer le mobile, les requêtes, la bibliothèque ou les autres fronts.

Sidebar presentation follows [MAIR-182](https://mairie-360.atlassian.net/browse/MAIR-182)
and [issue #32](https://github.com/mairie360/Dashboard_Web_Service/issues/32):
the published navigation retains 44px minimum rows and the reference's lateral
shadow. The rules are scoped to Dashboard; the mobile sidebar stays below its
published Close button. No navigation implementation, role, identity, notification
or fictional version is copied from the prototype. Matching sidebar geometry
does not certify every header paint detail or deployed authorization.

La présentation de la sidebar suit MAIR-182 / issue #32 : lignes de 44px minimum
et ombre latérale de la référence, limitées à Dashboard. Dans le tiroir mobile,
la sidebar reste sous le bouton Fermer publié. Aucun rôle, identité, notification
ou numéro de version fictif n'est recopié ; la parité visuelle globale et les
autorisations déployées ne sont pas certifiées par cette seule correction.

The Dashboard content also retains the reference's opaque `#f5f3f0` background.
A transparent shared-shell main otherwise reveals a header shadow hidden by
the old content paint. This consumer-only rule does not change the shared
header's shadow token, position, stacking, menus or the mobile navigation.

Le contenu Dashboard conserve aussi le fond opaque `#f5f3f0` de la référence.
Un main transparent laissait voir une ombre du header recouverte par l'ancien
contenu. Cette règle propre au consommateur ne change ni l'ombre partagée,
ni la position ou l'empilement du header, ses menus ou la navigation mobile.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Contracts and background / Contrats et compléments

### Consistent card destinations (MAIR-182 / issue #32)

Project/Calendar card commands reuse the common navigation's existing runtime
URL validator. Invalid destinations behave like absent configuration without
throwing or navigating; valid HTTP(S) destinations retain query parameters and
received project/task/event IDs. There is no new React state/effect, request,
route, fallback, published contract, environment variable or API/BFF change.
The real-page HTTP tests cover all six commands with valid contract-backed
cards and configuration faults; no demonstration data is shipped.

Les cartes Projets/Calendrier utilisent le même validateur que la navigation
commune. Une destination invalide reste indisponible sans exception ni replay ;
les paramètres/identifiants des liens valides sont conservés. Les autres critères
MAIR-182 (rôle publié, vraie session Dev et intégration) restent distincts : ce
correctif ne suffit pas à clôturer le ticket ni à certifier les modules cibles.

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
## Shared UI alignment / Alignement UI partagé — MAIR-180

This consumer pins the published `@mairie360/lib-components@0.6.10`, including
its exact download URL and SHA512 integrity. Only the shared UI entry changes
in the lockfile; all other dependencies and security policies are preserved.
Tracking: [MAIR-180](https://mairie-360.atlassian.net/browse/MAIR-180) and
[cross-frontend issue](https://github.com/mairie360/Login_Web_Service/issues/142).
Login stays standalone without header/sidebar/footer; authenticated module
shells and the existing Elearning confirmation/rating features are preserved.
No API/BFF, contract, runtime configuration, demo data or deployment approval change.

Le pin exact et l'intégrité du package publié sont alignés sur Elearning sans
le rétrograder. Les tests de release vérifient le manifeste, le lockfile et le
vrai package installé. Une validation isolée ne remplace pas la CI verte,
l'intégration des sept consommateurs et la recette de la copie locale livrée.
## Dependency runtime maintenance — MAIR-436

Next and its matching lint config update to the patched maintenance release
`16.3.8`. The Next-scoped sharp override resolves `0.35.5` (librsvg `2.63.2`),
and the compatible transitive source-map-js lock resolves `1.2.2`. Only these
packages and their Next/sharp platform packages change; the global PostCSS
`8.5.28` override, published Dashboard contract and shared UI pins stay unchanged.
Six bounded runtime tests check installed/locked versions, ordinary SVG
rendering and ordinary source-map mapping. No exploit fixture is included.
The public seven-day release delay and all audit/RGAA/main protections remain
unchanged. Remaining braces findings still block the audit and integration;
this partial maintenance does not complete MAIR-436 or certify a release.
