# Dashboard_Web_Service — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Afficher une synthèse personnalisée des projets, tâches et événements, avec des accès rapides aux modules métier.

## Public et utilité

Les agents et responsables qui souhaitent un aperçu de leur activité.

Domaine fonctionnel: Tableau de bord.

## Fonctions disponibles

- Affichage des données agrégées de `/dashboard/bootstrap`.
- Signalement des sources temporairement indisponibles.
- Navigation vers Projets, Calendrier, Messages et Fichiers par URL configurable.
- Ouverture directe d’un événement du tableau de bord dans Calendrier.

## Parcours type

1. Charger `/dashboard/bootstrap` avec la session.
2. Consulter les projets, tâches et événements disponibles.
3. Ouvrir le module métier concerné ou sélectionner un événement pour le voir dans Calendrier.

## Place dans Mairie360

Dépôts associés: [BFF_Dashboard](https://github.com/mairie360/BFF_Dashboard).

Ce dépôt contient l’interface navigateur et ses adaptateurs Next.js. Le BFF associé fournit les données métier et coordonne leurs sources.

## Données et état actuel

BFF User `/me` fournit l’identité. BFF Project fournit `/projects-page?page=1&limit=6` puis les détails de chaque projet pour les tâches. BFF Calendar fournit le bootstrap de la période. Le BFF ne dispose pas de base propre ni de mutations métier.

## Périmètre et limites

L’aperçu est limité et ne remplace pas les listes complètes des modules. Une source indisponible est signalée et les statistiques absentes restent nulles ou non affichées. Les rapports et mesures de population ou de performance ne sont pas fournis par ce contrat.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
