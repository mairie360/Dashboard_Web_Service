# Dashboard_Web_Service

Display a personalized summary of projects, tasks and events with quick links to business modules.

Afficher une synthèse personnalisée des projets, tâches et événements, avec des accès rapides aux modules métier.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The guides describe the implemented module, its current limitations, local setup, routes, data, verification and CI/CD.

`npm test` runs the existing contract/network suite and the Vitest component
suite. Use `npm run test:components` to check the dashboard's bootstrap states,
real-data rendering, keyboard focus and serious/critical axe findings alone.
The component fixtures are synthetic and stay in `tests/`; they are never
rendered in production.

MAIR-455 / [issue #84](https://github.com/mairie360/Dashboard_Web_Service/issues/84):
failed bootstrap reads and unavailable sources offer explicit keyboard/click
recovery using the same published GET. One read runs at a time; confirmed cards
stay visible after a new refusal, and unmounted/aborted responses are ignored.
There is no automatic retry, invented data, new API/BFF operation or deployment
approval. Quick actions remain absent as required by MAIR-209.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Contracts and background / Contrats et compléments

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.
