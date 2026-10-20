# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "a3ae7d8badaadcaf054e52c21e331cb231b1aabf", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "updated": {"dev": "2026-10-20 13:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `46b5af3` | — |
| dev | — | `a3ae7d8` | 2026-10-20 13:07 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- Dépendances (3 changements, sans effet visible déclaré) : le socle partagé (session, proxy, garde d'authentification, CSP, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` `0.10.2` au lieu de l'archive `@mairie360/front-kit`. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, puis à `0.0.0-dev.51b0f32…` : seule la version change dans `contracts/openapi.json`. Les images des piles de test `docker-compose*.yml` suivent ces versions. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140) ; MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136) ; MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146))
- CI et tests (4 changements) : CICD épinglé en v4.3.1 puis en v4.3.2, avec le journal des releases et un suivi Renovate des pins. Le jeton de workflow est en lecture seule par défaut et les workflows ne se lancent sur `push` que pour `main`. Le test du bundle client est durci. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142) ; MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131) ; MAIR-126, [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Dépendances (3 changements, sans effet visible déclaré) : le socle partagé (session, proxy, garde d'authentification, CSP, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` `0.10.2` au lieu de l'archive `@mairie360/front-kit`. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, puis à `0.0.0-dev.51b0f32…` : seule la version change dans `contracts/openapi.json`. Les images des piles de test `docker-compose*.yml` suivent ces versions. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140) ; MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136) ; MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146))
- CI et tests (4 changements) : CICD épinglé en v4.3.1 puis en v4.3.2, avec le journal des releases et un suivi Renovate des pins. Le jeton de workflow est en lecture seule par défaut et les workflows ne se lancent sur `push` que pour `main`. Le test du bundle client est durci. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142) ; MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131) ; MAIR-126, [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 13:07 UTC | dev | — | `a3ae7d8` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39427049770) |
| 2026-10-20 12:22 UTC | dev | — | `0d0611e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39421285177) |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
