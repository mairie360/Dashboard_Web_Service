# Dashboard_Web_Service — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Display a personalized summary of projects, tasks and events with quick links to business modules.

## Audience and value

Staff and managers who need an activity overview.

Business domain: Dashboard.

## Available capabilities

- Display aggregated `/dashboard/bootstrap` data.
- Display project and task deadlines as zero-padded DD/MM/YYYY, matching the local reference. Date-only values retain their UTC day; ISO instants retain the existing Europe/Paris day independently of the host timezone. Missing task deadlines and unrecognized values keep their existing fallbacks; event formatting is unchanged.
- Impossible civil dates and ambiguous free-text deadlines remain verbatim rather than being guessed or rolled into another day. Event dates and HH:mm clocks are validated before display; valid returned events remain selectable. Unusable events are announced separately from confirmed empty collections, with an explicit bootstrap GET recovery. The existing UTC/Paris deadline and local event-clock policies are unchanged.
- Use the reference's default 17px root scale and system font, including the shared rem-based header (68px by default). Standard small-text tokens remain unchanged; this does not simulate saved appearance preferences.
- Keep the reference's 1.5rem vertical content inset at desktop and mobile widths. This Dashboard-only shell class does not change shared library defaults or other frontends.
- Retain the reference sidebar's 44px minimum navigation rows and lateral shadow through Dashboard-only CSS. The mobile sidebar remains below the published Close button; this does not copy prototype navigation or invent roles, notifications or version data (MAIR-182 / issue #32).
- Keep the reference's opaque `#f5f3f0` content background so the header boundary paints consistently. Do not alter the shared header's shadow token or stacking to compensate for transparent content (MAIR-182 / issue #32).
- Report temporarily unavailable sources.
- Recover a refused bootstrap explicitly without replacing confirmed cards by invented empty data. A confirmed empty response replaces the old cards; read recovery does not dismiss an independent logout error or call a mutation.
- Refuse an unusable successful bootstrap before replacing confirmed cards or identity. The page checks the consumed name, collections, card fields and source states; invalid shapes show a controlled French read error with deliberate GET-only recovery (MAIR-455 / issue #84). Pending, abort and stale-read guards remain unchanged.
- Keep optional event time/location and valid string/number event identifiers. Unrecognized textual dates still use the established display fallback rather than invalidating the entire read. Summary metrics and unused fields are not reinterpreted; no identifier uniqueness, date permission or user role is invented.
- Open Projects and Calendar from the cards using the same validated runtime URL policy as the common navigation. Blank, malformed or unsupported destinations behave like missing configuration: card actions stay on Dashboard without throwing, reloading data or inventing a fallback. Valid destinations preserve existing query values and received record identifiers.
- Reach the other configured active modules through AppShell; archived Files/Emails are not added back to navigation.
- Open an upcoming event directly in Calendar from its dashboard card.

## Typical workflow

### Session recovery — MAIR-404 / issue #87

A page without a session cookie opens the configured Login front before loading
business data. A known-expired cookie opens its existing Logout flow, which owns
shared-cookie expiry. Missing/unsafe Login configuration fails with uncached503.
Data and metadata requests without a usable cookie receive uncached JSON401,
not a cross-origin HTML redirect. A current401 read delegates once to Login;
aborted reads cannot navigate, while403/503/network errors remain recoverable.
This early presence/expiry check is not signature validation or authorization;
opaque tokens remain the BFF's responsibility. No second BFF, local cookie-domain
setting, mutation replay or simulated authentication is added.

1. Load `/dashboard/bootstrap` with the session.
2. Inspect available projects, tasks and events.
3. Open the relevant business module, or select an event to see it in Calendar.

## Role within Mairie360

Associated repositories: [BFF_Dashboard](https://github.com/mairie360/BFF_Dashboard).

This repository contains the browser interface and its Next.js adapters. The associated BFF supplies business data and coordinates its sources.

## Data and current state

Since MAIR-525 BFF_Dashboard reads the APIs directly, never another BFF: Core API supplies identity, Project API the projects and their tasks, Calendar API the events of the date range. The BFF has no database of its own and no business mutations.

## Scope and limitations

The overview is limited and does not replace complete module listings. Unavailable sources are flagged and missing metrics remain null or absent. Reports and population or performance metrics are not supplied by this contract.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.


Accessibility (MAIR-485)

Every initial, loaded or unavailable state retains one h1 page heading. Secondary text uses a contrasting foreground on the page background.


## Shared visual direction — MAIR-547

Approved light option 1: shared tokens and font, accessible navigation, and preserved business layouts. See the [visual QA](../qa/design-qa.md) for evidence, checks, and RGAA limitations.

## Dashboard V2 — MAIR-825

Figma: [feature index](https://www.figma.com/design/U4LxYJ8TDpZxqB8BmpBuRh?node-id=34-861).

- The navigation shows the « mairie / 360 » logo of lib-components; the front serves no logo of its own (MAIR-883, F4).
- « Déconnexion » first opens the lib confirmation « Se déconnecter ? »; « Annuler », the cross or Escape close it
  without leaving. « Se déconnecter » stays loading until Login's `/logout` page opens; when Login is not configured,
  the alert « La déconnexion est temporairement indisponible. » is shown (MAIR-919, F6).
- The top of the page is a welcome: h1 « Bonjour <first name> » (« Bonsoir » from 18:00 on the instance clock) and
  « Bienvenue sur votre espace Mairie360. »; there is no « Tableau de bord » title nor date any more, the active
  navigation entry marks the page. It is rendered while loading too (MAIR-924, F1). It uses the lib PageHeader
  « Accueil » variant (`variant="welcome"`, MAIR-1113, lib-components 2.3).
- Navigation entries: the lib defaults with « E-learning » instead of « Formation »; Administration only for
  administrators, no Workflows (MAIR-1106). No footer: lib-components 2.3 removed it from the page base (MAIR-1092). The Header's commune block is hidden until
  the bootstrap gives the commune.
- Tiles (MAIR-1107, F1): a 2 × 2 grid of equal tiles that fills the height under the welcome from 900 px (one column
  below, the page scrolling rather than cutting content); the « Voir les… » links have no arrow; empty and unavailable
  states are centred.
- Header indicators: « Projets récents · 12 projets » (`metrics.totalProjects`, every visible project, like the
  Projects list) and « Événements à venir · 7 en novembre » (`metrics.eventsThisMonth`, the occurrences of the current
  Europe/Paris month like the Calendar month view, the month named in French from `metrics.eventsPeriod.from`), as a lib
  `Caption` after the title. A `null` count (its API unavailable) or the loading state leaves the title alone.
- Compact rows (MAIR-907, F1/F5): at most 3 per tile (first projects and tasks, soonest events), no background, a
  `--mairie-border` rule between rows, 10 px inset, `--mairie-surface-raised` on hover, `--mairie-accent` focus ring.
  Projects: name and status, then « Échéance : … », the progress track and its percentage; tasks: title and priority,
  then the deadline (no coloured dot any more); events: date badge (bold day, short month, `--mairie-module-calendar`
  top edge), title, « heure · lieu ».
- Loading (MAIR-899, F1): the final page is drawn at once (welcome, tiles with their titles and links); each tile shows
  3 skeleton rows the size of the real ones, « Chargement du tableau de bord… » is announced to screen readers only,
  and the shimmer stops under `prefers-reduced-motion`.
- Alerts and recovery (MAIR-915, F1/F2/F3): the notices are lib Alerts, size m, not dismissible (« Certaines données
  sont temporairement indisponibles. » as a `status`, « Le tableau de bord est temporairement indisponible. » and « La
  déconnexion est temporairement indisponible. » as `alert`); no service message nor HTTP status is shown. A first read
  that fails shows a Panel with the error DataState « Le tableau de bord est indisponible. ». Each explicit recovery is
  announced by a toast (success « Tableau de bord à jour » / « Tableau de bord chargé », error « Le calendrier est
  toujours indisponible » / « Le service ne répond toujours pas »…).
- Identity and commune (MAIR-889, MAIR-883, F4/F6): the user menu shows « Prénom Nom · Rôle » from the bootstrap
  (no role label when it has none); « Commune de <nom> » in the expanded navigation and the Header's « Mairie de »
  block use the commune of the instance (`MAIRIE_NAME` on BFF_Dashboard), and nothing is shown without it.
- « Mes formations » (MAIR-1110, F1): 4th tile, the 3 trainings of the agent from BFF_Dashboard (unfinished first):
  title, status pill, « Module x sur y », progress track in `--mairie-module-training` and its percentage. A row
  opens the training in the E-learning front (`?course=<id>`), « Voir les formations » its catalogue (disabled
  without `ELEARNING_FRONT_URL`). The contract has no training deadline, so « avant le <date> » is not shown.
  Unavailable trainings (ELearning API down or not configured on BFF_Dashboard) show the tile's own state, without the
  page banner. A bootstrap from an older BFF (without these fields) stays usable: no role, no commune, trainings
  unavailable.
