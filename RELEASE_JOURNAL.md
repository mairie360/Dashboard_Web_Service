# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "d68048ed9c2bcbf2011e250cd7290630ba75975b", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-21 10:52 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `d68048e` | 2026-10-21 10:52 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- Contrat BFF : `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c` à `2.0.0` (MAIR-569), puis à `0.0.0-staging.3d74a6a` (MAIR-600). Dans les diffs fournis, `contracts/openapi.json` ne change que son champ `version` : aucune route ni aucun champ n'est modifié. ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- Stacks Docker de test : les images des APIs et de la base passent sur leurs releases (`core-api` 2.1.0, `project-api` 1.1.0, `calendar-api` 1.2.0, `database` et `liquibase-migrations` 3.2.0), et `bff-dashboard` sur `staging-3d74a6a`. ([#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148), [#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160), [#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161))
- Front : `@mairie360/front-kit` vendorisé est remplacé par `@mairie360/lib-components` 0.10.2, importé par sous-chemins (`next`, `guard`, `shared`, `react`, `theme`, `browser`), et l'archive `vendor/mairie360-front-kit-0.1.0.tgz` est supprimée. La PR annonce aucun changement de comportement, mais la montée de 0.9.0 à 0.10.2 n'est pas vérifiable depuis le diff. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140))
- Test de bundle `npm run test:bundle` ajouté au workflow de performance : il échoue si une entrée inutilisée ou du code serveur de la lib arrive dans `.next/static`. (MAIR-126, [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- Processus de release : CICD v4.4.0 arrête un push sur `main` à `release-dev`. Staging et prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml` (environnements `Staging` et `Prod`). ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))
- CICD : versions épinglées successives v4.2.1, v4.3.1 (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138)), v4.3.2 (MAIR-571, [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142)). Le journal des releases (`RELEASE_JOURNAL.md`) est réécrit sur `main` par CICD, avec les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`.
- CI : `cicd.yml` et `contracts.yml` tournent en push sur `main` seulement, le token du workflow est en lecture seule par défaut, et seul le job d'appel au pipeline de release a les droits d'écriture (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)).
- Dépendances : `follow-redirects` 1.16.1 dans le lockfile, ce qui débloque `npm audit` sur `main` (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c). ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

## Différence dev → staging (en dev, pas encore en staging)

Aucun changement fonctionnel visible dans cette plage.

#### Technique
- Processus de release : CICD v4.4.0 arrête un push sur `main` à `release-dev`. Staging et prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml`, avec un verrou par cible. ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155), MAIR-494)
- CICD épinglée à v4.4.0 (`cicd.yml`, `dev-dependency-exception.yml`), puis à v4.4.3 (commit `6d1599e`) dans les trois workflows dont les deux promotions. ([#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151), [#159](https://github.com/mairie360/Dashboard_Web_Service/pull/159))
- Stacks Docker de test : `core-api` passe à `2.2.0` ([#161](https://github.com/mairie360/Dashboard_Web_Service/pull/161)) et `calendar-api` à `1.2.0` ([#160](https://github.com/mairie360/Dashboard_Web_Service/pull/160)).
- `renovate.json` et `tests/cicd-pin.test.cjs` suivent les huit références CICD, et `CLAUDE.md` décrit la promotion. ([#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

## Différence staging → prod (en staging, pas encore en prod)

Aucun changement fonctionnel visible pour les utilisateurs dans cette plage. Le diff ne montre pas de route, de champ, de règle ou d'écran modifié côté front.

#### Technique
- Contrat BFF : `@mairie360/bff-dashboard-openapi` est épinglé sur `0.0.0-staging.3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0`, avec l'image `staging-3d74a6a` dans les stacks. `scripts/contract-version.mjs` accepte désormais le format `staging`. Le contrat est le même commit BFF. ([#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- Contrat BFF : pin intermédiaire sur `0.0.0-dev.51b0f32` (MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)), remplacé ensuite par le paquet staging.
- Front : imports `@mairie360/front-kit/*` remplacés par `@mairie360/lib-components/*`, dont la version passe de 0.9.0 à 0.10.2 ([#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140)). L'archive vendorisée est supprimée. Les tests `test:bundle` vérifient les entrées de la lib présentes dans le build client ([#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144)).
- CICD : v4.3.1 avec les secrets du journal de release ([#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138)), puis v4.3.2 ([#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142)). Le journal `RELEASE_JOURNAL.md` est réécrit sur `main` après chaque release.
- CI sécurisée : push sur `main` seulement, token en lecture seule par défaut, droits d'écriture limités au job de release (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)).
- Contrat BFF : `2.0.0` épinglé à la place du dev `c89c35c` (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136)), dans `package.json`, `contracts/openapi.json` et les stacks.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
