# Contrat web service / BFF

Ce web service consomme **BFF_Dashboard**. La copie [OpenAPI](contracts/openapi.json) définit les routes et les données échangées ; les [types TypeScript](src/contracts/bff.d.ts) sont générés depuis cette copie.

## Routes implémentées

Les chemins sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Les chemins `/api/auth/*` restent des adaptateurs de session vers BFF User ; les pages Next.js sont distinctes des routes de données.

| Méthode | Route | Réponse / schéma |
| --- | --- | --- |
| GET | `/health` | 200 OK |
| GET | `/check_apis` | 200 Services disponibles |
| GET | `/dashboard/bootstrap` | 200 DashboardBootstrap |

## Mise à jour et validation

Dans le BFF associé, exécuter `npm run contracts:generate`. Dans ce web service, exécuter `npm run contracts:sync`, puis `npm run contracts:check` et `npm run test:contracts`. Les dépôts peuvent être voisins ; sinon `BFF_CONTRACT_DIR` indique le répertoire `contracts` du BFF. La CI vérifie que les types correspondent au document livré, même sans checkout du dépôt voisin.

Le générateur de types est fixé à `openapi-typescript@7.10.1`. Il est exécuté via npm ; aucun jeton privé ne figure dans les contrats.

## Sources

Configurer `USER_BFF_URL`, `PROJECT_BFF_URL` et `CALENDAR_BFF_URL`. Les projets, tâches et événements gardent les identifiants des BFF métier et leurs permissions. L’aperçu affiche jusqu’à six projets, leurs tâches en attente et six événements sur les 30 prochains jours. Les sources indisponibles sont signalées ; les statistiques non disponibles (citoyens, performance, etc.) ne sont pas inventées. Les destinations front peuvent être configurées avec `NEXT_PUBLIC_PROJECT_FRONT_URL` et `NEXT_PUBLIC_CALENDAR_FRONT_URL`.
