# History Backfill Visible Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add source-backed historical price backfill and replace the single-product history chart with visible product history cards.

**Architecture:** Keep the existing static history endpoint and change-event storage model. Extend history points with optional source metadata, merge a manually curated backfill file into generated history, then derive card periods and stats in frontend utilities.

**Tech Stack:** Python 3.12 pipeline with Pydantic and pytest; React 19, TypeScript, Zod, Vitest, Testing Library, Tailwind CSS utilities, inline SVG mini charts.

---

## File Structure

- Modify `pipeline/schemas.py`: add source models and allow optional source metadata on history points.
- Modify `pipeline/history.py`: load and validate `pipeline/history_backfill.json`, merge backfill events, sort/dedupe history points, and attach `snapshot` source metadata to newly generated points.
- Create `pipeline/history_backfill.json`: first small source-backed historical seed.
- Modify `pipeline/tests/test_history.py`: coverage for source validation, backfill merge, ordering, dedupe, and snapshot source behavior.
- Modify `src/types/api.ts`: add `HistorySource`, `HistorySourceType`, and optional source metadata on `HistoryPoint`.
- Modify `src/types/schemas.ts`: validate optional source metadata at the API boundary.
- Create `src/utils/history-periods.ts`: convert history events into periods and product card summaries.
- Create `src/__tests__/unit/history-periods.test.ts`: utility tests for periods, stats, source fallbacks, and caps.
- Create `src/components/MiniStepChart.tsx`: compact accessible SVG step chart for cards.
- Create `src/components/PricePeriodList.tsx`: old-price period rows with safe source labels and links.
- Create `src/components/ProductHistoryCard.tsx`: product card composing stats, mini chart, and periods.
- Modify `src/components/PriceHistoryChart.tsx`: keep fetch/loading/error shell, render product history card grid instead of selected-product chart.
- Modify `src/__tests__/unit/price-history-chart.test.tsx`: update expectations for visible cards.
- Update generated `v1/history/provinsi/*.json` by running the pipeline after tests are in place.

---

### Task 1: Extend History Schemas For Source Metadata

**Files:**
- Modify: `pipeline/schemas.py`
- Test: `pipeline/tests/test_history.py`

- [ ] **Step 1: Write failing tests for source metadata**

Append these tests to `pipeline/tests/test_history.py` after `test_write_history_rejects_invalid_payload`:

```python
def test_write_history_accepts_optional_source_metadata():
    data = {
        'province': 'Prov. Aceh',
        'province_slug': 'aceh',
        'products': {
            'PERTAMAX': [{
                'date': '2024-09-01',
                'price_rupiah': 12950,
                'source': {
                    'type': 'reputable_news',
                    'name': 'Kontan',
                    'url': 'https://industri.kontan.co.id/news/daftar-harga-bbm-pertamina-per-september-2024-pertamax-turun-harga',
                    'published_at': '2024-09-01',
                },
            }],
        },
    }
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'aceh.json')
        write_history(path, data)
        assert load_history(path) == data


def test_write_history_rejects_unknown_source_type():
    data = {
        'province': 'Prov. Aceh',
        'province_slug': 'aceh',
        'products': {
            'PERTAMAX': [{
                'date': '2024-09-01',
                'price_rupiah': 12950,
                'source': {'type': 'blog', 'name': 'Example'},
            }],
        },
    }
    with tempfile.TemporaryDirectory() as tmp:
        with pytest.raises(ValidationError):
            write_history(os.path.join(tmp, 'aceh.json'), data)
```

- [ ] **Step 2: Run the focused schema tests**

Run: `python -m pytest pipeline/tests/test_history.py::test_write_history_accepts_optional_source_metadata pipeline/tests/test_history.py::test_write_history_rejects_unknown_source_type -q`

Expected: at least one failure because `HistoryPointModel` has no validated `source` contract yet.

- [ ] **Step 3: Implement source models**

In `pipeline/schemas.py`, add `ConfigDict` to the pydantic import and add these models before `HistoryPointModel`:

```python
HistorySourceType = Literal['official', 'reputable_news', 'snapshot']


class HistorySourceModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

    type: HistorySourceType
    name: NonEmptyStr
    url: Optional[StrippedStr] = None
    published_at: Optional[StrippedStr] = None
```

Then replace `HistoryPointModel` with:

```python
class HistoryPointModel(BaseModel):
    model_config = ConfigDict(extra='forbid')

    date: NonEmptyStr
    price_rupiah: int
    source: Optional[HistorySourceModel] = None
```

- [ ] **Step 4: Run the focused schema tests again**

Run: `python -m pytest pipeline/tests/test_history.py::test_write_history_accepts_optional_source_metadata pipeline/tests/test_history.py::test_write_history_rejects_unknown_source_type -q`

Expected: both tests pass.

- [ ] **Step 5: Commit**

Run: `git add pipeline/schemas.py pipeline/tests/test_history.py && git commit -m 'feat: allow history source metadata'`

### Task 2: Add Backfill Loading And Merge Rules

**Files:**
- Modify: `pipeline/history.py`
- Create: `pipeline/history_backfill.json`
- Test: `pipeline/tests/test_history.py`

- [ ] **Step 1: Write failing tests for backfill merge**

Append these tests to `pipeline/tests/test_history.py`:

```python
def test_merge_history_applies_backfill_before_latest_price():
    existing = None
    backfill = {
        'aceh': {
            'PERTAMAX': [{
                'date': '2024-09-01',
                'price_rupiah': 12950,
                'source': {'type': 'official', 'name': 'Pertamina'},
            }],
        },
    }
    merged = merge_history(
        existing, 'Prov. Aceh', 'aceh', _products(('PERTAMAX', 13000)),
        '2026-07-01', backfill_events=backfill['aceh'],
    )
    assert merged['products']['PERTAMAX'] == [
        {'date': '2024-09-01', 'price_rupiah': 12950, 'source': {'type': 'official', 'name': 'Pertamina'}},
        {'date': '2026-07-01', 'price_rupiah': 13000, 'source': {'type': 'snapshot', 'name': 'MyPertamina sync'}},
    ]


def test_merge_history_dedupes_backfill_and_existing_by_date():
    existing = {
        'province': 'Prov. Aceh',
        'province_slug': 'aceh',
        'products': {'PERTAMAX': [{'date': '2024-09-01', 'price_rupiah': 12950}]},
    }
    backfill_events = {'PERTAMAX': [{'date': '2024-09-01', 'price_rupiah': 12950, 'source': {'type': 'official', 'name': 'Pertamina'}}]}
    merged = merge_history(existing, 'Prov. Aceh', 'aceh', _products(('PERTAMAX', 13000)), '2026-07-01', backfill_events=backfill_events)
    assert [p['date'] for p in merged['products']['PERTAMAX']] == ['2024-09-01', '2026-07-01']
```

- [ ] **Step 2: Run the focused tests**

Run: `python -m pytest pipeline/tests/test_history.py::test_merge_history_applies_backfill_before_latest_price pipeline/tests/test_history.py::test_merge_history_dedupes_backfill_and_existing_by_date -q`

Expected: fail because `merge_history` has no `backfill_events` parameter.

- [ ] **Step 3: Implement merge helpers**

In `pipeline/history.py`, update `merge_history` signature:

```python
def merge_history(existing, province, province_slug, products, date, backfill_events=None):
```

Add helper functions above `merge_history`:

```python
SNAPSHOT_SOURCE = {'type': 'snapshot', 'name': 'MyPertamina sync'}


def _event_key(point):
    return point.get('date')


def _sort_series(points):
    return sorted(points, key=lambda p: p.get('date', ''))


def _dedupe_series(points):
    deduped = {}
    for point in points:
        date = point.get('date')
        if date:
            deduped[date] = dict(point)
    return _sort_series(deduped.values())
```

Inside `merge_history`, seed `result_products` from existing history, append any `backfill_events` for the province, and after current-price merging run `_dedupe_series` for each product. When appending a generated current point, include `source: SNAPSHOT_SOURCE`.

- [ ] **Step 4: Run all history tests**

Run: `python -m pytest pipeline/tests/test_history.py -q`

Expected: pass.

- [ ] **Step 5: Add initial backfill file**

Create `pipeline/history_backfill.json` as a valid JSON object with this exact
data content:

```text
dki-jakarta.PERTAMAX[0].date = 2024-09-01
dki-jakarta.PERTAMAX[0].price_rupiah = 12950
dki-jakarta.PERTAMAX[0].source.type = reputable_news
dki-jakarta.PERTAMAX[0].source.name = Kontan
dki-jakarta.PERTAMAX[0].source.url = https://industri.kontan.co.id/news/daftar-harga-bbm-pertamina-per-september-2024-pertamax-turun-harga
dki-jakarta.PERTAMAX[0].source.published_at = 2024-09-01

dki-jakarta.PERTAMAX[1].date = 2024-10-01
dki-jakarta.PERTAMAX[1].price_rupiah = 12100
dki-jakarta.PERTAMAX[1].source.type = official
dki-jakarta.PERTAMAX[1].source.name = Kementerian PANRB InfoPublik
dki-jakarta.PERTAMAX[1].source.url = https://www.menpan.go.id/site/berita-terkini/berita-daerah/pertamina-resmi-turunkan-harga-bbm-non-subsidi-per-1-oktober-2024-di-seluruh-indonesia
dki-jakarta.PERTAMAX[1].source.published_at = 2024-10-01

dki-jakarta.PERTAMAX TURBO[0].date = 2024-09-01
dki-jakarta.PERTAMAX TURBO[0].price_rupiah = 14475
dki-jakarta.PERTAMAX TURBO[0].source.type = reputable_news
dki-jakarta.PERTAMAX TURBO[0].source.name = Kontan
dki-jakarta.PERTAMAX TURBO[0].source.url = https://industri.kontan.co.id/news/daftar-harga-bbm-pertamina-per-september-2024-pertamax-turun-harga
dki-jakarta.PERTAMAX TURBO[0].source.published_at = 2024-09-01

dki-jakarta.PERTAMAX TURBO[1].date = 2024-10-01
dki-jakarta.PERTAMAX TURBO[1].price_rupiah = 13250
dki-jakarta.PERTAMAX TURBO[1].source.type = official
dki-jakarta.PERTAMAX TURBO[1].source.name = Kementerian PANRB InfoPublik
dki-jakarta.PERTAMAX TURBO[1].source.url = https://www.menpan.go.id/site/berita-terkini/berita-daerah/pertamina-resmi-turunkan-harga-bbm-non-subsidi-per-1-oktober-2024-di-seluruh-indonesia
dki-jakarta.PERTAMAX TURBO[1].source.published_at = 2024-10-01
```

After writing the file, run `python -m json.tool pipeline/history_backfill.json`.

Expected: command exits 0 and pretty-prints the JSON.

- [ ] **Step 6: Load backfill in `update_history`**

Add this constant and loader to `pipeline/history.py`:

```python
BACKFILL_PATH = os.path.join(os.path.dirname(__file__), 'history_backfill.json')


def load_backfill(path=BACKFILL_PATH):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError('history backfill must be an object')
    return data
```

At the start of `update_history`, call `backfill = load_backfill()`. For each
province, pass `backfill.get(slug, {})` into `merge_history`.

- [ ] **Step 7: Run pipeline tests and commit**

Run: `python -m pytest pipeline/tests/ -q`

Expected: pass.

Run: `git add pipeline/history.py pipeline/history_backfill.json pipeline/tests/test_history.py && git commit -m 'feat: merge source-backed history backfill'`

### Task 3: Add Frontend History Types And Period Utilities

**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/types/schemas.ts`
- Create: `src/utils/history-periods.ts`
- Test: `src/__tests__/unit/history-periods.test.ts`

- [ ] **Step 1: Write failing utility tests**

Create `src/__tests__/unit/history-periods.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildHistorySummary } from '@/utils/history-periods';
import type { HistoryPoint } from '@/types/api';

const points: HistoryPoint[] = [
  { date: '2024-09-01', price_rupiah: 12950, source: { type: 'reputable_news', name: 'Kontan' } },
  { date: '2024-10-01', price_rupiah: 12100, source: { type: 'official', name: 'Pertamina' } },
  { date: '2026-06-09', price_rupiah: 16250 },
];

describe('buildHistorySummary', () => {
  it('derives periods and price stats', () => {
    const summary = buildHistorySummary('PERTAMAX', points, 'now', 2);
    expect(summary.currentPrice).toBe(16250);
    expect(summary.lowestPrice).toBe(12100);
    expect(summary.highestPrice).toBe(16250);
    expect(summary.visiblePeriods.map((p) => p.label)).toEqual([
      '1 Okt 2024 - 9 Jun 2026',
      '9 Jun 2026 - now',
    ]);
    expect(summary.periods[2].source.name).toBe('Historical snapshot');
  });
});
```

- [ ] **Step 2: Run the failing utility test**

Run: `npm run test -- src/__tests__/unit/history-periods.test.ts`

Expected: fail because `src/utils/history-periods.ts` does not exist.

- [ ] **Step 3: Add TypeScript history source types**

In `src/types/api.ts`, add:

```ts
export type HistorySourceType = 'official' | 'reputable_news' | 'snapshot';

export interface HistorySource {
  type: HistorySourceType;
  name: string;
  url?: string;
  published_at?: string;
}
```

Update `HistoryPoint`:

```ts
export interface HistoryPoint {
  date: string;
  price_rupiah: number;
  source?: HistorySource;
}
```

In `src/types/schemas.ts`, add:

```ts
export const historySourceSchema: z.ZodType<HistorySource> = z.object({
  type: z.enum(['official', 'reputable_news', 'snapshot']),
  name: z.string(),
  url: z.string().optional(),
  published_at: z.string().optional(),
});
```

Then make `source: historySourceSchema.optional()` part of each history point schema.

- [ ] **Step 4: Implement `src/utils/history-periods.ts`**

Create exported interfaces `HistoryPeriod` and `ProductHistorySummary`, plus `buildHistorySummary(productName, points, nowLabel = 'now', visibleLimit = 3)`. Sort points by date, map each point to a period ending at the next point date or `nowLabel`, compute current/lowest/highest prices, and use `{ type: 'snapshot', name: 'Historical snapshot' }` when a point has no source.

- [ ] **Step 5: Run tests and commit**

Run: `npm run test -- src/__tests__/unit/history-periods.test.ts`

Expected: pass.

Run: `git add src/types/api.ts src/types/schemas.ts src/utils/history-periods.ts src/__tests__/unit/history-periods.test.ts && git commit -m 'feat: derive visible history periods'`

### Task 4: Build Visible History Card Components

**Files:**
- Create: `src/components/MiniStepChart.tsx`
- Create: `src/components/PricePeriodList.tsx`
- Create: `src/components/ProductHistoryCard.tsx`
- Test: `src/__tests__/unit/product-history-card.test.tsx`

- [ ] **Step 1: Write failing card render test**

Create `src/__tests__/unit/product-history-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductHistoryCard } from '@/components/ProductHistoryCard';
import type { ProductHistorySummary } from '@/utils/history-periods';

const summary: ProductHistorySummary = {
  productName: 'PERTAMAX',
  currentPrice: 16250,
  lowestPrice: 12100,
  highestPrice: 16250,
  periods: [
    { startDate: '2024-10-01', endDate: '2026-06-09', label: '1 Okt 2024 - 9 Jun 2026', price_rupiah: 12100, source: { type: 'official', name: 'Pertamina' } },
    { startDate: '2026-06-09', endDate: null, label: '9 Jun 2026 - now', price_rupiah: 16250, source: { type: 'snapshot', name: 'Historical snapshot' } },
  ],
  visiblePeriods: [],
};
summary.visiblePeriods = summary.periods;

describe('ProductHistoryCard', () => {
  it('renders stats, old prices, and sources', () => {
    render(<ProductHistoryCard summary={summary} />);
    expect(screen.getByText('PERTAMAX')).toBeInTheDocument();
    expect(screen.getByText('Rp16.250')).toBeInTheDocument();
    expect(screen.getByText('Lowest')).toBeInTheDocument();
    expect(screen.getByText('1 Okt 2024 - 9 Jun 2026')).toBeInTheDocument();
    expect(screen.getByText('Pertamina')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing card test**

Run: `npm run test -- src/__tests__/unit/product-history-card.test.tsx`

Expected: fail because `ProductHistoryCard` does not exist.

- [ ] **Step 3: Create `MiniStepChart.tsx`**

Build a small inline SVG component accepting `points`, `productName`, and `colorClass`. It renders a step path, uses `role=img`, and labels the chart with product name and price range. Return a neutral text fallback for empty points.

- [ ] **Step 4: Create `PricePeriodList.tsx`**

Render `visiblePeriods` as a semantic list. If `source.url` exists, render an anchor with `target=_blank` and `rel=noreferrer`; otherwise render source name as text. Do not use `dangerouslySetInnerHTML`.

- [ ] **Step 5: Create `ProductHistoryCard.tsx`**

Render a stable-height article with product name, current/lowest/highest stats, `MiniStepChart`, and `PricePeriodList`. If `periods.length > visiblePeriods.length`, add a 44 px minimum-height button labeled `View all history` that expands the full list inline.

- [ ] **Step 6: Run tests and commit**

Run: `npm run test -- src/__tests__/unit/product-history-card.test.tsx`

Expected: pass.

Run: `git add src/components/MiniStepChart.tsx src/components/PricePeriodList.tsx src/components/ProductHistoryCard.tsx src/__tests__/unit/product-history-card.test.tsx && git commit -m 'feat: add visible product history cards'`

### Task 5: Refactor History Section To Render Card Grid

**Files:**
- Modify: `src/components/PriceHistoryChart.tsx`
- Modify: `src/__tests__/unit/price-history-chart.test.tsx`

- [ ] **Step 1: Update existing history chart tests**

In `src/__tests__/unit/price-history-chart.test.tsx`, update the successful render test so it expects visible product cards instead of one SVG chart:

```tsx
await waitFor(() => {
  expect(screen.getByText('Riwayat Harga')).toBeInTheDocument();
});
expect(screen.getByText('PERTAMAX')).toBeInTheDocument();
expect(screen.getByText('Old prices')).toBeInTheDocument();
expect(screen.getByText('Harga terkini')).toBeInTheDocument();
```

Keep the existing empty, 404, and retry tests.

- [ ] **Step 2: Run the updated chart test**

Run: `npm run test -- src/__tests__/unit/price-history-chart.test.tsx`

Expected: fail because `PriceHistoryChart` still renders selected-product tabs and the old chart.

- [ ] **Step 3: Refactor `PriceHistoryChart.tsx` render path**

Keep the existing fetch, loading, error, and empty branches. Remove `selectedProduct` state and product selector buttons. Keep range buttons. For each product in `history.products`, filter points by range, call `buildHistorySummary(productName, filteredPoints)`, and render `ProductHistoryCard` in a responsive grid:

```tsx
const summaries = useMemo(() => {
  if (!history) return [];
  const rangeDef = RANGES.find((r) => r.key === range);
  return Object.entries(history.products).map(([productName, raw]) =>
    buildHistorySummary(
      productName,
      filterByRange(raw, rangeDef?.days ?? null, new Date())
    )
  );
}, [history, range]);
```

Use a grid class matching the existing app style: `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`.

- [ ] **Step 4: Run focused frontend tests**

Run: `npm run test -- src/__tests__/unit/price-history-chart.test.tsx src/__tests__/unit/product-history-card.test.tsx src/__tests__/unit/history-periods.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

Run: `git add src/components/PriceHistoryChart.tsx src/__tests__/unit/price-history-chart.test.tsx && git commit -m 'feat: render history as product cards'`

### Task 6: Regenerate Static History JSON

**Files:**
- Modify: `v1/history/provinsi/*.json`
- Modify: `v1/history/index.json`

- [ ] **Step 1: Run pipeline generation**

Run: `python pipeline/fetch_normalize.py`

Expected: output includes `v1/history/provinsi/*.json` and no validation errors.

- [ ] **Step 2: Inspect generated history diff**

Run: `git diff -- v1/history/provinsi/dki-jakarta.json v1/history/index.json`

Expected: DKI Jakarta history includes the backfilled 2024 records with source metadata and generated latest records with snapshot source metadata.

- [ ] **Step 3: Run pipeline tests**

Run: `python -m pytest pipeline/tests/ -q`

Expected: pass.

- [ ] **Step 4: Commit generated history**

Run: `git add v1/history pipeline/history_backfill.json && git commit -m 'data: add source-backed history seed'`

### Task 7: Final Verification And Documentation Check

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run full pipeline verification**

Run: `python -m pytest pipeline/tests/ -q`

Expected: pass.

- [ ] **Step 2: Run frontend verification**

Run: `npm run lint`

Expected: pass.

Run: `npm run typecheck`

Expected: pass.

Run: `npm run test`

Expected: pass.

Run: `npm run build`

Expected: pass and bundle-size check remains under limits.

- [ ] **Step 3: Document additive history source metadata**

Add this to the README Data Shape section:

```text
History points may include optional source metadata. Backfilled points include
source.type, source.name, and source.url when available. Existing points without
source remain valid and should be treated as historical snapshots.
```

- [ ] **Step 4: Commit docs**

Run: `git add README.md && git commit -m 'docs: document history source metadata'`

- [ ] **Step 5: Final status check**

Run: `git status --short`

Expected: only pre-existing unrelated workspace changes remain. Do not stage or revert unrelated files.
