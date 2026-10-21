# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "1125ee1943524b4b35a8217f4398aaba1b4ee19a", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-21 10:54 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `1125ee1` | 2026-10-21 10:54 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

- chore(deps): update mairie360 database schema to v3.3.0 (#163) ([#163](https://github.com/mairie360/Dashboard_Web_Service/pull/163))
- chore(deps): update ghcr.io/mairie360/project-api docker tag to v1.2.0 (#162) ([#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162))
- chore(deps): update dependency mairie360/cicd to v4.4.3 (#159) ([#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159))
- chore(deps): update ghcr.io/mairie360/core-api docker tag to v2.2.0 (#161) ([#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161))
- chore(deps): update ghcr.io/mairie360/calendar-api docker tag to v1.2.0 (#160) ([#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160))
- ci: MAIR-494 CICD - Séparer la promotion staging et prod du workflow de base (#155) ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- chore(deps): update dependency mairie360/cicd to v4.4.0 (#151) ([#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151))
- fix(deps): MAIR-600 Release staging: align internal versions and deploy (#148) ([#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- fix(deps): MAIR-575 Release dev: align internal versions and deploy ([#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146))
- ci: MAIR-571 CICD - Journal des releases par repo rédigé par Claude (#142) ([#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))
- test: MAIR-126 Add generic front logic to lib (#144) ([#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- feat: MAIR-126 Add generic front logic to lib (#140) ([#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140))
- chore(deps): MAIR-571 Bump CICD to v4.3.1 (#138) ([#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138))
- ci: MAIR-436 [Audit 02/10] Tous les fronts : Node 23 en fin de vie dans les images, token en build-arg, CI trop permissive (#131) ([#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- chore(deps): MAIR-569 Aligner les fronts sur les versions prod des contrats OpenAPI de leur BFF (#136) ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Les releases staging et prod deviennent manuelles : `promote-staging.yml` et `promote-prod.yml` se lancent à la demande (`workflow_dispatch`, entrée optionnelle `sha`), sur `main` uniquement, avec un verrou par cible ; les environnements `Staging` et `Prod` gardent leur approbation. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Changements de comportement
- Un push sur `main` ne libère plus que dev : `cicd.yml` s'arrête à `release-dev` et n'attend plus les environnements `Staging` / `Prod`. Pour promouvoir, lancer `gh workflow run promote-staging.yml -R mairie360/Dashboard_Web_Service` (puis `promote-prod.yml` pour la prod). (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Technique
- Les stacks de test (`docker-compose*.yml`) passent aux images `database` et `liquibase-migrations` 3.3.0, `project-api` 1.2.0, `core-api` 2.2.0 et `calendar-api` 1.2.0 ([#163](https://github.com/mairie360/Dashboard_Web_Service/pull/163), [#162](https://github.com/mairie360/Dashboard_Web_Service/pull/162), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161), [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160)).
- `mairie360/CICD` passe de v4.3.2 à v4.4.0 puis v4.4.3 dans `cicd.yml`, `dev-dependency-exception.yml` et les deux workflows de promotion ; `renovate.json` et `tests/cicd-pin.test.cjs` suivent les quatre références ([#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159), [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155)).

## Différence staging → prod (en staging, pas encore en prod)

#### Technique
- Le contrat `@mairie360/bff-dashboard-openapi` est épinglé d'abord sur `0.0.0-dev.51b0f32…` ([#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)), puis sur `0.0.0-staging.3d74a6a…` ([#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148), MAIR-600) ; l'image `bff-dashboard` des stacks devient `staging-3d74a6a`. Le diff de #148 est tronqué : `scripts/contract-version.mjs` et les tests n'ont été lus que partiellement.
- Les stacks de test passent aux versions prod des images `bff-dashboard` 2.0.0, `core-api` 2.1.0, `project-api` 1.1.0, `calendar-api` 1.1.0, `database` et `liquibase-migrations` 3.2.0 ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), MAIR-569).
- Le socle partagé passe de `@mairie360/front-kit` (archive vendored) à `@mairie360/lib-components` 0.10.2, via ses sous-chemins `next`, `guard`, `browser`, `shared`, `react` et `theme`, sans changement de comportement annoncé ; l'archive et sa provenance sont supprimées, et `npm run test:bundle` vérifie le build client ([#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), MAIR-126). Les tests de bundle sont ajoutés ([#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144)).
- `mairie360/CICD` passe à v4.3.1 puis v4.3.2 : le journal des releases est rédigé par Claude et commité sur `main` par CICD, avec les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis au workflow ([#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142), MAIR-571).
- CI : le token du workflow est en lecture seule par défaut et seul le job `CICD` garde les droits d'écriture ; `cicd.yml` et `contracts.yml` ne se déclenchent sur `push` que pour `main` ([#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131), MAIR-436). La description de #131 indique aussi un `Dockerfile` épinglé sur Node 24.21.0 ; ce fichier n'est pas dans le diff fourni.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
