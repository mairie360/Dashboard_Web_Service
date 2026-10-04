# Dashboard_Web_Service — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Display a personalized summary of projects, tasks and events with quick links to business modules.

## Audience and value

Staff and managers who need an activity overview.

Business domain: Dashboard.

## Available capabilities

- Display aggregated `/dashboard/bootstrap` data.
- Display project and task deadlines as zero-padded DD/MM/YYYY, matching the local reference. Date-only values retain their UTC day; ISO instants retain the existing Europe/Paris day independently of the host timezone. Missing task deadlines and unrecognized values keep their existing fallbacks; event formatting is unchanged.
- Use the reference's default 17px root scale and system font, including the shared rem-based header (68px by default). Standard small-text tokens remain unchanged; this does not simulate saved appearance preferences.
- Keep the reference's 1.5rem vertical content inset at desktop and mobile widths. This Dashboard-only shell class does not change shared library defaults or other frontends.
- Retain the reference sidebar's 44px minimum navigation rows and lateral shadow through Dashboard-only CSS. The mobile sidebar remains below the published Close button; this does not copy prototype navigation or invent roles, notifications or version data (MAIR-182 / issue #32).
- Keep the reference's opaque `#f5f3f0` content background so the header boundary paints consistently. Do not alter the shared header's shadow token or stacking to compensate for transparent content (MAIR-182 / issue #32).
- Report temporarily unavailable sources.
- Recover a refused bootstrap explicitly without replacing confirmed cards by invented empty data. A confirmed empty response replaces the old cards; read recovery does not dismiss an independent logout error or call a mutation.
- Navigate to Projects, Calendar, Messages and Files through configurable URLs.
- Open an upcoming event directly in Calendar from its dashboard card.

## Typical workflow

1. Load `/dashboard/bootstrap` with the session.
2. Inspect available projects, tasks and events.
3. Open the relevant business module, or select an event to see it in Calendar.

## Role within Mairie360

Associated repositories: [BFF_Dashboard](https://github.com/mairie360/BFF_Dashboard).

This repository contains the browser interface and its Next.js adapters. The associated BFF supplies business data and coordinates its sources.

## Data and current state

BFF User `/me` supplies identity. BFF Project supplies `/projects-page?page=1&limit=6`, followed by each project’s details for tasks. BFF Calendar supplies bootstrap for the date range. The BFF has no database of its own and no business mutations.

## Scope and limitations

The overview is limited and does not replace complete module listings. Unavailable sources are flagged and missing metrics remain null or absent. Reports and population or performance metrics are not supplied by this contract.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
