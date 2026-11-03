# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "7f7b54f33de833d515217ea5e5ef6a047f42e391", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-11-03 14:57 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `7f7b54f` | 2026-11-03 14:57 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Changements de comportement
- Tableau de bord : les blocs de statut, de priorité, les barres de progression, l'en-tête de page et les cartes de métriques utilisent désormais les composants partagés de `@mairie360/lib-components`, avec une couleur par statut identique sur tous les fronts. La feuille `globals.css` ne garde que la mise en page, donc le rendu de la page d'accueil change. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158), diff partiellement tronqué)
- Navigation : le menu latéral est celui de la lib (`AccessibleShell`). Les composants locaux `desktop-navigation`, `accessible-shell`, `current-date` et `sidebar-preference` sont retirés du front. (MAIR-578 / MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Sécurité Node.js et Next.js : Node 24.22.1 dans les Dockerfiles et la CI, Next.js et eslint-config-next passent de 16.3.8 à 16.4.2, et `tests` n'est plus exclu du contexte Docker. (MAIR-? , [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Zod : remplacement de zod 3.25.76 par un backport vendorisé (3.25.76+mairie360.1) ; `postinstall`, `prebuild` et `pretest` vérifient l'intégrité du vendor, et les source maps ne sont produites que pour la mesure CI de provenance du bundle. (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178))
- follow-redirects forcé en 1.16.2 dans le lock (GHSA-mrwp-f3q8-3g9p), avec un test de politique. (sans ticket Jira, [#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176))
- Stack d'accessibilité RGAA : projet Compose dédié, boucles de readiness bornées, rapport remis à zéro à chaque run, verrou `.rgaa-run.lock`. (MAIR-768, [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174)) Stack RGAA des états de pages et `init-accessibility.sql`. (MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93))
- Checklist RGPD sur les PR (`gdpr-pr.yml`, CICD v4.12.2 puis v5.3.0 par Renovate) et ajout de `ANTHROPIC_WORKSPACE_ID` dans `promote-prod.yml`. (MAIR-295, [#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97) ; MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93))
- Simulation d'usage RGPD (`docker-compose-gdpr-simulation.yml`, `gdpr-simulation.yaml`, `gdpr-journey.yaml`, `gdpr_simulation_test.sh`), stack de test sans port publié. (MAIR-497, [#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181))
- Pins CICD : v5.2.2 (MAIR-771, [#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180)) puis v5.3.0 (MAIR-497, [#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181)) ; mise à jour Renovate de CICD en v4.5.0 (#168), remplacée ensuite.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Tableau de bord : les blocs de statut, de priorité, les barres de progression, l'en-tête de page et les cartes de métriques utilisent désormais les composants partagés de `@mairie360/lib-components`, avec une couleur par statut identique sur tous les fronts. La feuille `globals.css` ne garde que la mise en page, donc le rendu de la page d'accueil change. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158), diff partiellement tronqué)
- Navigation : le menu latéral est celui de la lib (`AccessibleShell`). Les composants locaux `desktop-navigation`, `accessible-shell`, `current-date` et `sidebar-preference` sont retirés du front. (MAIR-578 / MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Sécurité Node.js et Next.js : Node 24.22.1 dans les Dockerfiles et la CI, Next.js et eslint-config-next passent de 16.3.8 à 16.4.2, et `tests` n'est plus exclu du contexte Docker. (sans ticket Jira, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Zod : remplacement de zod 3.25.76 par un backport vendorisé (3.25.76+mairie360.1) ; `postinstall`, `prebuild` et `pretest` vérifient l'intégrité du vendor, et les source maps ne sont produites que pour la mesure CI de provenance du bundle. (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178))
- follow-redirects forcé en 1.16.2 dans le lock (GHSA-mrwp-f3q8-3g9p), avec un test de politique. (sans ticket Jira, [#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176))
- Stack d'accessibilité RGAA : projet Compose dédié, boucles de readiness bornées, rapport remis à zéro à chaque run, verrou `.rgaa-run.lock`. (MAIR-768, [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174)) États de pages RGAA et `init-accessibility.sql`. (MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93))
- Checklist RGPD sur les PR (`gdpr-pr.yml`, CICD v4.12.2 puis v5.3.0 par Renovate) et ajout de `ANTHROPIC_WORKSPACE_ID` dans `promote-prod.yml`. (MAIR-295, [#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97) ; MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93))
- Simulation d'usage RGPD (`docker-compose-gdpr-simulation.yml`, `gdpr-simulation.yaml`, `gdpr-journey.yaml`, `gdpr_simulation_test.sh`), stack de test sans port publié. (MAIR-497, [#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181))
- Pins CICD : v5.2.2 (MAIR-771, [#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180)) puis v5.3.0 (MAIR-497, [#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181)) ; mise à jour Renovate de CICD en v4.5.0 (#168), remplacée ensuite.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-03 14:57 UTC | dev | — | `7f7b54f` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/41656746423) |
| 2026-11-02 22:59 UTC | dev | — | `d1b2e79` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/41540132568) |
| 2026-11-02 16:15 UTC | dev | — | `6177a3a` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/41478326106) |
| 2026-10-23 13:32 UTC | dev | — | `02c189b` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39961113450) |
| 2026-10-23 13:29 UTC | dev | — | `3dcf153` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39960571044) |
| 2026-10-21 11:08 UTC | prod | v1.6.0 | `ca5636b` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39589508014) |
| 2026-10-21 11:06 UTC | staging | — | `ca5636b` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39588977914) |
| 2026-10-21 11:01 UTC | dev | — | `ca5636b` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/39587327950) |
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
