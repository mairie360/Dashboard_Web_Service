# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "d1b2e797561a37b87fbf15f0ba37bd68acf3a769", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "updated": {"dev": "2026-11-02 22:59 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:06 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `ca5636b` | 2026-10-21 11:06 UTC |
| dev | — | `d1b2e79` | 2026-11-02 22:59 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

#### Nouveautés
- Le tableau de bord affiche ses titres de page, sa date, ses statuts et ses priorités avec les composants partagés de lib-components (`PageHeader`, `StatusBadge`, `PriorityPill`, `Panel`, `DataState`), avec une couleur par statut. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Changements de comportement
- La navigation latérale passe par `AccessibleShell` de `@mairie360/lib-components/shell` ; les composants locaux `accessible-shell`, `desktop-navigation`, `current-date` et `sidebar-preference` sont supprimés, et la date de la page vient du `PageHeader` de la lib. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Le module tableau de bord est recomposé en sous-composants locaux (`DashboardPage`, `DashboardModule`, lignes de projets, de tâches et d'événements) et les styles passent par les tokens `--mairie-*` ; le diff ne modifie pas l'appel `/dashboard/bootstrap`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Corrections
- Avant, `npm audit --omit=dev` échouait à cause de `follow-redirects` 1.16.0 – 1.16.1 (GHSA-mrwp-f3q8-3g9p, transmis via axios) ; maintenant le lock résout la version 1.16.2. ([#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176))
- Avant, `npm audit` signalait `zod` 3.25.76 (GHSA-mrhx-c7xc-m3w5) ; maintenant `zod` est remplacé par le backport relu `vendor/zod` (3.25.76+mairie360.1) via `file:vendor/zod` et l'override `$zod`. (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178))

#### Technique
- CI : mairie360/CICD passe de v4.4.3 à v4.5.0, puis à v5.1.0 (scans `semgrep-pypi` et `gitleaks-binary`, contrôle RGAA), puis à v5.2.2 pour les contrôles RGPD (MAIR-771, [#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180)) ; une checklist RGPD sur la description des PR est ajoutée (MAIR-295, [#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97)).
- Runtime et dépendances : Node 24.22.1 dans les Dockerfile, en CI et en développement, Next 16.4.2 et `eslint-config-next` 16.4.2 (MAIR-none, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169)) ; `.dockerignore` n'exclut plus `tests`.
- Sécurité et tests : scripts `postinstall`, `prebuild` et `pretest` vérifiant le backport zod hors ligne, source maps de bundle émises seulement par le build de mesure CI, allowlist Gitleaks par chemin pour `vendor/security-patches.json` (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178)) ; test de version de `follow-redirects` (#176).
- RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql` et `rgaa.yaml` pour la stack d'accessibilité, avec verrou `.rgaa-run.lock`, projet Compose dédié et attentes bornées à 3 minutes (MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93) ; MAIR-768, [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174)).
- Dépendances automatiques : Renovate met à jour mairie360/CICD (#168).

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le tableau de bord affiche ses titres de page, sa date, ses statuts et ses priorités avec les composants partagés de lib-components (`PageHeader`, `StatusBadge`, `PriorityPill`, `Panel`, `DataState`), avec une couleur par statut. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Changements de comportement
- La navigation latérale passe par `AccessibleShell` de `@mairie360/lib-components/shell` ; les composants locaux `accessible-shell`, `desktop-navigation`, `current-date` et `sidebar-preference` sont supprimés, et la date de la page vient du `PageHeader` de la lib. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))
- Le module tableau de bord est recomposé en sous-composants locaux (`DashboardPage`, `DashboardModule`, lignes de projets, de tâches et d'événements) et les styles passent par les tokens `--mairie-*` ; le diff ne modifie pas l'appel `/dashboard/bootstrap`. (MAIR-608, [#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

#### Corrections
- Avant, `npm audit --omit=dev` échouait à cause de `follow-redirects` 1.16.0 – 1.16.1 (GHSA-mrwp-f3q8-3g9p, transmis via axios) ; maintenant le lock résout la version 1.16.2. ([#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176))
- Avant, `npm audit` signalait `zod` 3.25.76 (GHSA-mrhx-c7xc-m3w5) ; maintenant `zod` est remplacé par le backport relu `vendor/zod` (3.25.76+mairie360.1) via `file:vendor/zod` et l'override `$zod`. (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178))

#### Technique
- CI : mairie360/CICD passe de v4.4.3 à v4.5.0, puis à v5.1.0 (scans `semgrep-pypi` et `gitleaks-binary`, contrôle RGAA), puis à v5.2.2 pour les contrôles RGPD (MAIR-771, [#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180)) ; une checklist RGPD sur la description des PR est ajoutée (MAIR-295, [#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97)).
- Runtime et dépendances : Node 24.22.1 dans les Dockerfile, en CI et en développement, Next 16.4.2 et `eslint-config-next` 16.4.2 (MAIR-none, [#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169)) ; `.dockerignore` n'exclut plus `tests`.
- Sécurité et tests : scripts `postinstall`, `prebuild` et `pretest` vérifiant le backport zod hors ligne, source maps de bundle émises seulement par le build de mesure CI, allowlist Gitleaks par chemin pour `vendor/security-patches.json` (MAIR-770, [#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178)) ; test de version de `follow-redirects` (#176).
- RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql` et `rgaa.yaml` pour la stack d'accessibilité, avec verrou `.rgaa-run.lock`, projet Compose dédié et attentes bornées à 3 minutes (MAIR-316, [#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93) ; MAIR-768, [#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174)).
- Dépendances automatiques : Renovate met à jour mairie360/CICD (#168).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
