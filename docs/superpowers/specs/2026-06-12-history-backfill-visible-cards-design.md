# History Backfill And Visible Cards Design

## Context

Bensin-API already stores change-based price history at
`v1/history/provinsi/{slug}.json`. Each product stores only price-change
events, not daily snapshots. The frontend currently fetches one province
history file and renders one selected product as a step chart.

The approved direction is to make old prices visible per fuel type. Users
should see current price, old periods, low/high prices, and source labels
directly on product cards.

## Goals

- Seed older price history from official sources and reputable news articles.
- Keep backfilled historical entries source-backed and auditable.
- Preserve the existing static JSON API and event-based storage model.
- Show product-specific history as visible cards, not one selected chart.
- Improve the chart presentation without adding a heavy chart dependency.

## Non-Goals

- Do not build a server or database.
- Do not scrape sources automatically in the first implementation.
- Do not treat unsourced historical prices as verified data.
- Do not replace the existing current-price endpoints.

## Recommended Approach

Keep the existing history endpoint and extend history points with optional
source metadata. The API change is additive. Existing points without `source`
remain valid and render with a generic label such as `Historical snapshot`.

The frontend derives display periods from adjacent change events:

```text
1 Sep 2024 - 1 Oct 2024: Rp12.950
1 Oct 2024 - now: Rp13.250
```

History point fields:

```text
date: 2024-09-01
price_rupiah: 12950
source.type: official
source.name: Pertamina
source.url: source article or announcement URL
source.published_at: 2024-09-01
```

## Data Model

History files keep the existing shape: province metadata plus `products`, where
each product name maps to a chronological list of history points.

`source` is optional in generated history files for backward compatibility, but
required in the manual backfill input file.

Allowed source types:

- `official`
- `reputable_news`
- `snapshot`

`reputable_news` means an established publication that explicitly states the
fuel product, price, effective date, and region or national scope. Articles
without those fields are not valid backfill sources.

Backfill source requirements:

- `type` must be one of the allowed values.
- `name` is required.
- `url` is required for `official` and `reputable_news` entries.
- `published_at` is required when the source has a publication date.
- `date` must be an ISO `YYYY-MM-DD` string.
- `price_rupiah` must be an integer.

## Backfill Input

Add a manually maintained file:

```text
pipeline/history_backfill.json
```

The file contains source-backed events grouped by province slug and product.
The generator merges:

```text
backfill events + existing generated history + latest current prices
```

Merge rules:

- Sort events by date ascending.
- Deduplicate by product and date.
- Same-day generated sync may update a generated point for that day.
- Backfilled entries do not overwrite newer generated points.
- Province-specific sources apply only to that province.
- National sources may seed matching province files only when the source clearly
  states the price applies nationally or to the matched region set.
- Invalid backfill entries fail tests before generated JSON is committed.

For the first implementation, seed a small source-backed set instead of trying
to reconstruct every province and product exhaustively.

## Frontend Design

Replace the current selected-product chart with a visible history-card grid.
Each fuel type gets its own card.

Each card shows:

- Product name.
- Current price.
- Lowest historical price.
- Highest historical price.
- Compact mini step chart.
- Old price periods derived from adjacent history events.
- Source label for each displayed period.

If a product has many records, show the most recent 2 or 3 periods by default
and provide an inline `View all history` button for the full list. Single-point
products show the current period only.

Example card content:

```text
PERTAMAX
Current: Rp16.250
Lowest: Rp12.300
Highest: Rp16.250

Old prices
1 Sep 2024 - 1 Oct 2024: Rp12.950
Source: Pertamina

7 Jun 2026 - 9 Jun 2026: Rp12.300
Source: API snapshot

9 Jun 2026 - now: Rp16.250
Source: latest MyPertamina sync
```

## Component Boundaries

Refactor the history UI into focused pieces:

```text
PriceHistorySection
  ProductHistoryCard
    MiniStepChart
    PricePeriodList
```

Utility functions own the history transformations:

```text
history events -> display periods
history events -> lowest/highest/current stats
history events -> chart points
```

`PriceHistorySection` handles fetch, loading, error, and empty states. Cards are
presentational and receive already-derived product history data.

## Accessibility And UX

- Use semantic section, article, button, and list markup.
- Keep interactive targets at least 44 px high.
- Mini charts include accessible labels and visible numeric summaries.
- Users must not need color or the chart alone to understand price history.
- `View all history` expands inline and preserves keyboard focus.
- Source names with URLs render as safe external links with noreferrer.
- Do not render source content as HTML.

## Error Handling

- History 404 remains an empty state.
- Network and validation failures keep the existing retry behavior.
- Missing `source` on legacy history points renders `Historical snapshot`.
- Invalid backfill files fail pipeline tests.
- Products with one point render a single current period ending in `now`.

## Security

All API data is public static JSON. The main risks are data integrity and unsafe
URL rendering.

Controls:

- Backfill requires explicit source metadata.
- URLs are rendered only as link href values, not injected as HTML.
- External source links use noreferrer.
- Runtime schemas validate history shape before rendering.
- No secrets, credentials, PII, or user input are stored in backfill data.

## Performance

The event-based model keeps payloads small. Mini charts use inline SVG and do
not add a charting dependency. The card list shows a capped number of periods
by default to avoid very tall cards as history grows.

## Testing

Pipeline tests:

- Validate the extended history schema.
- Validate that backfill entries require source metadata.
- Verify merge ordering and deduplication.
- Verify generated latest-price sync still appends only real price changes.
- Verify invalid backfill entries fail deterministically.

Frontend tests:

- Convert events to periods with correct start and end labels.
- Render the final period as `now`.
- Compute current, lowest, and highest prices.
- Render visible old-price rows on product cards.
- Preserve loading, empty, error, and single-point states.

## Accepted Design Direction

The approved visual direction is the visible old-price card mock: product cards
show old prices directly, with mini charts and source-backed period rows. The
mock was reviewed through the visual companion and marked LGTM.
