# Dashboard_Web_Service — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Afficher une synthèse personnalisée des projets, tâches et événements, avec des accès rapides aux modules métier.

## Public et utilité

Les agents et responsables qui souhaitent un aperçu de leur activité.

Domaine fonctionnel: Tableau de bord.

## Fonctions disponibles

- Affichage des données agrégées de `/dashboard/bootstrap`.
- Visite de bienvenue : à la première visite (`onboardingCompleted === false`), le composant `Onboarding` de la lib s'ouvre en modale avec ses cinq slides (« Bienvenue dans Mairie360 » … « Formez-vous à votre rythme », compteur « 1 sur 5 »). « Commencer », « Passer » ou Échap l'enregistre via `PUT /dashboard/onboarding` et la ferme ; elle ne réapparaît plus une fois enregistrée, ni quand le BFF ne peut pas répondre (`null`).
- Reprise explicite d'une lecture refusée sans remplacer les cartes confirmées par un vide inventé. Seule une réponse vide confirmée remplace les cartes ; la reprise ne masque pas une erreur de déconnexion indépendante et ne déclenche aucune mutation.
- Refus d'un bootstrap réussi mais inexploitable avant remplacement des cartes ou de l'identité confirmées. La page vérifie le prénom, les collections, les champs affichés et les sources ; forme invalide : erreur française contrôlée et reprise GET volontaire (MAIR-455 / issue #84). Gardes d'attente, d'annulation et de réponse obsolète inchangées.
- Heure/lieu facultatifs et identifiants d'événement string/number conservés. Les dates textuelles non reconnues gardent leur traitement d'affichage distinct ; statistiques et champs non consommés ne sont pas réinterprétés. Aucune unicité d'identifiant, permission de date ou rôle utilisateur inventé.
- Échéances projet et tâche en JJ/MM/AAAA avec zéros initiaux, comme la référence locale. Les dates seules gardent leur jour UTC ; les instants ISO gardent le jour Europe/Paris existant, indépendamment du fuseau machine. Les tâches sans échéance et les valeurs non reconnues conservent leurs traitements existants ; le format des événements est inchangé.
- Les dates civiles impossibles et les échéances ambiguës restent telles que reçues, sans jour deviné ni report automatique. Dates d’événement et heures HH:mm sont validées avant affichage ; les événements valides restent sélectionnables. Les événements illisibles sont signalés distinctement des collections vides confirmées, avec reprise explicite par GET bootstrap. Règles UTC/Paris des échéances et heure locale des événements inchangées.
- Reprise de l’échelle racine de 17px et de la police système par défaut de la référence, y compris le header partagé en rem (68px par défaut). Les tailles standard des petits textes restent inchangées ; aucune préférence d’apparence sauvegardée n’est simulée.
- Marge intérieure verticale de 1,5rem conservée sur desktop et mobile, comme la référence. La classe de shell propre à Dashboard ne change ni les valeurs par défaut de la bibliothèque ni les autres fronts.
- Lignes de navigation de 44px minimum et ombre latérale de la sidebar de référence, avec du CSS propre à Dashboard. La sidebar mobile reste sous le bouton Fermer publié ; aucune navigation du prototype, rôle, notification ou donnée de version fictive n'est recopié (MAIR-182 / issue #32).
- Fond opaque du contenu `#f5f3f0` conservé pour retrouver la peinture de la frontière du header de référence. Ni l'ombre partagée du header ni son empilement ne sont modifiés pour compenser un contenu transparent (MAIR-182 / issue #32).
- Signalement des sources temporairement indisponibles.
- Ouvrir Projets et Calendrier depuis les cartes avec la même validation des URLs runtime que la navigation commune. Une destination blanche, malformée ou non prise en charge est traitée comme une configuration absente : l'action reste sur Dashboard sans exception, relecture ou fallback inventé. Les destinations valides conservent paramètres existants et identifiants reçus.
- Rejoindre les autres modules actifs configurés via AppShell ; les dépôts archivés Fichiers/Emails ne sont pas réintroduits dans la navigation.
- Ouverture directe d’un événement du tableau de bord dans Calendrier.

## Parcours type

### Reprise de session — MAIR-404 / issue #87

Une page sans cookie rejoint Login configuré avant de charger les données métier.
Un cookie dont l'expiration est connue ouvre son flux Logout existant, seul
responsable de l'expiration du cookie partagé. Configuration Login absente/non
sûre :503 uncached. Données/metadata sans cookie utilisable :401JSON uncached,
pas redirection HTML cross-origin. Une lecture401 courante délègue une seule fois
à Login ; une lecture annulée ne navigue pas,403/503/pannes restent récupérables.
Ce contrôle de présence/expiration ne valide ni signature ni autorisation ; les
tokens opaques restent du ressort du BFF. Aucun deuxièmeBFF, COOKIE_DOMAIN local,
replay de mutation ou authentification simulée ajouté.

1. Charger `/dashboard/bootstrap` avec la session.
2. Consulter les projets, tâches et événements disponibles.
3. Ouvrir le module métier concerné ou sélectionner un événement pour le voir dans Calendrier.

## Place dans Mairie360

Dépôts associés: [BFF_Dashboard](https://github.com/mairie360/BFF_Dashboard).

Ce dépôt contient l’interface navigateur et ses adaptateurs Next.js. Le BFF associé fournit les données métier et coordonne leurs sources.

## Données et état actuel

Depuis MAIR-525, BFF_Dashboard lit directement les APIs, jamais un autre BFF : Core API fournit l’identité, Project API les projets et leurs tâches, Calendar API les événements de la période. Le BFF ne dispose pas de base propre ni de mutations métier.

## Périmètre et limites

L’aperçu est limité et ne remplace pas les listes complètes des modules. Une source indisponible est signalée et les statistiques absentes restent nulles ou non affichées. Les rapports et mesures de population ou de performance ne sont pas fournis par ce contrat.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.


Accessibilité (MAIR-485)

Chaque état initial, chargé ou indisponible conserve un titre de page h1. Les textes secondaires utilisent une couleur contrastée sur le fond de la page.


## Direction visuelle commune — MAIR-547

DA claire option 1 : tokens et police communs, navigation accessible et contenu métier conservé. Voir la [recette visuelle](../qa/design-qa.md) pour les preuves, vérifications et limites RGAA.

## Tableau de bord V2 — MAIR-825

Figma : [index des features](https://www.figma.com/design/U4LxYJ8TDpZxqB8BmpBuRh?node-id=34-861).

- Le bandeau affiche le logo « mairie / 360 » de lib-components ; le front ne sert plus de logo à lui (MAIR-883, F4).
- « Déconnexion » ouvre d'abord la confirmation « Se déconnecter ? » de la lib ; « Annuler », la croix ou Échap la
  ferment sans quitter. « Se déconnecter » reste en chargement jusqu'à l'ouverture de la page `/logout` de Login ;
  sans Login configuré, l'alerte « La déconnexion est temporairement indisponible. » s'affiche (MAIR-919, F6).
- Le haut de page est un accueil : h1 « Bonjour <prénom> » (« Bonsoir » à partir de 18 h, heure de l'instance) et
  « Bienvenue sur votre espace Mairie360. » ; plus de titre « Tableau de bord » ni de date, l'entrée active du
  bandeau repère la page. Il est aussi rendu pendant le chargement (MAIR-924, F1). Il utilise la variante
  « Accueil » du PageHeader de la lib (`variant="welcome"`, MAIR-1113, lib-components 2.3).
- Entrées du bandeau : celles de la lib, « E-learning » à la place de « Formation » ; Administration pour les seuls
  administrateurs, pas de Workflows (MAIR-1106). Plus de pied de page : lib-components 2.3 l'a retiré de la base de
  page (MAIR-1092). Le bloc commune du Header est masqué tant que le bootstrap ne donne pas la commune.
- Tuiles (MAIR-1107, F1) : grille 2 × 2 de tuiles identiques qui remplit la hauteur sous l'accueil dès 900 px (une
  colonne en dessous, la page défile plutôt que de couper le contenu) ; liens « Voir les… » sans flèche ; états vide
  et indisponible centrés.
- Indicateurs d'en-tête : « Projets récents · 12 projets » (`metrics.totalProjects`, tous les projets visibles, comme
  la liste Projets) et « Événements à venir · 7 en novembre » (`metrics.eventsThisMonth`, les occurrences du mois en
  cours en Europe/Paris comme la vue mois du Calendrier, le mois nommé en français d'après `metrics.eventsPeriod.from`),
  en `Caption` de la lib après le titre. Un compteur `null` (son API indisponible) ou le chargement laisse le titre seul.
- Lignes compactes (MAIR-907, F1/F5) : 3 au plus par tuile (premiers projets et tâches, événements les plus proches),
  sans fond, filet `--mairie-border` entre les lignes, marge de 10 px, `--mairie-surface-raised` au survol, focus
  `--mairie-accent`. Projets : nom et statut, puis « Échéance : … », la piste de progression et son pourcentage ;
  tâches : titre et priorité, puis l'échéance (plus de point coloré) ; événements : badge date (jour en gras, mois
  abrégé, liseré `--mairie-module-calendar`), titre, « heure · lieu ».
- Chargement (MAIR-899, F1) : la page finale est dessinée d'emblée (accueil, tuiles avec titre et lien) ; chaque tuile
  montre 3 lignes squelettes à la taille des vraies, « Chargement du tableau de bord… » n'est annoncé qu'aux lecteurs
  d'écran, et l'animation s'arrête avec `prefers-reduced-motion`.
- Alertes et reprise (MAIR-915, F1/F2/F3) : les messages sont des Alert de la lib, taille m, non fermables (« Certaines
  données sont temporairement indisponibles. » en `status`, « Le tableau de bord est temporairement indisponible. » et
  « La déconnexion est temporairement indisponible. » en `alert`) ; aucun message du service ni statut HTTP n'est
  affiché. Un premier chargement en échec affiche un Panel avec le DataState d'erreur « Le tableau de bord est
  indisponible. ». Chaque relance explicite est annoncée par un toast (succès « Tableau de bord à jour » / « Tableau
  de bord chargé », erreur « Le calendrier est toujours indisponible » / « Le service ne répond toujours pas »…).
- Identité et commune (MAIR-889, MAIR-883, F4/F6) : le menu utilisateur affiche « Prénom Nom · Rôle » du bootstrap
  (pas de libellé de rôle vide) ; « Commune de <nom> » dans le bandeau déplié et le bloc « Mairie de » du Header
  reprennent la commune de l'instance (`MAIRIE_NAME` sur BFF_Dashboard), rien ne s'affiche sans elle.
- « Mes formations » (MAIR-1110, F1) : 4e tuile, les 3 formations de l'agent fournies par BFF_Dashboard (non
  terminées d'abord) : titre, statut, « Module x sur y », piste de progression `--mairie-module-training` et
  pourcentage. Une ligne ouvre la formation dans le front E-learning (`?course=<id>`), « Voir les formations » son
  catalogue (désactivé sans `ELEARNING_FRONT_URL`). Le contrat ne donne pas d'échéance de formation : « avant le
  <date> » n'est pas affiché. Des formations indisponibles (ELearning API en panne ou non configurée sur
  BFF_Dashboard) affichent l'état propre à la tuile, sans le bandeau de page. Un bootstrap d'un BFF plus ancien (sans
  ces champs) reste utilisable : pas de rôle, pas de commune, formations indisponibles.
