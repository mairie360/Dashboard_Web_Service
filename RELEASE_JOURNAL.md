# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "updated": {"dev": "2026-10-20 18:59 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `46b5af3` | — |
| dev | — | `f671932` | 2026-10-20 18:59 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- 4 mises à jour de dépendances, sans changement visible attendu : le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, puis `0.0.0-dev.51b0f32…`, puis `0.0.0-staging.3d74a6a…` (seul le champ `version` de `contracts/openapi.json` change dans les diffs). `scripts/contract-version.mjs` accepte désormais les paquets `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse toujours un sha court. Les images des stacks de test (`docker-compose*.yml`) suivent ces versions, et l'ancienne archive `@mairie360/front-kit` est remplacée par les sous-chemins de `@mairie360/lib-components` `0.10.2` (au lieu de `0.9.0`), présentée comme sans changement de comportement. Un contrôle `npm run test:bundle` s'ajoute aussi. (MAIR-569, MAIR-575, MAIR-600, MAIR-126, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148), [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140))
- 4 changements CI et tests : le jeton du workflow est en lecture seule par défaut, le pipeline ne tourne sur `push` que pour `main`, CICD passe en v4.3.1 puis v4.3.2 avec les secrets du journal de releases et un épinglage suivi par Renovate, et l'analyse du bundle client est renforcée. (MAIR-436, MAIR-571, MAIR-126, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131), [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- 4 mises à jour de dépendances, sans changement visible attendu : le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, puis `0.0.0-dev.51b0f32…`, puis `0.0.0-staging.3d74a6a…` (seul le champ `version` de `contracts/openapi.json` change dans les diffs). `scripts/contract-version.mjs` accepte désormais les paquets `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse toujours un sha court. Les images des stacks de test (`docker-compose*.yml`) suivent ces versions, et l'ancienne archive `@mairie360/front-kit` est remplacée par les sous-chemins de `@mairie360/lib-components` `0.10.2` (au lieu de `0.9.0`), présentée comme sans changement de comportement. Un contrôle `npm run test:bundle` s'ajoute aussi. (MAIR-569, MAIR-575, MAIR-600, MAIR-126, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148), [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140))
- 4 changements CI et tests : le jeton du workflow est en lecture seule par défaut, le pipeline ne tourne sur `push` que pour `main`, CICD passe en v4.3.1 puis v4.3.2 avec les secrets du journal de releases et un épinglage suivi par Renovate, et l'analyse du bundle client est renforcée. (MAIR-436, MAIR-571, MAIR-126, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131), [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 18:59 UTC | dev | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 13:07 UTC | dev | — | `a3ae7d8` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39427049770) |
| 2026-10-20 12:22 UTC | dev | — | `0d0611e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39421285177) |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
