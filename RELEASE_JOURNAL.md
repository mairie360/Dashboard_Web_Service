# Journal des releases — Dashboard_Web_Service

<!-- release-journal-state {"dev": "2fdcf10faca5503d58abb06187c826e74641a753", "prod": "ca5636b1c6bfb4b718b7390e7261057759a2e672", "prod_tag": "v1.6.0", "staging": "2fdcf10faca5503d58abb06187c826e74641a753", "updated": {"dev": "2026-11-12 17:07 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-11-12 19:05 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.6.0 | `ca5636b` | 2026-10-21 11:08 UTC |
| staging | — | `2fdcf10` | 2026-11-12 19:05 UTC |
| dev | — | `2fdcf10` | 2026-11-12 17:07 UTC |

## Ajouté sur main depuis la dernière release prod (v1.6.0)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#188](https://github.com/mairie360/Dashboard_Web_Service/pull/188))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#186) ([#186](https://github.com/mairie360/Dashboard_Web_Service/pull/186))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#167) ([#167](https://github.com/mairie360/Dashboard_Web_Service/pull/167))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#184) ([#184](https://github.com/mairie360/Dashboard_Web_Service/pull/184))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#182](https://github.com/mairie360/Dashboard_Web_Service/pull/182))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#180) ([#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180))
- fix(security): MAIR-770 Administrator, Dashboard, Messages, Settings : porter le correctif zod et la preuve de bundle par source maps ([#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#93) ([#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#97) ([#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#168) ([#168](https://github.com/mairie360/Dashboard_Web_Service/pull/168))
- fix(security): patch Node.js and Next.js (#169) ([#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#188](https://github.com/mairie360/Dashboard_Web_Service/pull/188))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#186) ([#186](https://github.com/mairie360/Dashboard_Web_Service/pull/186))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#167) ([#167](https://github.com/mairie360/Dashboard_Web_Service/pull/167))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#184) ([#184](https://github.com/mairie360/Dashboard_Web_Service/pull/184))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#182](https://github.com/mairie360/Dashboard_Web_Service/pull/182))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#181](https://github.com/mairie360/Dashboard_Web_Service/pull/181))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#180) ([#180](https://github.com/mairie360/Dashboard_Web_Service/pull/180))
- fix(security): MAIR-770 Administrator, Dashboard, Messages, Settings : porter le correctif zod et la preuve de bundle par source maps ([#178](https://github.com/mairie360/Dashboard_Web_Service/pull/178))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#176](https://github.com/mairie360/Dashboard_Web_Service/pull/176))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#174](https://github.com/mairie360/Dashboard_Web_Service/pull/174))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#93) ([#93](https://github.com/mairie360/Dashboard_Web_Service/pull/93))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#97) ([#97](https://github.com/mairie360/Dashboard_Web_Service/pull/97))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#168) ([#168](https://github.com/mairie360/Dashboard_Web_Service/pull/168))
- fix(security): patch Node.js and Next.js (#169) ([#169](https://github.com/mairie360/Dashboard_Web_Service/pull/169))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#158](https://github.com/mairie360/Dashboard_Web_Service/pull/158))

> Résumé Claude indisponible pour ce passage : listes brutes des commits.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-12 19:05 UTC | staging | — | `2fdcf10` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/43285870497) |
| 2026-11-12 17:07 UTC | dev | — | `2fdcf10` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/43264188266) |
| 2026-11-04 21:26 UTC | dev | — | `cb3ee74` | [run](https://github.com/mairie360/Dashboard_Web_Service/actions/runs/41914808837) |
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
