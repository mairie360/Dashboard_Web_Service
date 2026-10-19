# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "9330b63f72c10aa48b1736a61b941b6efce68da1", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "updated": {"dev": "2026-10-19 21:58 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `46b5af3` | — |
| dev | — | `9330b63` | 2026-10-19 21:58 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- 2 mises à jour de dépendances sans changement de comportement visible :
  - le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est désormais importé depuis les sous-chemins de `@mairie360/lib-components` `0.10.2` (au lieu de `0.9.0`), qui remplace l'archive vendorisée `@mairie360/front-kit`. Un test `npm run test:bundle` vérifie le bundle client. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140))
  - le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`. Les images des stacks `docker-compose*.yml` sont alignées sur les releases prod (`bff-dashboard` `2.0.0`, `core-api` `2.1.0`, `project-api` `1.1.0`, `calendar-api` `1.1.0`, `database`/`liquibase-migrations` `3.2.0`). (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- 2 changements de CI :
  - le jeton du workflow est en lecture seule par défaut, seul le job `CICD` garde les droits d'écriture, et `cicd.yml`/`contracts.yml` ne se déclenchent plus sur push que pour `main`. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
  - le workflow réutilisable passe en CICD v4.3.1, avec l'étape de journal des releases et ses secrets. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- 2 mises à jour de dépendances sans changement de comportement visible :
  - le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) est désormais importé depuis les sous-chemins de `@mairie360/lib-components` `0.10.2` (au lieu de `0.9.0`), qui remplace l'archive vendorisée `@mairie360/front-kit`. Un test `npm run test:bundle` vérifie le bundle client. (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140))
  - le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`. Les images des stacks `docker-compose*.yml` sont alignées sur les releases prod (`bff-dashboard` `2.0.0`, `core-api` `2.1.0`, `project-api` `1.1.0`, `calendar-api` `1.1.0`, `database`/`liquibase-migrations` `3.2.0`). (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))
- 2 changements de CI :
  - le jeton du workflow est en lecture seule par défaut, seul le job `CICD` garde les droits d'écriture, et `cicd.yml`/`contracts.yml` ne se déclenchent plus sur push que pour `main`. (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
  - le workflow réutilisable passe en CICD v4.3.1, avec l'étape de journal des releases et ses secrets. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
