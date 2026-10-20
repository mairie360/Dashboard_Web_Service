# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-20 18:59 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `f671932` | 2026-10-20 18:59 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- Contrat BFF repinné : `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, puis `0.0.0-dev.51b0f3200f958d32b34399c30af7de24abbe979b`, puis `0.0.0-staging.3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0`.
  - Dans les diffs visibles, seule la version de `contracts/openapi.json` change ; aucune route ni donnée échangée n'est modifiée.
  - `scripts/contract-version.mjs` accepte désormais `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse toujours un sha court.
  - Les stacks `docker-compose*.yml` de test sont alignées : image `bff-dashboard` `staging-3d74a6a`, API et base sur leurs releases prod.
  - (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136) ; MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146) ; MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- Socle partagé importé depuis `@mairie360/lib-components@0.10.2` au lieu de l'archive vendorisée `@mairie360/front-kit`, sans changement de comportement annoncé.
  - Concerne le renouvellement et la reprise de session, la garde du proxy, la CSP, le thème et le contexte d'instance (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`).
  - Ajout du test `npm run test:bundle` : il vérifie que le build client n'embarque pas d'entrée inutilisée ni de code serveur de la lib.
  - (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- 3 changements de CI :
  - Jeton en lecture seule par défaut et pipeline sur `push` limité à `main` (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)).
  - Montée de `mairie360/CICD` en v4.3.1 puis v4.3.2, qui ajoute le journal des releases, avec suivi Renovate des pins par SHA (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142)).

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Technique
- Contrat BFF repinné : `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, puis `0.0.0-dev.51b0f3200f958d32b34399c30af7de24abbe979b`, puis `0.0.0-staging.3d74a6a1c8e32709fd9e41a91a661971ce1fb8a0`.
  - Dans les diffs visibles, seule la version de `contracts/openapi.json` change ; aucune route ni donnée échangée n'est modifiée.
  - `scripts/contract-version.mjs` accepte désormais `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse toujours un sha court.
  - Les stacks `docker-compose*.yml` de test sont alignées : image `bff-dashboard` `staging-3d74a6a`, API et base sur leurs releases prod.
  - (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136) ; MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146) ; MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148))
- Socle partagé importé depuis `@mairie360/lib-components@0.10.2` au lieu de l'archive vendorisée `@mairie360/front-kit`, sans changement de comportement annoncé.
  - Concerne le renouvellement et la reprise de session, la garde du proxy, la CSP, le thème et le contexte d'instance (sous-chemins `next`, `guard`, `browser`, `shared`, `react`, `theme`).
  - Ajout du test `npm run test:bundle` : il vérifie que le build client n'embarque pas d'entrée inutilisée ni de code serveur de la lib.
  - (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))
- 3 changements de CI :
  - Jeton en lecture seule par défaut et pipeline sur `push` limité à `main` (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)).
  - Montée de `mairie360/CICD` en v4.3.1 puis v4.3.2, qui ajoute le journal des releases, avec suivi Renovate des pins par SHA (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 19:04 UTC | staging | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 18:59 UTC | dev | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 13:07 UTC | dev | — | `a3ae7d8` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39427049770) |
| 2026-10-20 12:22 UTC | dev | — | `0d0611e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39421285177) |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
