# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-21 11:01 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `ca5636b` | 2026-10-21 11:01 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev. Staging et prod se déclenchent à la main via `promote-staging.yml` et `promote-prod.yml` (`gh workflow run promote-staging.yml -R mairie360/Dashboard_Web_Service [-f sha=<sha>]`). (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- `cicd.yml` et `contracts.yml` ne tournent plus sur push que pour `main`, et les branches de PR ne sont couvertes que par `pull_request`. Le token du workflow est en lecture seule par défaut, et seul le job `CICD` reçoit les droits d'écriture. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- `scripts/contract-version.mjs` accepte désormais `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse `0.0.0-staging.<sha court>`. (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))

#### Technique
- Contrat `@mairie360/bff-dashboard-openapi` épinglé en `2.1.0` (`contracts/openapi.json` et `package.json`), et stacks de test sur `ghcr.io/mairie360/bff-dashboard:2.1.0`. (MAIR-612, [#164](https://github.com/mairie360/Dashboard_Web_Service/pull/164))
- Images des stacks de test : `core-api` 2.2.0 ([#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161)), `calendar-api` 1.2.0 ([#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160)), `project-api` 1.2.0 ([#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162)), `database` et `liquibase-migrations` 3.3.0 ([#163](https://github.com/mairie360/Dashboard_Web_Service/pull/163)).
- CICD épinglé de v4.3.2 à v4.4.3 (`cicd.yml`, `dev-dependency-exception.yml`, `promote-*.yml`). Les secrets du journal de release (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`) sont transmis. (MAIR-571 et MAIR-494, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142), [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159))
- Le front n'utilise plus le paquet vendoré `@mairie360/front-kit` : il importe `@mairie360/lib-components` 0.10.2 par sous-chemins, et un test `test:bundle` vérifie le build client. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- Tests de politique CI (`cicd-pin.test.cjs`, `workflow-permissions.test.cjs`) et règle Renovate sur `cicd_version` / `cicd_ref`, avec le test de bundle AST.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev : staging et prod passent par `promote-staging.yml` et `promote-prod.yml`, lancés à la main. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Technique
- Les stacks de test démarrent le BFF `ghcr.io/mairie360/bff-dashboard:2.1.0` au lieu de `staging-3d74a6a`. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-staging.3d74a6a...` à `2.1.0`, et `contracts/openapi.json` ne change que sa version. (MAIR-612, [#164](https://github.com/mairie360/Dashboard_Web_Service/pull/164))
- Images des stacks de test : `core-api` 2.2.0 ([#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161)), `calendar-api` 1.2.0 ([#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160)), `project-api` 1.2.0 ([#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162)), `database` et `liquibase-migrations` 3.3.0 ([#163](https://github.com/mairie360/Dashboard_Web_Service/pull/163)).
- CICD épinglé de v4.3.2 à v4.4.0 puis v4.4.3 dans `cicd.yml`, `dev-dependency-exception.yml` et les workflows de promotion. (MAIR-494, [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159))

## Différence staging → prod (en staging, pas encore en prod)

#### Changements de comportement
- `scripts/contract-version.mjs` accepte `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse `0.0.0-staging.<sha court>`. Les contrôles de contrat qui utilisaient un sha court échoueront. (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- `cicd.yml` et `contracts.yml` ne tournent plus sur push que pour `main`. Le token du workflow est en lecture seule par défaut. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))

#### Technique
- Stacks de test alignées sur les releases prod : BFF `2.0.0`, `database` et `liquibase-migrations` 3.2.0, `core-api` 2.1.0, `project-api` 1.1.0, `calendar-api` 1.1.0. (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- Le BFF passe par le paquet dev `0.0.0-dev.51b0f32` (image `dev-51b0f32`), puis par `0.0.0-staging.3d74a6a...` (image `staging-3d74a6a`). Le diff de #148 est tronqué : seules les parties visibles ont été vérifiées. (MAIR-575 et MAIR-600, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- CICD épinglé à v4.3.1 puis v4.3.2, avec les secrets du journal de release (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`) et la règle Renovate associée. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))
- Le front n'utilise plus le paquet vendoré `@mairie360/front-kit` : il importe `@mairie360/lib-components` 0.10.2 par sous-chemins (aucun changement de comportement annoncé). Un test `test:bundle` est ajouté au workflow de performance. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 11:01 UTC | dev | — | `ca5636b` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39587327950) |
| 2026-10-21 10:54 UTC | dev | — | `1125ee1` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39585017375) |
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
