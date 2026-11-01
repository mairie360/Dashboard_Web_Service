# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "02c189baff8e5677e67ac238ad90ee8ab7093832", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-10-23 13:32 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `02c189b` | 2026-10-23 13:32 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Le shell de navigation et la date de page viennent désormais de `@mairie360/lib-components` (`AccessibleShell`, `PageHeader`). (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Les statuts des projets et les priorités s'affichent avec `StatusBadge` et `PriorityPill`, avec une seule couleur par statut. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Les panneaux du tableau de bord gèrent leurs états (chargement, vide, indisponible) via `Panel` et `DataState`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Changements de comportement
- La navigation latérale et la gestion du cookie de préférence de la sidebar ne sont plus locales : `accessible-shell.tsx`, `desktop-navigation.tsx`, `current-date.tsx` et `sidebar-preference.ts` sont supprimés, et `configureSidebarCookieDomain` de la lib est utilisé. (MAIR-578 / MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- La mise en page et les couleurs changent : `globals.css` ne garde que la mise en page, les couleurs viennent des tokens `--mairie-*`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Le commit est marqué `feat!`, mais le diff visible ne modifie ni route ni champ de l'API BFF_Dashboard. Le diff est tronqué, la liste peut donc être incomplète. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Corrections
- Mise à jour de sécurité de Node.js (24.21.0 vers 24.22.1) et de Next.js (16.3.8 vers 16.4.2, advisory GHSA-673q-mjm6-r5xr). Avant : Node 24.21.0 et Next 16.3.8. Maintenant : Node 24.22.1 dans le Dockerfile, le development.Dockerfile et la CI, Next 16.4.2 et eslint-config-next 16.4.2. (Carolin Hugo, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))

#### Technique
- Workflows CI mis à jour vers `mairie360/CICD` v4.5.0 (tests d'intégration MAIR-262 côté CICD), via Renovate. (renovate[bot], [#168](https://github.com/mairie360/Dashboard_Web_Service/pull/168))
- Le dossier `tests` n'est plus exclu du contexte Docker (`.dockerignore`). (Carolin Hugo, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Convention d'arborescence des composants (un dossier par composant, `index.ts`, test co-localisé), documentée et testée par `tests/component-tree-convention.test.cjs`. (Quentin Tennerel, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le shell de navigation et la date de page viennent désormais de `@mairie360/lib-components` (`AccessibleShell`, `PageHeader`). (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Les statuts des projets et les priorités s'affichent avec `StatusBadge` et `PriorityPill`, avec une seule couleur par statut. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Les panneaux du tableau de bord gèrent leurs états (chargement, vide, indisponible) via `Panel` et `DataState`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Changements de comportement
- La navigation latérale et la gestion du cookie de préférence de la sidebar ne sont plus locales : `accessible-shell.tsx`, `desktop-navigation.tsx`, `current-date.tsx` et `sidebar-preference.ts` sont supprimés, et `configureSidebarCookieDomain` de la lib est utilisé. (MAIR-578 / MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- La mise en page et les couleurs changent : `globals.css` ne garde que la mise en page, les couleurs viennent des tokens `--mairie-*`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Le commit est marqué `feat!`, mais le diff visible ne modifie ni route ni champ de l'API BFF_Dashboard. Le diff est tronqué, la liste peut donc être incomplète. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Corrections
- Mise à jour de sécurité de Node.js (24.21.0 vers 24.22.1) et de Next.js (16.3.8 vers 16.4.2, advisory GHSA-673q-mjm6-r5xr). Avant : Node 24.21.0 et Next 16.3.8. Maintenant : Node 24.22.1 dans le Dockerfile, le development.Dockerfile et la CI, Next 16.4.2 et eslint-config-next 16.4.2. (Carolin Hugo, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))

#### Technique
- Workflows CI mis à jour vers `mairie360/CICD` v4.5.0 (tests d'intégration MAIR-262 côté CICD), via Renovate. (renovate[bot], [#168](https://github.com/mairie360/Dashboard_Web_Service/pull/168))
- Le dossier `tests` n'est plus exclu du contexte Docker (`.dockerignore`). (Carolin Hugo, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- Convention d'arborescence des composants (un dossier par composant, `index.ts`, test co-localisé), documentée et testée par `tests/component-tree-convention.test.cjs`. (Quentin Tennerel, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
