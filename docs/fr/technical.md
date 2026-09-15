# Dashboard_Web_Service — Documentation technique

[Présentation du module](module.md) · [English](../en/technical.md) · [README](../../README.md)

## Architecture et traitement des requêtes

Application Next.js 15.5.25, React 19 et TypeScript avec App Router. Le navigateur appelle les routes de la même origine; le serveur Next.js relaie les données vers **BFF_Dashboard**.

```mermaid
flowchart LR
  Browser --> Next["Dashboard_Web_Service"]
  Next --> BFF["BFF_Dashboard"]
```

La page charge une seule réponse bootstrap, mappe ses données vers `DashboardModule` et affiche les indisponibilités. Les actions rapides naviguent vers les interfaces concernées. Les rapports restent annoncés comme indisponibles.

Le proxy générique lit le contrat OpenAPI versionné pour autoriser chemins et méthodes. Il conserve paramètres de requête, corps binaire, statuts et en-têtes utiles, filtre les en-têtes de transport, désactive le cache et n’effectue pas de suivi automatique des redirections. Son délai est de 15 secondes.

## Données et persistance

Les sources et limites suivantes concernent le BFF associé, dont dépend la sauvegarde des données affichées.

BFF User `/me` fournit l’identité. BFF Project fournit `/projects-page?page=1&limit=6` puis les détails de chaque projet pour les tâches. BFF Calendar fournit le bootstrap de la période; ses dates d’événements peuvent être au format `YYYY-MM-DD` ou `DD-MM-YYYY` et sont relayées telles quelles, donc `src/lib/dashboard-view.ts` les normalise et ignore un événement dont la date n’est pas affichable. Les échéances des projets et des tâches sont affichées en français (`1 déc. 2026`): les instants ISO 8601 de BFF Project prennent le jour à l’heure de Paris, les dates seules restent inchangées et une valeur non reconnue est affichée telle quelle. Le BFF ne dispose pas de base propre ni de mutations métier.

L’aperçu est limité et ne remplace pas les listes complètes des modules. Une source indisponible est signalée et les statistiques absentes restent nulles ou non affichées. Les rapports et mesures de population ou de performance ne sont pas fournis par ce contrat.

L’état React gère l’affichage et les opérations en cours. Ce dépôt ne définit pas de base métier propre; les garanties de sauvegarde sont celles du BFF et de ses sources décrites ci-dessus.

## Installation et lancement local

Utiliser Node.js 22 pour reproduire le job de contrats et npm avec le fichier de verrouillage versionné. Les versions des autres jobs et de Docker sont précisées plus bas.

Les dépendances privées `@mairie360/*` nécessitent un accès GitHub Packages. Configurer `NODE_AUTH_TOKEN` dans l’environnement avec un jeton autorisé à lire ces packages, conformément à `.npmrc`. Ne pas enregistrer la valeur dans Git.

```bash
npm ci
```

Créer `.env.local` à la racine. Exemple pour des BFF exécutés sur la même machine:

```dotenv
DASHBOARD_BFF_URL=http://localhost:4007
USER_BFF_URL=http://localhost:4000
```

Démarrer le BFF associé et BFF User pour les parcours de session, puis lancer le web service. Le port `5007` ci-dessous est un choix local explicite pour éviter les collisions; ce n’est pas une affirmation sur les ports de tous les fichiers Compose.

```bash
npm run dev -- --port 5007
```

Ouvrir `http://localhost:5007`. Pour exécuter le build avec le script Next.js:

```bash
npm run build
npm run start -- --port 5007
```

## Configuration

Les valeurs ci-dessous sont des exemples locaux ou des comportements explicitement indiqués, pas des identifiants de production.

| Variable ou priorité | Exemple / repli indiqué | Rôle |
| --- | --- | --- |
| `DASHBOARD_BFF_URL` → `BFF_DASHBOARD_BASE_URL` | http://localhost:4007 | Priorité de gauche à droite dans le proxy; l’URL indiquée est le repli local. |
| `USER_BFF_URL` → `BFF_USER_API_URL` | http://localhost:4000 | Priorité propre aux adaptateurs de session vers BFF User. |
| `BFF_CONTRACT_DIR` | ../BFF_Dashboard/contracts | Répertoire des contrats BFF pour les scripts de synchronisation et de contrôle. |
| `NEXT_PUBLIC_CALENDAR_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `NEXT_PUBLIC_FILES_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `NEXT_PUBLIC_MESSAGE_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `NEXT_PUBLIC_PROJECT_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |

Dans un conteneur, `localhost` désigne le conteneur lui-même. Utiliser le nom DNS du service BFF sur le réseau Docker, ou une adresse d’hôte accessible. Les fichiers Compose incluent parfois d’autres services et des paramètres hérités; vérifier les URL et ports effectifs avant de les employer.

## Routes et contrat de données

Inventaire extrait de `contracts/openapi.json`. Les paramètres entre accolades sont remplacés par des identifiants réels. Les types détaillés, champs requis, réponses et exemples éventuels sont définis dans ce contrat; les statuts du tableau sont ceux déclarés, sans prétendre lister toutes les erreurs de transport ou de validation.

Ces chemins de données sont exposés à la même origine par le proxy; les pages Next.js sont distinctes. `/openapi.json` et `/swagger.json` sont également relayés. L’interface Swagger `/docs` se consulte directement sur le BFF.

| Méthode | Chemin | Corps déclaré | Statuts déclarés |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| GET | `/dashboard/bootstrap` | — | 200, 401, 502, 503 |

### Pages et adaptateurs locaux

| Page | Source |
| --- | --- |
| `/` | [src/app/page.tsx](../../src/app/page.tsx) |

| Méthode | Route locale | Source |
| --- | --- | --- |
| GET | `/api/user/me` | [src/app/api/user/me/route.ts](../../src/app/api/user/me/route.ts) |
| POST | `/api/auth/logout` | [src/app/api/auth/logout/route.ts](../../src/app/api/auth/logout/route.ts) |
| GET | `/api/auth/me` | [src/app/api/auth/me/route.ts](../../src/app/api/auth/me/route.ts) |
| GET | `/api/auth/session` | [src/app/api/auth/session/route.ts](../../src/app/api/auth/session/route.ts) |

## Session, permissions et erreurs

Les adaptateurs `/api/auth/me`, `/api/auth/session` et `/api/user/me` utilisent BFF User pour la session; `/api/auth/logout` relaie la déconnexion. Le proxy générique utilise le Bearer explicite ou, en son absence, le cookie `accessToken`. Les permissions métier restent celles du BFF et de ses sources.

Le proxy générique répond 400 pour un chemin invalide, 404 pour un chemin hors contrat, 405 pour une méthode interdite et 502 si le service est injoignable ou dépasse le délai. Les réponses amont sont conservées, y compris les corps vides 204/205/304. Sur `/dashboard/bootstrap`, BFF_Dashboard conserve les statuts 4xx amont, transforme les 5xx amont en 502 et répond 503 si une URL amont n’est pas configurée; la page affiche le `error.message` de ces réponses.

Toutes les réponses portent `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` et `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy` et `Cross-Origin-Opener-Policy` (`next.config.ts`), et `X-Powered-By` est désactivé. [src/middleware.ts](../../src/middleware.ts) ajoute sur chaque page une `Content-Security-Policy` avec un nonce propre à chaque requête (il ne redirige pas les utilisateurs non authentifiés), que Next.js applique à ses scripts. Les pages sont donc rendues à la demande (`dynamic = "force-dynamic"` dans le layout). Les feuilles de style sont limitées à l'origine et au nonce ; seuls les attributs `style` rendus par les composants partagés passent par `style-src-attr 'unsafe-inline'`, et `next dev` autorise aussi `'unsafe-eval'`. Toute nouvelle ressource externe (image, police, API appelée depuis le navigateur) doit être ajoutée à la politique dans `src/lib/content-security-policy.ts`.

## Synchronisation et vérifications

Après une modification de routes ou de schémas, exporter le contrat dans **BFF_Dashboard** avec `npm run contracts:generate`, puis exécuter dans ce dépôt:

```bash
npm run contracts:sync
npm run contracts:check
npm run test:contracts
npm run lint
npm run build
```

`contracts:sync` copie le contrat BFF et régénère `src/contracts/bff.d.ts`. `contracts:check` compare aussi le BFF voisin lorsqu’il est présent; dans un checkout isolé, il vérifie les types contre la copie locale versionnée. `test:contracts` exécute les tests Node sans couverture; `npm test` exécute les mêmes tests avec un minimum de 60 % sur les lignes, branches et fonctions (rapporté sur les fichiers `.ts` grâce aux source maps).

### Tests contre des mock serveurs pilotés par les contrats

- `tests/bff.mock-servers.test.cjs` suit chaque appel de bout en bout: `fetch` same-origin du navigateur (`requestBff`) → route handler Next.js → vrai serveur HTTP local simulant le BFF. Le mock BFF_Dashboard est piloté par `contracts/openapi.json` versionné; le mock BFF User (adaptateurs de session) par le paquet installé `@mairie360/bff-user-openapi`, dont la version doit correspondre à l’image `bff-user` des stacks de sécurité et de performance. Chaque mock rejette les chemins, méthodes et paramètres de requête absents de son contrat et valide les réponses simulées; le front refuse tout appel vers une autre origine. Seule exception volontaire: `/openapi.json` / `/swagger.json`, relayés par le proxy.
- `tests/network-contract.test.cjs` analyse les sources: chaque appel `requestBff` utilise un chemin et une méthode littéraux déclarés dans `contracts/openapi.json`, chaque `userBffRequest` vise une opération BFF User pour la méthode de son handler, et `fetch` n’est appelé que par `src/lib/bff-client.ts` et `src/lib/bff-proxy.ts`. Il charge aussi chaque module `src/**/*.ts` pour que la couverture les compte.
- `tests/dashboard-view.test.cjs` vérifie le passage de `/dashboard/bootstrap` vers `DashboardModule` (`src/lib/dashboard-view.ts`) avec des données conformes au contrat.
- `tests/support/openapi-contract.ts`, `contract-mock-server.ts` et `orval-contract.ts` sont des copies à l’identique de celles des BFF (`BFF_Dashboard`, `BFF_Calendar`); les garder identiques.

Le générateur de types est fixé à `openapi-typescript@7.10.1` dans `scripts/contracts.mjs` et s’exécute via npm. Pour une modification uniquement documentaire, vérifier les liens, l’exactitude des deux langues et `git diff --check`; ne pas régénérer les contrats sans modification de leur source.

## CI/CD et exécution Docker

Le job `contracts.yml` utilise Node.js 22, `actions/checkout@v7` et `actions/setup-node@v7`. Il s’exécute sur push, pull request et lancement manuel; il installe avec `npm ci`, contrôle les contrats et lance les tests dédiés.

`cicd.yml` appelle `mairie360/CICD/.github/workflows/frontend-cicd.yml@v2.3.1`, avec `cicd_version: v2.3.1` et `node_version: "23"`. Les étapes réutilisables et les environnements GitHub déterminent les contrôles, publications et déploiements effectifs.

Le Dockerfile utilise par défaut `NODE_VERSION=23.1.0` et le build Next.js `standalone`; la commande de l’image est `["node", "server.js"]`. Le port de l’image et les mappings Compose peuvent différer du port local proposé plus haut.

Avant un lancement Docker, vérifier les variables de service, les secrets de build et les réseaux dans les fichiers du dépôt. Une CI verte valide ses jobs; elle ne prouve pas la disponibilité des services métier dans un environnement distant.

## Diagnostic

Diagnostic du BFF associé: Examiner `sources.projects`, `sources.tasks` et `sources.calendar` avant d’interpréter une liste vide. Un compteur `null` signifie une donnée indisponible. Tester la même session dans les BFF métier pour comprendre une différence de visibilité.

En cas d’erreur de proxy, comparer la route et la méthode à l’inventaire, vérifier l’URL du BFF puis la session. Pour un 401 après navigation entre modules, vérifier le cookie `accessToken`, son domaine et le service BFF User. Un 404 sur un besoin décrit dans `BACKEND.md` peut correspondre à une fonctionnalité seulement proposée.

## Repères dans le dépôt

- [src/app/page.tsx](../../src/app/page.tsx)
- [src/lib/bff-client.ts](../../src/lib/bff-client.ts)
- [src/lib/bff-proxy.ts](../../src/lib/bff-proxy.ts)
- [src/app/[...path]/route.ts](../../src/app/%5B...path%5D/route.ts)
- [src/lib/user-bff-proxy.ts](../../src/lib/user-bff-proxy.ts)
- [contracts/openapi.json](../../contracts/openapi.json)
- [src/contracts/bff.d.ts](../../src/contracts/bff.d.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Compléments historiques: [BFF.md](../../BFF.md), [BACKEND.md](../../BACKEND.md). Les besoins proposés doivent rester distincts du comportement effectivement implémenté.
