# Backend — Tableau de bord

Correspondance front/BFF : [BFF.md](BFF.md). Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

Les tables sont des sources ou des besoins cibles, pas un script SQL. Les références interservices (`user_id`, `file_id`, etc.) sont logiques : elles n'imposent pas de clé étrangère entre bases distinctes. Les BFF doivent à terme passer par les API propriétaires ; les accès SQL directs et replis mémoire actuels sont signalés. Les permissions restent contrôlées par le serveur.

## Tables communes

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Core `users` | `id` ; `first_name`, `last_name`, `email`, `phone_number`, `status`, `is_archived`, `first_connect`. `password` reste exclusivement côté serveur | SQL observé |
| Core `roles`, `user_roles` | `roles.id`, `roles.name` ; association `user_roles(user_id, role_id)` vers `users.id` et `roles.id` | SQL observé |
| Core `groups`, `group_users` | `groups.id`, `owner_id`, `name`, `description` ; association `group_users(group_id, user_id)` ; nomenclature cible commune basée sur Core | SQL observé dans Core ; divergence `group_members` dans les BFF User/Calendar/Project à résoudre, pas une seconde table cible |
| Core `sessions` | `id`, `user_id`, `created_at`, `expires_at`, `device_info`, `ip_address`, `revoked_at` ; `token_hash` interne, jamais exposé. Dernière connexion dérivée des sessions, pas de la date courante | SQL observé ; vue `v_sessions` utilisée par Core |
| Core `user_profiles` | `user_id` unique vers `users.id` ; `avatar_file_id` vers Files `files.id`, `service_id` vers `services.id`, `position`, `biography` ; `address`, `city` seulement pour compatibilité des anciens profils | Proposé ; ne pas dupliquer identité, mot de passe ou rôles |
| Core `services` | `id`, `code` unique, `name`, `active` ; même annuaire pour Paramètres, Administration, Calendrier, contacts et membres de projets | Proposé ; distinct des groupes d'habilitation |
| Core `notifications` | `id`, `user_id`, `type`, `title`, `body`, `resource_type`, `resource_id`, `created_at`, `read_at` ; source du compteur commun | Proposé ; distinct des préférences `user_notification_settings` |

## Tables du module

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Project `projects`, `project_members`, `tasks` | Même source que Projets ; nom, statut, progression calculée sur tâches, échéance réelle, priorité ; date réelle de clôture pour le trimestre | SQL observé dans BFF Project ; dates/clôture/échéance projet à compléter |
| Calendar `events`, `event_members`, `calendar_event_metadata` | Même source que Calendrier ; nom, début/fin, lieu, service ; dates/heures et événements à venir | SQL observé dans BFF Calendar |
| Files `files`, `document_processing_events` | files.id ; événement `id`, `file_id`, `processed_by`, `processed_at`, `result` ; source des documents traités, pas simple nombre de fichiers | Proposé ; même source que Fichiers |
| Accueil `citizen_service_events`, `service_cases` | Événement `id`, `citizen_id`, `handled_by`, `service_id`, `occurred_at` ; dossier `id`, `opened_at`, `closed_at`, `service_id` pour délai | Proposé ; domaine propriétaire et règle citoyens distincts/visites à valider |
| Core `alerts` | `id`, `type`, `status`, `service_id` éventuel, `created_at`, `resolved_at` ; alertes actives du périmètre autorisé | Proposé ; distinct des notifications lues/non lues |

## Routes backend communes

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Core `/api/v1/user/me/` | `users`, `roles`, `user_roles` ; cible : `user_profiles`, `services`, `sessions` | Existant ; enrichissement proposé (notamment `id`, absent de GetMeResponseView local) |
| PATCH | Core `/api/v1/user/me/` | `users` ; cible : `user_profiles` | Existant pour prénom, nom, e-mail, téléphone ; extension proposée pour le profil |
| GET | Core `/api/v1/groups/` | `groups`, `group_users` | Existant ; groupes de l'appelant |
| GET | Core `/api/v1/sessions/` | `sessions`, vue `v_sessions` | Existant ; sessions de l'appelant |
| GET | Core `/api/v1/sessions/history` | `sessions`, vue `v_sessions` | Existant ; historique de l'appelant |
| POST | Core `/api/v1/sessions/refresh` | `sessions` ; entrée `refresh_token` | Existant |
| POST | Core `/api/v1/sessions/revoke` | `sessions` ; entrée `refresh_token` | Existant ; ce n'est pas une révocation par `sessionId` |
| DELETE | Core `/api/v1/sessions/{sessionId}` | `sessions` ; session appartenant à l'appelant | Proposé pour la déconnexion d'un autre appareil, sans exposer son refresh token |
| GET | Core `/api/v1/services/` | `services` | Proposé ; annuaire unique |
| GET | Core `/api/v1/users/directory/` | `users`, `user_profiles`, `services`, `roles`, `user_roles`, `groups`, `group_users` | Proposé ; annuaire limité au périmètre autorisé |
| GET | Core `/api/v1/user/me/notifications/` | `notifications` ; filtre utilisateur connecté | Proposé |
| PATCH | Core `/api/v1/user/me/notifications/{notificationId}/read` | `notifications.read_at` ; filtre utilisateur connecté | Proposé |

## Routes backend du module

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Project `/api/v1/projects/` | `projects`, `project_members` ; visibles par l'utilisateur | Client généré ; compte et projets récents |
| GET | Project `/api/v1/projects/{projectId}/tasks/` | `tasks` ; tâches autorisées/assignées en attente, progression | Client généré |
| GET | Project `/api/v1/projects/stats` | `projects`, `project_members`, `tasks` ; dates réelles de clôture | Proposé ; actifs, variation et terminés sur la période |
| GET | Calendar `/v1/calendar` | `events`, `event_members`, `calendar_event_metadata` ; filtres from/to | Client généré ; enrichissement du lieu proposé, mêmes événements que Calendrier |
| GET | Files `/api/v1/files/stats` | `files`, `document_processing_events` | Proposé ; documents traités et variation sur périodes comparables |
| GET | Accueil `/api/v1/citizen-services/stats` | `citizen_service_events`, `service_cases` | Proposé ; citoyens servis et délai moyen ; définition métier à valider |
| GET | Core `/api/v1/alerts/stats` | `alerts` ; statut actif et périmètre autorisé | Proposé |

## Points d'alignement

| Sujet | Contrat / écart |
| --- | --- |
| Compteurs | Les valeurs 12 projets, 1 247 citoyens, 856 documents, 24 événements, 8 terminés, 12 jours et 3 alertes sont des exemples ATP. Une source indisponible doit être signalée, pas remplacée par ces nombres. |
| Présentation | Les tendances, libellés Aujourd'hui/Demain, priorités colorées, icônes et barres sont adaptés par le front. Les dates et mesures brutes viennent des mêmes API que les pages métier. |
| Actions | Nouveau document et Planifier événement ouvrent leurs modules ; pas de POST implicite au chargement. La destination de Voir rapports n'est pas déduite d'une capture. |

## Sources

| Périmètre | Référence |
| --- | --- |
| Front inspecté | [src/app/page.tsx](src/app/page.tsx) |
| Identité / sessions / groupes | [Core_API 9904624](https://github.com/mairie360/Core_API/tree/99046240dd9742217d2a2c3d282721b785cacca0/src) ; [BFF_user b7c3477](https://github.com/mairie360/BFF_user/tree/b7c3477f858073aa846ba0129cbb29152528e6d2/src) |
| Données des composants partagés | [lib-components 88b339b](https://github.com/mairie360/lib-components/tree/88b339b77d06670b14b5f2f3d1f3d10ed471bb03/src/components/dashboard) |
| Sources projets | [BFF_Project 7bfa4b0](https://github.com/mairie360/BFF_Project/tree/7bfa4b04362bc4577c8a1919659e31357c69025b/src) ; [Project_API 4ff22c5](https://github.com/mairie360/Project_API/tree/4ff22c529801d22e0a6e4bf5359b3e85a85d61af/src) |
| Sources calendrier | [BFF_Calendar d0fcce4](https://github.com/mairie360/BFF_Calendar/tree/d0fcce44f9153c95623198aa335484459f8f0387/src) |
