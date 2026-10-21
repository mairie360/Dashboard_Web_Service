# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-10-21 11:01 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `ca5636b` | 2026-10-21 11:01 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev (`cicd.yml` s'arrête à `release-dev`). La staging et la prod ne se déploient plus automatiquement : elles se lancent à la main avec `promote-staging.yml` puis `promote-prod.yml` (`workflow_dispatch`, `-f sha=<sha>` facultatif). Staging refuse un commit sans tag `dev-<sha>` et sans run main vert ; prod refuse un commit sans tag `staging-<sha>`. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev` à `0.0.0-staging`, puis à la version publiée `2.1.0`. Les stacks de test démarrent `ghcr.io/mairie360/bff-dashboard:2.1.0`, avec `core-api` 2.2.0, `calendar-api` 1.2.0, `project-api` 1.2.0 et `database` / `liquibase-migrations` 3.3.0. (MAIR-612, [#164](https://github.com/mairie360/Dashboard_Web_Service/pull/164) ; [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161), [#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162), [#163](https://github.com/mairie360/Dashboard_Web_Service/pull/163))

#### Technique
- Front : les imports `@mairie360/front-kit` (archive vendored) deviennent des sous-chemins de `@mairie360/lib-components` 0.10.2, sans changement de comportement annoncé ; `npm run test:bundle` vérifie le build client. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- Durcissement CI : jeton en lecture seule par défaut, écriture réservée au job de release, `contracts.yml` et `cicd.yml` déclenchés sur push vers `main` uniquement. Image Dockerfile épinglée sur Node 24.21.0 et token passé en secret BuildKit (d'après la description ; diff non complet). (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- CICD épinglé sur v4.4.0 puis v4.4.3, avec les secrets du journal de release (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`) transmis au workflow réutilisable. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138) ; [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159), [#164](https://github.com/mairie360/Dashboard_Web_Service/pull/164))
- Le script `contract-version` accepte `0.0.0-staging.<sha40>` et refuse le sha court ; les tests de politique et de bundle sont mis à jour. (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148) ; MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146))
- Les tests de politique CICD lisent désormais le commit épinglé dans `cicd.yml` et vérifient le pin `<sha> # vX.Y.Z` suivi par Renovate. (MAIR-571, [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev (`cicd.yml` s'arrête à `release-dev`). La staging et la prod ne se déploient plus automatiquement : elles se lancent à la main avec `promote-staging.yml` puis `promote-prod.yml` (`workflow_dispatch`, `-f sha=<sha>` facultatif). Staging refuse un commit sans tag `dev-<sha>` et sans run main vert ; prod refuse un commit sans tag `staging-<sha>`. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-staging` à la version publiée `2.1.0`. Les stacks de test démarrent `ghcr.io/mairie360/bff-dashboard:2.1.0`, avec `core-api` 2.2.0, `calendar-api` 1.2.0, `project-api` 1.2.0 et `database` / `liquibase-migrations` 3.3.0. (MAIR-612, [#164](https://github.com/mairie360/Dashboard_Web_Service/pull/164) ; [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161), [#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162), [#163](https://github.com/mairie360/Dashboard_Web_Service/pull/163))

#### Technique
- Front : les imports `@mairie360/front-kit` (archive vendored) deviennent des sous-chemins de `@mairie360/lib-components` 0.10.2, sans changement de comportement annoncé ; `npm run test:bundle` vérifie le build client. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- Durcissement CI : jeton en lecture seule par défaut, écriture réservée au job de release, `contracts.yml` et `cicd.yml` déclenchés sur push vers `main` uniquement. Image Dockerfile épinglée sur Node 24.21.0 et token passé en secret BuildKit (d'après la description ; diff non complet). (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- CICD épinglé sur v4.4.0 puis v4.4.3, avec les secrets du journal de release (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`) transmis au workflow réutilisable. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138) ; [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159), [#164](https://github.com/mairie360/Dashboard_Web_Service/pull/164))
- Le script `contract-version` accepte `0.0.0-staging.<sha40>` et refuse le sha court ; les tests de politique et de bundle sont mis à jour. (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148) ; MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146))
- Les tests de politique CICD lisent désormais le commit épinglé dans `cicd.yml` et vérifient le pin `<sha> # vX.Y.Z` suivi par Renovate. (MAIR-571, [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 11:06 UTC | staging | — | `ca5636b` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39588977914) |
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
