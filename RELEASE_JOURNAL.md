# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "3dcf15339a6064e4106cdde34b10c14838d075ca", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-10-23 13:29 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `3dcf153` | 2026-10-23 13:29 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Page d'accueil : l'en-tête (titre, salutation, date) passe par le composant `PageHeader` de la lib, et chaque panneau affiche ses états (chargement, vide, indisponible) via `Panel` + `DataState`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Statuts et priorités : `StatusBadge` et `PriorityPill` donnent une couleur unique par statut dans tous les fronts ; les lignes de projets, tâches et événements utilisent les mêmes composants. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Changements de comportement
- La coquille de navigation (`AccessibleShell`) vient désormais de `@mairie360/lib-components/shell`. La navigation de bureau locale et la préférence de barre latérale propres à ce front sont supprimées. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Images et CI passent de Node 24.21.0 à 24.22.1 (Dockerfile, development.Dockerfile, workflows), digests d'image mis à jour, et Next.js / eslint-config-next passent de 16.3.8 à 16.4.2. Le `.dockerignore` n'exclut plus le dossier `tests`. (#169, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Les composants sont réorganisés en un dossier par composant (`index.ts`, tests co-localisés, `tests/component-tree-convention.test.cjs`). La PR indique aussi une dépendance à une version majeure de lib-components non encore publiée. Le diff de #158 est tronqué : lecture partielle. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Page d'accueil : l'en-tête (titre, salutation, date) passe par le composant `PageHeader` de la lib, et chaque panneau affiche ses états (chargement, vide, indisponible) via `Panel` + `DataState`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Statuts et priorités : `StatusBadge` et `PriorityPill` donnent une couleur unique par statut dans tous les fronts ; les lignes de projets, tâches et événements utilisent les mêmes composants. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Changements de comportement
- La coquille de navigation (`AccessibleShell`) vient désormais de `@mairie360/lib-components/shell`. La navigation de bureau locale et la préférence de barre latérale propres à ce front sont supprimées. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Images et CI passent de Node 24.21.0 à 24.22.1 (Dockerfile, development.Dockerfile, workflows), digests d'image mis à jour, et Next.js / eslint-config-next passent de 16.3.8 à 16.4.2. Le `.dockerignore` n'exclut plus le dossier `tests`. (#169, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Les composants sont réorganisés en un dossier par composant (`index.ts`, tests co-localisés, `tests/component-tree-convention.test.cjs`). La PR indique aussi une dépendance à une version majeure de lib-components non encore publiée. Le diff de #158 est tronqué : lecture partielle. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
