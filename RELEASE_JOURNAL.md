# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "c6d2efd40fba7b510b17d0f8eccb8ed6f287164f", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-21 10:53 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `c6d2efd` | 2026-10-21 10:53 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Changements de comportement
- Un push sur une branche de travail ne lance plus le pipeline : `cicd.yml` et `contracts.yml` ne se déclenchent sur push que pour `main`, les pull requests restent couvertes. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Un push sur `main` ne livre plus que dev : staging et prod se promeuvent à la main avec `promote-staging.yml` puis `promote-prod.yml` (`workflow_dispatch`, `sha` optionnel, environnements `Staging` et `Prod` avec approbation). (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- Chaque release réécrit `RELEASE_JOURNAL.md` sur `main` (CICD v4.3.1) ; le workflow transmet désormais `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138))

#### Technique
- Contrat `@mairie360/bff-dashboard-openapi` : épinglé successivement sur `2.0.0` ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136)), `0.0.0-dev.51b0f32…` ([#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)) puis `0.0.0-staging.3d74a6a…` ([#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148)). Le contenu du contrat est inchangé, seul le paquet épinglé change.
- Images des stacks `docker-compose*.yml` : `bff-dashboard:staging-3d74a6a`, `core-api:2.2.0`, `calendar-api:1.2.0`, `project-api:1.2.0`, `database:3.2.0`, `liquibase-migrations:3.2.0`. ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161), [#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162))
- `scripts/contract-version.mjs` accepte `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse le sha court ; diff de [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148) tronqué, lecture partielle.
- Front : `@mairie360/front-kit` retiré, imports passés à `@mairie360/lib-components/*`, lib-components `0.9.0` → `0.10.2`, archive `vendor/` supprimée. Ajout de `npm run test:bundle` dans le workflow de performance. ([#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- CICD épinglé sur v4.3.1, v4.3.2, v4.4.0 puis v4.4.3 (Renovate), avec les tests `tests/cicd-pin.test.cjs` et `tests/workflow-permissions.test.cjs`.
- `follow-redirects` 1.16.1 dans le lockfile (advisories GHSA, `npm audit`). ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- Documentation et `CLAUDE.md` mis à jour (promotion, permissions CI, Node 24.21.0).

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne livre plus staging ni prod : le pipeline s’arrête à `release-dev`. La promotion se fait à la main avec `promote-staging.yml` (qui refuse un commit sans `dev-<sha>` et un run `main` vert), puis `promote-prod.yml`. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Technique
- Images des stacks de test : `project-api` passe en `1.2.0`, `calendar-api` en `1.2.0` et `core-api` en `2.2.0`. (MAIR-…, [#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162), [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161))
- CICD monté sur v4.4.0 ([#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151)) puis v4.4.3 ([#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159)), pour la séparation de la promotion staging et prod.
- `follow-redirects` 1.16.1 dans le lockfile et groupe Renovate `mairie360/CICD` étendu aux deux workflows de promotion. ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

## Différence staging → prod (en staging, pas encore en prod)

#### Changements de comportement
- Le pipeline ne se déclenche plus sur push vers une branche de travail : `cicd.yml` et `contracts.yml` ne tournent sur push que pour `main`. Le jeton du workflow est en lecture seule par défaut, seul le job CICD reçoit `contents`, `packages` et `id-token` en écriture. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Chaque release (dev, staging, prod) réécrit `RELEASE_JOURNAL.md` sur `main` via CICD v4.3.1, avec un résumé rédigé par Claude. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138))

#### Technique
- Contrat `@mairie360/bff-dashboard-openapi` : `2.0.0` ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136)), puis `0.0.0-dev.51b0f32…` ([#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)), puis `0.0.0-staging.3d74a6a…` ([#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148)). Contenu du contrat inchangé dans les diffs.
- Stacks de test : `database` et `liquibase-migrations` en `3.2.0`, `core-api` en `2.1.0`, `project-api` et `calendar-api` en `1.1.0` ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136)).
- Front : `@mairie360/front-kit` retiré au profit de `@mairie360/lib-components` `0.10.2` (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`) ; test de bundle client ajouté. Le diff indique l’absence de changement de comportement. ([#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- CICD épinglé sur v4.3.2 puis v4.3.1 et la chaîne de tests `tests/cicd-pin.test.cjs` et `tests/ci-policy.test.cjs` suit le SHA lu dans `cicd.yml`. ([#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142), [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138))
- Documentation : Node.js 24.21.0 (CI et Dockerfile) dans `docs/` et `CLAUDE.md`. Le diff de [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148) est tronqué, lecture partielle.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 10:53 UTC | dev | — | `c6d2efd` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39584959936) |
| 2026-10-21 10:52 UTC | dev | — | `d68048e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39584951198) |
| 2026-10-21 09:44 UTC | dev | — | `a27b90d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39577868526) |
| 2026-10-21 01:43 UTC | dev | — | `af88e69` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39528097105) |
| 2026-10-20 19:04 UTC | staging | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 18:59 UTC | dev | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 13:07 UTC | dev | — | `a3ae7d8` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39427049770) |
| 2026-10-20 12:22 UTC | dev | — | `0d0611e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39421285177) |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
