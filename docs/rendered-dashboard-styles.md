# Rendered Dashboard style checks

The component suite mounts the actual Dashboard page, published shared components and consumer stylesheet. Only the existing BFF client and front URL boundary are mocked, with explicit synthetic DTO data. Long titles, card action styles, computed wrapping and project row properties, the main inset/surface, sidebar shadow/rhythm and actual drawer opening/closing are checked on real elements.

The Node suite preserves responsive event-track and surface safety policies through parsed CSSOM rules, including their actual selector and media-condition association. It does not search the CSS or page source text for an expected spelling. Reading the stylesheet as rendering input is intentional.

The published project titles use non-truncated markup. JSDOM omits some initial values there; only the initial white-space/overflow/text-overflow values are normalized. The consumer `.truncate` fallback remains a separate parsed configuration policy, rather than being presented as an active title style. Native long-title checks remain necessary.

JSDOM does not compile Tailwind, execute media queries, measure layout or implement browser hit-testing. Responsive columns, real sizes, overflow and mobile Close placement require separate native-browser checks on the integrated main and refreshed local snapshot. The CSSOM media check is a configuration policy, not responsive rendering evidence. Fixtures and local simulator adaptations are never delivered with the product.

Run the targeted component suite with one worker:

```sh
npx vitest run tests/component/dashboard-rendered-styles.test.jsx --maxWorkers=1
node --test --test-concurrency=1 tests/dashboard-responsive-cards.test.cjs
```
