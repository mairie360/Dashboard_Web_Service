# Dashboard_Web_Service — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Display a personalized summary of projects, tasks and events with quick links to business modules.

## Audience and value

Staff and managers who need an activity overview.

Business domain: Dashboard.

## Available capabilities

- Display aggregated `/dashboard/bootstrap` data.
- Report temporarily unavailable sources.
- Navigate to Projects, Calendar, Messages and Files through configurable URLs.

## Typical workflow

1. Load `/dashboard/bootstrap` with the session.
2. Inspect available projects, tasks and events.
3. Open the relevant business module to continue an action.

## Role within Mairie360

Associated repositories: [BFF_Dashboard](https://github.com/mairie360/BFF_Dashboard).

This repository contains the browser interface and its Next.js adapters. The associated BFF supplies business data and coordinates its sources.

## Data and current state

BFF User `/me` supplies identity. BFF Project supplies `/projects-page?page=1&limit=6`, followed by each project’s details for tasks. BFF Calendar supplies bootstrap for the date range. The BFF has no database of its own and no business mutations.

## Scope and limitations

The overview is limited and does not replace complete module listings. Unavailable sources are flagged and missing metrics remain null or absent. Reports and population or performance metrics are not supplied by this contract.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
