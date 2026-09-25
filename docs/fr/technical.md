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

La sélection d’un événement à venir utilise `CALENDAR_FRONT_URL` fourni à l’exécution et ajoute les paramètres `date` (`YYYY-MM-DD`) et `event` (identifiant). Les paramètres existants sont conservés; l’action générale Calendrier ouvre toujours son URL de base. La page ne contient ni événement de démonstration ni hôte de déploiement en dur.

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

Créer `.env.local` à la racine. Exemple pour BFF_Dashboard exécuté sur la même machine:

```dotenv
DASHBOARD_BFF_URL=http://localhost:4007
```

Démarrer BFF_Dashboard (et les services dont il dépend), puis lancer le web service. Le port `5007` ci-dessous est un choix local explicite pour éviter les collisions; ce n’est pas une affirmation sur les ports de tous les fichiers Compose.

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
| `NEXT_PUBLIC_CALENDAR_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `NEXT_PUBLIC_FILES_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `NEXT_PUBLIC_MESSAGE_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `NEXT_PUBLIC_PROJECT_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |

Dans un conteneur, `localhost` désigne le conteneur lui-même. Utiliser le nom DNS du service BFF sur le réseau Docker, ou une adresse d’hôte accessible. Les fichiers Compose incluent parfois d’autres services et des paramètres hérités; vérifier les URL et ports effectifs avant de les employer.

## Routes et contrat de données

Inventaire extrait de `contracts/openapi.json`, reconstruit du paquet publié `@mairie360/bff-dashboard-openapi` (version épinglée dans `package.json`). Les paramètres entre accolades sont remplacés par des identifiants réels. Les types détaillés, champs requis, réponses et exemples éventuels sont définis dans ce contrat; le paquet, généré par orval, ne type que les réponses de succès (`2XX`): les erreurs du BFF ne figurent pas dans le contrat et sont relayées telles quelles.

Ces chemins de données sont exposés à la même origine par le proxy; les pages Next.js sont distinctes. `/openapi.json` et `/swagger.json` sont également relayés. L’interface Swagger `/docs` se consulte directement sur le BFF.

| Méthode | Chemin | Corps déclaré | Réponse de succès |
| --- | --- | --- | --- |
| GET | `/health` | — | 2XX, sans corps typé |
| GET | `/check_apis` | — | 2XX, sans corps typé |
| GET | `/dashboard/bootstrap` | — | 2XX `DashboardBootstrap` |

### Pages et adaptateurs locaux

| Page | Source |
| --- | --- |
| `/` | [src/app/page.tsx](../../src/app/page.tsx) |

Le seul route handler est le proxy [src/app/[...path]/route.ts](../../src/app/%5B...path%5D/route.ts): toutes les données passent par les opérations de `contracts/openapi.json`.

## Session, permissions et erreurs

Ce front ne consomme qu’un BFF, BFF_Dashboard, et qu’un contrat OpenAPI; il n’appelle pas BFF User directement (le prénom affiché vient de `/dashboard/bootstrap`). Le proxy générique utilise le Bearer explicite ou, en son absence, le cookie `accessToken`. Les permissions métier restent celles du BFF et de ses sources.

Le proxy générique répond 400 pour un chemin invalide, 404 pour un chemin hors contrat, 405 pour une méthode interdite et 502 si le service est injoignable ou dépasse le délai. Les réponses amont sont conservées, y compris les corps vides 204/205/304. Sur `/dashboard/bootstrap`, BFF_Dashboard répond 401 pour une session refusée et 502 si le contexte utilisateur est indisponible (et, à partir de sa branche `mair-121`, 503 si une URL amont n’est pas configurée); la page affiche le `error.message` de ces réponses.

Toutes les réponses portent `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` et `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy` et `Cross-Origin-Opener-Policy` (`next.config.ts`), et `X-Powered-By` est désactivé. [src/middleware.ts](../../src/middleware.ts) ajoute sur chaque page une `Content-Security-Policy` avec un nonce propre à chaque requête (il ne redirige pas les utilisateurs non authentifiés), que Next.js applique à ses scripts. Les pages sont donc rendues à la demande (`dynamic = "force-dynamic"` dans le layout). Les feuilles de style sont limitées à l'origine et au nonce ; seuls les attributs `style` rendus par les composants partagés passent par `style-src-attr 'unsafe-inline'`, et `next dev` autorise aussi `'unsafe-eval'`. Toute nouvelle ressource externe (image, police, API appelée depuis le navigateur) doit être ajoutée à la politique dans `src/lib/content-security-policy.ts`.

## Synchronisation et vérifications

Le seul contrat de ce front est le paquet publié `@mairie360/bff-dashboard-openapi`, épinglé sur une version exacte `X.X.X` (ni plage, ni pré-version `0.0.0-dev`/`staging`), jamais le checkout local du BFF. Pour adopter une nouvelle version publiée:

```bash
npm install --save-exact @mairie360/bff-dashboard-openapi@X.X.X
npm run contracts:sync
npm run contracts:check
npm run test:contracts
npm run lint
npm run build
```

`contracts:sync` reconstruit `contracts/openapi.json` depuis le paquet installé (sortie orval lue par `tests/support/orval-contract.ts`, partagé avec les BFF). Le code importe ses types directement du paquet (`@mairie360/bff-dashboard-openapi/model`); aucun `.d.ts` n’est généré. `contracts:check` échoue si la version n’est pas `X.X.X`, si le paquet installé diffère de `package.json`, si `contracts/openapi.json` ne correspond plus au paquet. Les stacks de sécurité et de performance utilisent l’image `ghcr.io/mairie360/bff-dashboard` de la même version (vérifié par un test). Ces commandes nécessitent le paquet installé avec `NODE_AUTH_TOKEN` (paquet privé). `test:contracts` exécute les tests Node sans couverture; `npm test` exécute les mêmes tests avec un minimum de 60 % sur les lignes, branches et fonctions (rapporté sur les fichiers `.ts` grâce aux source maps).

### Tests contre un mock serveur piloté par le contrat

- `tests/bff.mock-servers.test.cjs` suit chaque appel de bout en bout: `fetch` same-origin du navigateur (`requestBff`) → route handler Next.js → vrai serveur HTTP local simulant BFF_Dashboard, piloté par `contracts/openapi.json`, donc par le contrat publié. Le mock rejette les chemins, méthodes et paramètres de requête absents du contrat et valide les réponses de succès (les erreurs simulées sont marquées `outOfContract`, orval ne les typant pas); BFF_Dashboard est la seule origine joignable, tout autre appel fait échouer le test. Seule exception volontaire: `/openapi.json` / `/swagger.json`, relayés par le proxy.
- `tests/network-contract.test.cjs` analyse les sources: chaque appel `requestBff` utilise un chemin et une méthode littéraux déclarés dans `contracts/openapi.json` et `fetch` n’est appelé que par `src/lib/bff-client.ts` et `src/lib/bff-proxy.ts`. Il vérifie aussi qu’il n’y a qu’un contrat dans `contracts/`, que le proxy catch-all est le seul route handler, qu’il ne relaie que vers l’URL de BFF_Dashboard que le seul paquet OpenAPI installé est `@mairie360/bff-dashboard-openapi` en version `X.X.X`, et que `contracts/openapi.json` est exactement sa reconstruction. Il charge aussi chaque module `src/**/*.ts` pour que la couverture les compte.
- `tests/dashboard-view.test.cjs` vérifie le passage de `/dashboard/bootstrap` vers `DashboardModule` (`src/lib/dashboard-view.ts`) avec des données conformes au contrat.
- `tests/support/openapi-contract.ts`, `contract-mock-server.ts` et `orval-contract.ts` sont des copies à l’identique de celles des BFF (`BFF_Dashboard`, `BFF_Calendar`); les garder identiques.

Pour une modification uniquement documentaire, vérifier les liens, l’exactitude des deux langues et `git diff --check`; ne pas régénérer les contrats sans modification de leur source.

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
- [contracts/openapi.json](../../contracts/openapi.json)
- [src/lib/dashboard-view.ts](../../src/lib/dashboard-view.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Compléments historiques: [BFF.md](../../BFF.md), [BACKEND.md](../../BACKEND.md). Les besoins proposés doivent rester distincts du comportement effectivement implémenté.
