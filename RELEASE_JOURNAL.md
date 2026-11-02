# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "6177a3a1578680ddcdbde84217c9cd5e6b63f7a2", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-11-02 16:15 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `6177a3a` | 2026-11-02 16:15 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Changements de comportement
- Les panneaux du tableau de bord (projets récents, tâches en attente, événements à venir, métriques, performance, actions rapides) sont rendus avec les primitives de `@mairie360/lib-components` : en-tête `PageHeader` (titre, salutation, date), états des panneaux via `Panel` et `DataState`, badges `StatusBadge` et `PriorityPill` avec une couleur par statut, `ProgressMeter`, `MetricCard`. Ces primitives remplacent les rendus locaux. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- La coquille de page (navigation et barre latérale) vient désormais de `AccessibleShell` de `@mairie360/lib-components/shell`. Les composants locaux `desktop-navigation`, `accessible-shell`, `current-date` et `sidebar-preference` sont supprimés, et la préférence de barre latérale n'est plus gérée localement. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Les couleurs des statuts et priorités ne sont plus définies dans les règles CSS locales : `globals.css` ne garde que la mise en page et le retour à la ligne, et les couleurs viennent des tokens `--mairie-*`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Stack d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql`, `rgaa.yaml`, moteur `mairie360/CICD` épinglé à `v5.1.0`, rapport vidé à chaque run et verrou `.rgaa-run.lock`, sans effet sur l'application. (MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93) ; MAIR-768, [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174))
- Sécurité et dépendances : `zod` remplacé par le backport vendu `vendor/zod` (3.25.76+mairie360.1) avec vérification d'intégrité au `postinstall`, preuve de bundle par source maps en CI seulement, `follow-redirects` en 1.16.2, Next.js 16.4.2, Node 24.22.1 dans les Dockerfiles et la CI. (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178) ; [#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176) ; [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Workflows : checklist RGPD sur les PR (`gdpr-pr.yml`, MAIR-295, [#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97)) et montée du moteur CICD à `v4.5.0` par Renovate ([#168](https://github.com/mairie360/Dashboard_Web_Service/pull/168)).

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les panneaux du tableau de bord (projets récents, tâches en attente, événements à venir, métriques, performance, actions rapides) sont rendus avec les primitives de `@mairie360/lib-components` : en-tête `PageHeader` (titre, salutation, date), états des panneaux via `Panel` et `DataState`, badges `StatusBadge` et `PriorityPill` avec une couleur par statut, `ProgressMeter`, `MetricCard`. Ces primitives remplacent les rendus locaux. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- La coquille de page (navigation et barre latérale) vient désormais de `AccessibleShell` de `@mairie360/lib-components/shell`. Les composants locaux `desktop-navigation`, `accessible-shell`, `current-date` et `sidebar-preference` sont supprimés, et la préférence de barre latérale n'est plus gérée localement. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Les couleurs des statuts et priorités ne sont plus définies dans les règles CSS locales : `globals.css` ne garde que la mise en page et le retour à la ligne, et les couleurs viennent des tokens `--mairie-*`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Stack d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql`, `rgaa.yaml`, moteur `mairie360/CICD` épinglé à `v5.1.0`, rapport vidé à chaque run et verrou `.rgaa-run.lock`, sans effet sur l'application. (MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93) ; MAIR-768, [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174))
- Sécurité et dépendances : `zod` remplacé par le backport vendu `vendor/zod` (3.25.76+mairie360.1) avec vérification d'intégrité au `postinstall`, preuve de bundle par source maps en CI seulement, `follow-redirects` en 1.16.2, Next.js 16.4.2, Node 24.22.1 dans les Dockerfiles et la CI. (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178) ; [#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176) ; [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Workflows : checklist RGPD sur les PR (`gdpr-pr.yml`, MAIR-295, [#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97)) et montée du moteur CICD à `v4.5.0` par Renovate ([#168](https://github.com/mairie360/Dashboard_Web_Service/pull/168)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
