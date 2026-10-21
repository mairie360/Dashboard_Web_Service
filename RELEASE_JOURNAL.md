# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "af88e699a50a8a5fe29f355521d24bb439bce4c1", "prod": "46b5af3cdec66ac0860e4ceeb91f63f359a0fda4", "prod_tag": "v1.5.0", "staging": "f6719326a93bfbfff94cc41f6a6d07465def06b2", "updated": {"dev": "2026-10-21 01:43 UTC", "staging": "2026-10-20 19:04 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.5.0 | `46b5af3` | — |
| staging | — | `f671932` | 2026-10-20 19:04 UTC |
| dev | — | `af88e69` | 2026-10-21 01:43 UTC |

## Ajouté sur main depuis la dernière release prod (v1.5.0)

#### Technique
- Le front n'utilise plus l'archive vendorisée `@mairie360/front-kit` : ses imports passent aux sous-chemins de `@mairie360/lib-components` 0.10.2, sans changement de comportement attendu (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140)). Un test de bundle client (`npm run test:bundle`, lancé par le workflow de performance) vérifie que le build ne contient que les entrées de la lib utilisées par le front (MAIR-126, [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144)).
- Le contrat `@mairie360/bff-dashboard-openapi` est repointé plusieurs fois : de la version 2.0.0 à un paquet `0.0.0-dev.51b0f32...` (MAIR-569 puis MAIR-575, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136), [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)), puis à `0.0.0-staging.3d74a6a...` (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148)). Les stacks de test suivent ces versions (images BFF, API et base de données).
- `cicd.yml` et `dev-dependency-exception.yml` suivent la CICD v4.3.1, puis v4.3.2 (journal des releases, secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis au workflow réutilisable), puis v4.4.0 (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138), [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142), [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151)).
- Le pipeline se déclenche sur `push` vers `main` uniquement, le jeton du workflow est en lecture seule par défaut et seul le job d'appel au pipeline de release reçoit les droits d'écriture. `contracts.yml` suit la même règle de déclenchement (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)).
- Les promotions staging et prod sont séparées du workflow de base, avec `promote-staging.yml` et `promote-prod.yml` (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155)).

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne déclenche plus la promotion vers staging ni vers prod : `cicd.yml` s'arrête à `release-dev`. Staging et prod se promeuvent à la main avec `gh workflow run promote-staging.yml` puis `gh workflow run promote-prod.yml` (option `-f sha=<sha>` pour un commit donné), sous réserve de l'approbation des environnements `Staging` et `Prod`. (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155))

#### Technique
- `follow-redirects` passe en 1.16.1 dans le lockfile pour corriger trois avis `npm audit` de niveau high, selon la description de la PR (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155)).
- Le workflow réutilisable `mairie360/CICD` passe à la v4.4.0 dans `cicd.yml` et `dev-dependency-exception.yml`, mise à jour faite par Renovate (MAIR-494, [#151](https://github.com/mairie360/Dashboard_Web_Service/pull/151)).

## Différence staging → prod (en staging, pas encore en prod)

#### Technique
- Le contrat `@mairie360/bff-dashboard-openapi` passe de `0.0.0-dev.51b0f32...` à `0.0.0-staging.3d74a6a...`, avec le même commit du BFF ; le contrat lui-même ne change pas. Le contrôle de version accepte désormais `0.0.0-staging.<sha40>` et refuse le sha court. Les stacks de test pointent sur `bff-dashboard:staging-3d74a6a` (MAIR-600, [#148](https://github.com/mairie360/Dashboard_Web_Service/pull/148)).
- Le contrat et les images BFF des stacks sont passés sur une version dev puis sur staging (MAIR-575, [#146](https://github.com/mairie360/Dashboard_Web_Service/pull/146)).
- Le journal des releases est activé dans le pipeline CICD v4.3.2 : `RELEASE_JOURNAL.md` est réécrit sur `main` après chaque release (MAIR-571, [#142](https://github.com/mairie360/Dashboard_Web_Service/pull/142)).
- Les imports `@mairie360/front-kit` deviennent des sous-chemins de `@mairie360/lib-components` 0.10.2, sans changement de comportement. Un test de bundle client est ajouté au workflow de performance (MAIR-126, [#140](https://github.com/mairie360/Dashboard_Web_Service/pull/140) et [#144](https://github.com/mairie360/Dashboard_Web_Service/pull/144)).
- Le pipeline passe à la CICD v4.3.1, avec les secrets du journal de releases transmis au workflow réutilisable (MAIR-571, [#138](https://github.com/mairie360/Dashboard_Web_Service/pull/138)).
- Le CI se déclenche sur `push` vers `main` uniquement, le jeton est en lecture seule par défaut et seul le job d'appel au pipeline reçoit les droits d'écriture (MAIR-436, [#131](https://github.com/mairie360/Dashboard_Web_Service/pull/131)).
- Les stacks de test passent sur les images prod de la base, de Liquibase, de core-api, de project-api, de calendar-api et du BFF (versions 3.2.0, 2.1.0, 1.1.0 et 2.0.0). Le contrat est déclaré en 2.0.0 (MAIR-569, [#136](https://github.com/mairie360/Dashboard_Web_Service/pull/136)).
- La CICD est épinglée au commit `038bd5b` (v4.4.0) dans la branche de promotion ; cette version est référencée par les workflows `promote-*` (MAIR-494, [#155](https://github.com/mairie360/Dashboard_Web_Service/pull/155)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 01:43 UTC | dev | — | `af88e69` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39528097105) |
| 2026-10-20 19:04 UTC | staging | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 18:59 UTC | dev | — | `f671932` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39478689845) |
| 2026-10-20 13:07 UTC | dev | — | `a3ae7d8` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39427049770) |
| 2026-10-20 12:22 UTC | dev | — | `0d0611e` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39421285177) |
| 2026-10-19 22:13 UTC | dev | — | `d312c56` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39332799208) |
| 2026-10-19 21:58 UTC | dev | — | `9330b63` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39330896810) |
| 2026-10-19 20:08 UTC | dev | — | `56f7b4d` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39315966559) |
<!-- release-journal-history:end -->
