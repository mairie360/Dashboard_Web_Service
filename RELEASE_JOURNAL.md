# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "d312c56a08b7dafcd767f369d81b7340371f8c15", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "updated": {"dev": "2026-10-19 22:13 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `46b5af3` | — |
| dev | — | `d312c56` | 2026-10-19 22:13 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- Le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est désormais importé depuis les sous-chemins de `@mairie360/lib-components` épinglé à `0.10.2`, au lieu de l'archive `@mairie360/front-kit` versionnée dans `vendor/`. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev` à `2.0.0`, et les images des stacks `docker-compose*.yml` passent sur leurs releases prod. Aucun changement de comportement visible n'apparaît dans les diffs. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140) ; MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- Trois commits de CI et de tests :
  - workflows en lecture seule par défaut et lancés sur `push` vers `main` uniquement (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)) ;
  - CICD passé en v4.3.1 avec l'étape de journal de release (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138)) ;
  - test `npm run test:bundle` qui vérifie le contenu du bundle client, renforcé par une analyse AST TypeScript (MAIR-126, [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144)).

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est désormais importé depuis les sous-chemins de `@mairie360/lib-components` épinglé à `0.10.2`, au lieu de l'archive `@mairie360/front-kit` versionnée dans `vendor/`. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev` à `2.0.0`, et les images des stacks `docker-compose*.yml` passent sur leurs releases prod. Aucun changement de comportement visible n'apparaît dans les diffs. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140) ; MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- Trois commits de CI et de tests :
  - workflows en lecture seule par défaut et lancés sur `push` vers `main` uniquement (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)) ;
  - CICD passé en v4.3.1 avec l'étape de journal de release (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138)) ;
  - test `npm run test:bundle` qui vérifie le contenu du bundle client, renforcé par une analyse AST TypeScript (MAIR-126, [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
