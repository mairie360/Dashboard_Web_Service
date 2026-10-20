# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "0d0611e5e69689bb078ff72ba0f8f44cb6b8ad6c", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "updated": {"dev": "2026-10-20 12:22 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `46b5af3` | — |
| dev | — | `0d0611e` | 2026-10-20 12:22 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- 3 changements de dépendances sans effet visible annoncé. Le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est désormais importé depuis les sous-chemins `next`, `guard`, `browser`, `shared`, `react` et `theme` de `@mairie360/lib-components` `0.10.2`, à la place de l'archive vendorisée `@mairie360/front-kit`. Un nouveau contrôle `npm run test:bundle` vérifie le bundle client. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, et les images des stacks `docker-compose*.yml` de test passent sur leurs versions prod. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144) ; MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- 3 changements de CI. Le jeton des workflows est en lecture seule par défaut, avec les droits d'écriture réservés au job `CICD`. `cicd.yml` et `contracts.yml` ne se lancent plus sur push que pour `main`. `mairie360/CICD` passe en v4.3.1 puis v4.3.2, avec l'étape de journal des releases et le suivi Renovate des épinglages par SHA. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131) ; MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- 3 changements de dépendances sans effet visible annoncé. Le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est désormais importé depuis les sous-chemins `next`, `guard`, `browser`, `shared`, `react` et `theme` de `@mairie360/lib-components` `0.10.2`, à la place de l'archive vendorisée `@mairie360/front-kit`. Un nouveau contrôle `npm run test:bundle` vérifie le bundle client. Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`, et les images des stacks `docker-compose*.yml` de test passent sur leurs versions prod. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140), [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144) ; MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- 3 changements de CI. Le jeton des workflows est en lecture seule par défaut, avec les droits d'écriture réservés au job `CICD`. `cicd.yml` et `contracts.yml` ne se lancent plus sur push que pour `main`. `mairie360/CICD` passe en v4.3.1 puis v4.3.2, avec l'étape de journal des releases et le suivi Renovate des épinglages par SHA. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131) ; MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 12:22 UTC | dev | — | `0d0611e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39421285177) |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
