# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "9c16c8c20d25aef3c55d38584b86466ef82df569", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-11-04 18:38 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `9c16c8c` | 2026-11-04 18:38 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Changements de comportement
- Le tableau de bord utilise désormais les composants partagés de la lib (`PageHeader`, `Panel`, `DataState`, `StatusBadge`, `PriorityPill`, `ProgressMeter`, `MetricCard`, `Skeleton.Card`, `LinkButton`, `RetryButton`) : une couleur par statut et par priorité dans tous les fronts. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- La navigation et l'en-tête de page viennent de la lib (`AccessibleShell` de `@mairie360/lib-components/shell`) : la navigation bureau locale, la date courante locale et la préférence de barre latérale locale sont supprimées. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Sécurité des dépendances : `follow-redirects` passe en 1.16.2 (GHSA-mrwp-f3q8-3g9p, [#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176)), Next.js et `eslint-config-next` en 16.4.2 ([#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169)), et zod remplacé par le backport vendu `vendor/zod` (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178)).
- Runtime Node 24.22.1 (Dockerfile, développement, CI, contrats) avec images de base épinglées par digest ([#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169)).
- Pipeline : CICD monté jusqu'en v5.3.1 ([#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180), [#182](https://github.com/mairie360/Dashboard_Web_Service/pull/182)), contrôle RGPD des PR ([#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97)), stacks de tests RGAA ([#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93), [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174)) et simulation RGPD ([#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181)).
- Garde-fous de CI : politique Gitleaks par chemin ([#184](https://github.com/mairie360/Dashboard_Web_Service/pull/184)), preuve de bundle par source maps côté CI ([#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178)) et tests de politique associés.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Le tableau de bord utilise désormais les composants partagés de la lib (`PageHeader`, `Panel`, `DataState`, `StatusBadge`, `PriorityPill`, `ProgressMeter`, `MetricCard`, `Skeleton.Card`, `LinkButton`, `RetryButton`) : une couleur par statut et par priorité dans tous les fronts. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- La navigation et l'en-tête de page viennent de la lib (`AccessibleShell` de `@mairie360/lib-components/shell`) : la navigation bureau locale, la date courante locale et la préférence de barre latérale locale sont supprimées. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Technique
- Sécurité des dépendances : `follow-redirects` passe en 1.16.2 (GHSA-mrwp-f3q8-3g9p, [#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176)), Next.js et `eslint-config-next` en 16.4.2 ([#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169)), et zod remplacé par le backport vendu `vendor/zod` (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178)).
- Runtime Node 24.22.1 (Dockerfile, développement, CI, contrats) avec images de base épinglées par digest ([#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169)).
- Pipeline : CICD monté jusqu'en v5.3.1 ([#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180), [#182](https://github.com/mairie360/Dashboard_Web_Service/pull/182)), contrôle RGPD des PR ([#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97)), stacks de tests RGAA ([#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93), [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174)) et simulation RGPD ([#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181)).
- Garde-fous de CI : politique Gitleaks par chemin ([#184](https://github.com/mairie360/Dashboard_Web_Service/pull/184)), preuve de bundle par source maps côté CI ([#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178)) et tests de politique associés.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-04 18:38 UTC | dev | — | `9c16c8c` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/41887984931) |
| 2026-11-04 18:24 UTC | dev | — | `2eae44a` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/41883261104) |
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
