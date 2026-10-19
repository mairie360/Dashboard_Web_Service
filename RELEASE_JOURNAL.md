# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "56f7b4dd0feb1270c186f19a30c2609ea3ae92ad", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "updated": {"dev": "2026-10-19 20:08 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `46b5af3` | — |
| dev | — | `56f7b4d` | 2026-10-19 20:08 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- CI : workflow réutilisable `mairie360/CICD` passé en v4.3.1 (ajout de l'étape Release journal, avec les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`). Le jeton du workflow est désormais en lecture seule par défaut, et seul le job `CICD` garde les droits d'écriture. `cicd.yml` et `contracts.yml` ne se déclenchent plus au push que sur `main`. Les tests de politique CI et la documentation sont mis à jour en conséquence. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138) ; MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Dépendances : `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`. Dans le diff, seule la version du contrat change. Les stacks de test `docker-compose*.yml` passent sur les images prod : `bff-dashboard:2.0.0`, `core-api:2.1.0`, `project-api:1.1.0`, `calendar-api:1.1.0`, `database` et `liquibase-migrations` en `3.2.0`. (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- CI : workflow réutilisable `mairie360/CICD` passé en v4.3.1 (ajout de l'étape Release journal, avec les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`). Le jeton du workflow est désormais en lecture seule par défaut, et seul le job `CICD` garde les droits d'écriture. `cicd.yml` et `contracts.yml` ne se déclenchent plus au push que sur `main`. Les tests de politique CI et la documentation sont mis à jour en conséquence. (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138) ; MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131))
- Dépendances : `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.c89c35c…` à `2.0.0`. Dans le diff, seule la version du contrat change. Les stacks de test `docker-compose*.yml` passent sur les images prod : `bff-dashboard:2.0.0`, `core-api:2.1.0`, `project-api:1.1.0`, `calendar-api:1.1.0`, `database` et `liquibase-migrations` en `3.2.0`. (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
