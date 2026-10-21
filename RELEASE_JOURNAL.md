# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "a27b90dcf6aff8150b08865e38a4793ab3e98c06", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-21 09:44 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `a27b90d` | 2026-10-21 09:44 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Nouveautés
- Staging et prod ne se déploient plus à chaque push sur `main` : `cicd.yml` s'arrête à `release-dev`. Staging et prod se lancent à la main avec `promote-staging.yml` puis `promote-prod.yml` (entrée optionnelle `sha`), avec approbation des environnements `Staging` / `Prod`. D'après la description de la PR, le comportement vient de CICD v4.4.0, qui n'est pas visible dans ce diff. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- Le contrat `@mairie360/bff-dashboard-openapi` peut être épinglé sur `0.0.0-staging.<sha40>`. `scripts/contract-version.mjs` accepte ce format et l'associe à l'image `staging-<sha7>`, tandis que `0.0.0-staging.<sha court>` est refusé. (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))

#### Changements de comportement
- Le release journal est ajouté au pipeline : après chaque release, CICD v4.3.1 réécrit `RELEASE_JOURNAL.md` sur `main` avec un résumé rédigé par Claude, poussé par l'app Acme-Global-Bot. Les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis au workflow. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))

#### Corrections
- Avant, chaque push sur une branche de PR lançait le pipeline deux fois. Maintenant, `cicd.yml` et `contracts.yml` ne s'exécutent au `push` que sur `main`, et les PR restent couvertes par `pull_request`. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Avant, le token du workflow `cicd.yml` avait les droits en écriture sur tout le workflow. Maintenant il est en lecture seule par défaut, et seul le job `CICD` reçoit `contents`, `packages` et `id-token` en écriture. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Avant, `npm audit` échouait à chaque run sur `main` à cause de `follow-redirects`. Maintenant le lockfile épingle `follow-redirects` 1.16.1, d'après la description de la PR (le lockfile n'apparaît pas dans le diff fourni). (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Technique
- Les stacks `docker-compose*.yml` passent aux images de release : `database` et `liquibase-migrations` 3.2.0, `core-api` 2.1.0 puis 2.2.0, `project-api` 1.1.0, `calendar-api` 1.1.0 puis 1.2.0, et `bff-dashboard` 2.0.0 puis `staging-3d74a6a`. Le diff ne montre pas le code de ces images. (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148), [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161))
- Le front consomme `@mairie360/lib-components` 0.10.2 par sous-chemins (`next`, `guard`, `browser`, `shared`, `react`, `theme`) à la place de l'archive vendorisée `@mairie360/front-kit`. Un test de bundle contrôle le client construit. Aucun changement de comportement n'est annoncé. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- La CICD est épinglée à v4.4.0 dans `cicd.yml` et `dev-dependency-exception.yml`, et Renovate suit les SHA avec leur tag. Les tests de politique CI et `renovate.json` ont été adaptés. (MAIR-571, MAIR-494, [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- Le contrat BFF passe de `2.0.0` à la version staging `0.0.0-staging.3d74a6a…`, avec d'autres versions intermédiaires. Le diff ne montre que le champ `version` de `contracts/openapi.json`, donc les routes du contrat ne sont pas vérifiables ici. (MAIR-569, MAIR-575, MAIR-600, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- Tests et documentation : test de politique de pin CICD, test de bundle client, tests de permissions des workflows, et documentation du processus de promotion dans `CLAUDE.md`.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne déclenche plus de déploiement staging ni prod : `cicd.yml` s'arrête à `release-dev`. Staging se lance à la main par `promote-staging.yml` (entrée optionnelle `sha`), avec approbation de l'environnement `Staging`. D'après la description de la PR, ce comportement vient de CICD v4.4.0. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Technique
- Les stacks `docker-compose*.yml` passent `core-api` à 2.2.0 et `calendar-api` à 1.2.0. Le diff ne montre que le tag des images, pas leur code. (Renovate, [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161), [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160))
- CICD passe de v4.3.2 à v4.4.0 dans `cicd.yml` et `dev-dependency-exception.yml`. Renovate regroupe ces pins. (MAIR-494, [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151))
- Ajout des workflows `promote-staging.yml` et `promote-prod.yml`, de la règle Renovate qui couvre les trois fichiers, du test de pin CICD à huit références et de la section de promotion dans `CLAUDE.md`. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

## Différence staging → prod (en staging, pas encore en prod)

#### Changements de comportement
- Le release journal est ajouté au pipeline : après chaque release, CICD v4.3.1 réécrit `RELEASE_JOURNAL.md` sur `main` avec un résumé rédigé par Claude, poussé par l'app Acme-Global-Bot. Les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis au workflow. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))

#### Corrections
- Avant, chaque push sur une branche de PR lançait le pipeline deux fois. Maintenant, `cicd.yml` et `contracts.yml` ne s'exécutent au `push` que sur `main`, et les PR restent couvertes par `pull_request`. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Avant, le token du workflow `cicd.yml` avait les droits en écriture sur tout le workflow. Maintenant il est en lecture seule par défaut, et seul le job `CICD` reçoit `contents`, `packages` et `id-token` en écriture. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))

#### Technique
- Le contrat BFF passe à `0.0.0-staging.3d74a6a…` (MAIR-600) : `package.json`, `contracts/openapi.json` et `scripts/contract-version.mjs` acceptent le format `staging`, et les stacks utilisent l'image `bff-dashboard:staging-3d74a6a`. Le diff ne montre que le champ `version` du contrat. ([#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- Le contrat BFF était en `0.0.0-dev.51b0f32…` (MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)) avant la version staging. Les stacks utilisaient alors `bff-dashboard:dev-51b0f32`. ([#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146))
- Le front passe de `@mairie360/front-kit` (archive vendorisée) à `@mairie360/lib-components` 0.10.2 par sous-chemins, avec un test de bundle client. Aucun changement de comportement n'est annoncé. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- Les stacks passent aux images de release 3.2.0 (`database`, `liquibase-migrations`), 2.1.0 (`core-api`), 1.1.0 (`project-api`, `calendar-api`) et 2.0.0 (`bff-dashboard`), et le contrat BFF est épinglé sur `2.0.0` (MAIR-569). Le diff montre ces tags, pas le code des images. ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- CICD passe de v4.2.1 à v4.3.1 puis à v4.3.2, avec les SHA épinglés et suivis par Renovate. Les tests de politique CI sont mis à jour. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))
- `docs/en|fr/technical.md` et `CLAUDE.md` sont alignés sur Node 24.21.0 et les nouveaux déclencheurs CI. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
