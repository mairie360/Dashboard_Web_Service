# Contrat web service / BFF

Ce web service consomme **BFF_Dashboard** à travers son contrat publié `@mairie360/bff-dashboard-openapi`, épinglé en version `X.X.X` dans `package.json`. Le document [OpenAPI](contracts/openapi.json) est reconstruit depuis ce paquet et définit les routes et les données échangées ; les types TypeScript sont importés directement du paquet (`@mairie360/bff-dashboard-openapi/model`).

## Routes implémentées

Les chemins sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Ce web service ne consomme que BFF_Dashboard et ce seul contrat ; les pages Next.js sont distinctes des routes de données.

| Méthode | Route | Réponse / schéma |
| --- | --- | --- |
| GET | `/health` | 2XX |
| GET | `/check_apis` | 2XX |
| GET | `/dashboard/bootstrap` | 2XX DashboardBootstrap |

## Mise à jour et validation

Le BFF publie son contrat à chaque release. Dans ce web service, épingler la nouvelle version (`npm install --save-exact @mairie360/bff-dashboard-openapi@X.X.X`), puis exécuter `npm run contracts:sync`, `npm run contracts:check` et `npm run test:contracts`. Le checkout local du BFF n’est jamais utilisé comme source : la CI vérifie que le document et les types correspondent au paquet installé.

Aucun générateur de types n’est utilisé ; aucun jeton privé ne figure dans les contrats.

## Sources

Configurer côté BFF_Dashboard `USER_BFF_URL`, `PROJECT_BFF_URL` et `CALENDAR_BFF_URL` ; le web service ne connaît que `DASHBOARD_BFF_URL`. Les projets, tâches et événements gardent les identifiants des BFF métier et leurs permissions. L’aperçu affiche jusqu’à six projets, leurs tâches en attente et six événements sur les 30 prochains jours. Les sources indisponibles sont signalées ; les statistiques non disponibles (citoyens, performance, etc.) ne sont pas inventées. Les destinations front peuvent être configurées avec `NEXT_PUBLIC_PROJECT_FRONT_URL` et `NEXT_PUBLIC_CALENDAR_FRONT_URL`.
