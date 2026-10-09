# Vérifications des styles du Dashboard rendu

La suite de composants monte la vraie page Dashboard, les composants partagés publiés et la feuille du consommateur. Seules les frontières existantes du client BFF et des URL des fronts sont simulées, avec des DTO synthétiques explicites. Les titres longs, commandes des cartes, propriétés calculées de retour à la ligne et lignes de projets, surface/espacement du main, ombre/rythme de sidebar et ouverture/fermeture réelle du tiroir sont contrôlés sur les vrais éléments.

La suite Node conserve les politiques de pistes responsive des événements et de surface à travers les règles CSSOM parsées, avec l’association effective sélecteur/condition média. Elle ne cherche pas une écriture attendue dans le texte CSS ou TSX. La lecture de la feuille comme entrée du rendu est nécessaire.

Les titres de projets publiés utilisent des éléments sans troncature. JSDOM y omet certaines valeurs initiales ; seules les valeurs initiales de white-space/overflow/text-overflow sont normalisées. Le fallback `.truncate` du consommateur reste une politique de configuration parsée distincte, sans être présenté comme le style actif des titres. La recette native avec titres longs reste nécessaire.

JSDOM ne compile pas Tailwind, n’exécute pas les media queries, ne mesure pas la disposition et ne réalise pas le hit-test du navigateur. Colonnes responsive, dimensions réelles, débordements et placement de la fermeture mobile demandent une recette native distincte sur le main intégré et le snapshot local actualisé. Le contrôle CSSOM média est une politique de configuration, pas une preuve de rendu responsive. Fixtures et adaptations du simulateur local ne sont jamais livrées dans le produit.

Exécution ciblée avec un worker :

```sh
npx vitest run tests/component/dashboard-rendered-styles.test.jsx --maxWorkers=1
node --test --test-concurrency=1 tests/dashboard-responsive-cards.test.cjs
```
