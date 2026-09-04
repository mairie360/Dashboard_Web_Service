# Tableau de bord — tables et routes backend

## Tables

| Table | Service propriétaire | Données utilisées par le front |
|---|---|---|
| `users` | Core | Prénom de l’utilisateur connecté |
| `projects` | Projets | Projet, statut, échéance et progression |
| `project_members` | Projets | Visibilité et responsables des projets |
| `tasks` | Projets | Tâche, priorité et échéance |
| `events` | Calendrier | Événement, lieu et date de début |
| `event_members` | Calendrier | Visibilité des événements |
| `files` | Fichiers | Nombre de documents traités |
| `citizen_service_events` | Accueil | Nombre de citoyens servis |
| `alerts` | Supervision | Alertes actives |

## Routes backend

| Méthode | Route backend | Tables |
|---|---|---|
| `GET` | `/api/v1/user/me/` | `users` |
| `GET` | `/api/v1/projects/` | `projects`, `project_members` |
| `GET` | `/api/v1/projects/{projectId}/tasks/` | `tasks` |
| `GET` | `/v1/calendar` | `events`, `event_members` |
| `GET` | `/api/v1/files/stats` | `files` |
| `GET` | `/api/v1/citizen-services/stats` | `citizen_service_events` |
| `GET` | `/api/v1/alerts` | `alerts` |
