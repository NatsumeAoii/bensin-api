# Bensin-API v2 — Feature Expansion Master Plan

## Context

Bensin-API is a static Indonesian fuel price data project: a Python pipeline fetches
from MyPertamina → generates `v1/*.json` → React SPA reads it from GitHub Pages.
40 provinces, 9 products, price history, national comparison. No application backend
server. 210 frontend tests + 49 pipeline tests.

**Stack:** React 19, React Router 7, Zustand, Zod, Tailwind CSS 4, Vite, Vitest,
fast-check, Lucide React. Python pipeline uses httpx, Pydantic, pytest, Hypothesis.

---

## Design Decisions (resolved)

| Question | Decision |
|---|---|
| Navigation expansion | Overflow menu: Provinsi, Nasional, Perubahan as primary. Peta + settings in "Lainnya" dropdown. Mobile: 3 primary items + "Lainnya" icon. |
| i18n strategy | Set up i18n infrastructure in Phase 0. Each feature adds its own `t()` calls as it's built. No giant final pass. |
| Price Change Feed data | Fetch all 40 history files on page load via `Promise.allSettled`. Cache in Zustand. |
| Province map data source | Build-time GeoJSON → TypeScript conversion. Script reads GeoJSON, simplifies paths, writes `src/data/province-paths.ts`. |
| Embed widget | Separate Vite entry point (`vite.config.embed.ts`). Self-contained build. |

---

## Phase 0: Prerequisites (must complete before any feature work)

### 0A: i18n Infrastructure

Set up the translation system so every subsequent feature can add its own strings.

**Create:**
- `src/i18n/translations.ts` — flat `{ id: {...}, en: {...} }` maps. Start with the
  strings currently hardcoded in Layout, Footer, ThemeToggle, and the existing pages.
  ~60 keys to start. Each feature adds its own keys here.
- `src/i18n/context.tsx` — `I18nProvider` + `useTranslation()` hook.
  - `useTranslation()` returns `{ t, locale, setLocale }`.
  - `t(key, params?)` with `{name}` interpolation. Falls back to `id` if key missing.
  - Uses React context. NOT Zustand — context is fine for ~100 static strings.
- `src/i18n/index.ts` — re-exports.
- `src/stores/locale-store.ts` — Zustand store with localStorage persistence.
  - Key: `"bbm-locale"`. Values: `"id"` | `"en"`.
  - Detection: `navigator.language.startsWith("en")` → `"en"`, else `"id"`.
  - try/catch on localStorage (same pattern as `theme-store.ts`).
- `src/components/LocaleToggle.tsx` — toggle button with `Languages` icon.
  - Renders "ID" / "EN" text. `aria-label` toggles language name.
  - 44x44px touch target.
  - Placed next to `ThemeToggle` in header.

**Modify:**
- `src/main.tsx` — wrap `<App>` in `<I18nProvider>`.
- `src/components/Layout.tsx` — add `<LocaleToggle>` next to `<ThemeToggle>`.
- `src/utils/date.ts` — accept optional `locale` parameter in `formatSyncTime`.
- `src/utils/format.ts` — accept optional `locale` parameter in `formatRupiah`.
- All existing pages and components — replace hardcoded Indonesian strings with `t()` calls.
  This is a mechanical pass over ~15 files. Each file's strings get keys like:
  - `nav.provinces`, `nav.national`, `search.placeholder`, `price.available`,
    `price.unavailable`, `price.unknown`, `error.retry`, `stale.warning`,
    `loading.data`, `empty.no_results`, `share.label`, `refresh.label`, etc.

**Tests:**
- `src/__tests__/locale-store.test.ts` — persistence, detection, fallback, corrupted storage.
- `src/__tests__/translations.test.ts` — all keys exist in both locales, no orphan keys,
  interpolation params match between locales.
- `src/__tests__/locale-toggle.test.tsx` — renders, toggles, aria-label, 44x44px.

### 0B: Overflow Menu Component

Build the nav infrastructure so features can add nav items without breaking layout.

**Create:**
- `src/components/OverflowMenu.tsx` — dropdown menu for secondary nav items.
  - Desktop: "Lainnya" button with `MoreHorizontal` icon. Opens a dropdown with
    `<NavLink>` items. Closes on outside click, Escape, and route change.
  - Mobile: "Lainnya" icon in the bottom nav bar (4th item). Opens a bottom sheet
    or popover with secondary nav items.
  - Keyboard: focus trap inside open menu, arrow keys navigate items, Escape closes.
  - `aria-expanded`, `aria-haspopup="menu"`, `role="menu"` on the dropdown.
  - Each item: `role="menuitem"`, same active/inactive styling as existing nav.
  - `prefers-reduced-motion`: no animation on open/close.

**Modify:**
- `src/components/Layout.tsx` — replace the current hardcoded nav with a data-driven
  approach:
  ```ts
  const primaryNav = [
    { to: "/", label: "nav.provinces", icon: Fuel, end: true },
    { to: "/nasional", label: "nav.national", icon: BarChart3 },
    { to: "/perubahan", label: "nav.changes", icon: History },
  ];
  const secondaryNav = [
    { to: "/peta", label: "nav.map", icon: Map },
  ];
  ```
  Desktop: render `primaryNav` as `<NavLink>`, `secondaryNav` inside `<OverflowMenu>`.
  Mobile bottom nav: render first 3 primary items + OverflowMenu trigger as 4th item.
  The nav items are defined once, used in both desktop and mobile views.

**Tests:**
- `src/__tests__/overflow-menu.test.tsx` — opens/closes, keyboard nav, outside click,
  escape closes, aria attributes, active state propagation.

---

## Phase 1: Quick Wins (minimal cross-file impact, can be parallel)

### Feature 1: Province-to-Province Navigation

**What:** Prev/next buttons on `ProvinceDetailPage` cycle through sorted provinces.

**Implementation:**
- `src/utils/province-nav.ts`:
  ```ts
  function getAdjacentSlugs(
    provinces: IndexProvinceEntry[],
    currentSlug: string
  ): { prev: IndexProvinceEntry | null; next: IndexProvinceEntry | null; index: number }
  ```
  - Input: sorted province list (alphabetical by `name`, locale `"id"`).
  - Returns prev/next entries and current index (0-based).
  - Returns `{ prev: null, next: null, index: -1 }` if slug not found.
- `src/pages/ProvinceDetailPage.tsx`:
  - Fetch `index` from store. Derive sorted list. Call `getAdjacentSlugs`.
  - Render prev/next `<Link>` buttons flanking the breadcrumb.
  - Layout: `[← Prev] [Breadcrumb: Provinsi / Name] [Next →]`.
  - Prev: `ArrowLeft` icon + province name. Next: province name + `ArrowRight` icon.
  - Boundary: hide the button that would go past first/last.
  - Loading state: if index not loaded, show shimmer placeholders for buttons.
  - Keyboard: `useEffect` adding `keydown` listener for `ArrowLeft`/`ArrowRight`
    (only when no `<input>` or `<textarea>` is focused).
  - `aria-label`: `"Provinsi sebelumnya: {name}"` / `"Provinsi berikutnya: {name}"`.
  - Province counter badge: small `"12 / 40"` pill next to the breadcrumb.

**Tests:**
- `src/__tests__/province-nav.test.ts`:
  - First province: prev=null, next=second.
  - Last province: prev=second-to-last, next=null.
  - Only one province: both null.
  - Slug not in list: both null, index=-1.
  - Sorting is alphabetical by Indonesian locale.
- `src/__tests__/province-nav.prop.test.ts`:
  - Property: for any valid slug present in the list, `index` is in `[0, length)`.
  - Property: `prev` and `next` are always valid `IndexProvinceEntry` or null.

### Feature 2: Favourites / Bookmarks

**What:** Bookmark provinces for quick access. Bookmarked provinces pinned at top of list.

**Implementation:**
- `src/stores/bookmark-store.ts`:
  ```ts
  interface BookmarkState {
    bookmarks: string[];
    toggleBookmark: (slug: string) => void;
    isBookmarked: (slug: string) => boolean;
    clearAll: () => void;
  }
  ```
  - localStorage key: `"bbm-bookmarks"`. Persist as JSON array.
  - Max 20 bookmarks. `toggleBookmark` at limit: no-op (existing bookmarks still toggleable).
  - try/catch on read/write (same as `theme-store.ts`).
- `src/components/BookmarkButton.tsx`:
  - Props: `{ slug: string }`. Reads from bookmark store.
  - Icons: `Bookmark` (not bookmarked), `BookmarkCheck` (bookmarked) from lucide-react.
  - `aria-pressed={isBookmarked}`. Label: `"Simpan provinsi"` / `"Hapus dari simpanan"`.
  - 44x44px. Same borderless button style as `RefreshButton`.
- `src/components/BookmarkedSection.tsx`:
  - Renders above search on `ProvinceListPage` when `bookmarks.length > 0`.
  - Header: "Provinsi Tersimpan" + count badge + "Hapus semua" button (with confirmation).
  - Horizontal scrollable row of compact province cards (name + chevron).
  - Each card is a `<Link to={/provinsi/${slug}}>`.
  - Empty: section not rendered at all.
- Integration:
  - `ProvinceDetailPage`: add `<BookmarkButton>` in the action bar (next to Share + Refresh).
  - `ProvinceListPage`: add `<BookmarkButton>` overlay on each province card (top-right corner).
  - `ProvinceListPage`: render `<BookmarkedSection>` above search when bookmarks exist.
- URL bookmark merge:
  - On `ProvinceListPage` mount, read `?bookmarks=` search param.
  - If present, parse comma-separated slugs, validate each with `isValidSlug`,
    merge into localStorage bookmarks (union, dedupe).
  - Replace URL without the param (clean history).
  - Share button on BookmarkedSection generates `?bookmarks=slug1,slug2` URL.

**Tests:**
- `src/__tests__/bookmark-store.test.ts`:
  - Toggle on/off. Persistence round-trip (simulate page reload). Max limit.
  - Empty localStorage. Corrupted JSON in localStorage (falls back to empty).
  - `clearAll` empties the array.
- `src/__tests__/bookmark-button.test.tsx`:
  - Renders Bookmark icon when not saved, BookmarkCheck when saved.
  - Click toggles. `aria-pressed` matches state. 44x44px.
- `src/__tests__/bookmarked-section.test.tsx`:
  - Hidden when no bookmarks. Shows bookmarked province names.
  - "Hapus semua" clears bookmarks. Confirmation dialog.
- `src/__tests__/url-bookmark-merge.test.ts`:
  - Valid slugs merged. Invalid slugs ignored. Duplicates deduped.

### Feature 3: National Page Enhancements

**What:** Sort direction toggle, island region grouping, average price, availability filter.

**Implementation:**
- `src/utils/regions.ts`:
  ```ts
  const REGION_MAP: Record<string, { name: string; slugs: string[] }> = {
    sumatera: { name: "Sumatera", slugs: ["aceh", "sumatera-utara", ...] },
    jawa: { name: "Jawa", slugs: ["dki-jakarta", "banten", ...] },
    // ... 7 regions total
  };
  function getRegion(slug: string): string | null;
  function groupByRegion(provinces: ProvinceResponse[]): Map<string, ProvinceResponse[]>;
  ```
  - All 40 slugs mapped. Verified by test.
- `src/utils/sort.ts`:
  - Add optional `direction: "asc" | "desc"` parameter. Default: `"asc"`.
  - Null prices always sort last regardless of direction.
- `src/pages/NationalPage.tsx`:
  - **Sort toggle:** button with `ArrowUpDown` icon. Toggles `sortDir` state.
    Persist in URL search params: `?sort=desc`. Read on mount.
  - **Region grouping:** toggle button "Kelompokkan per pulau".
    When active: render `<RegionGroup>` sections instead of flat list.
    Each group: collapsible `<details open>` with region name, count, average price.
    Sorted by region average price (cheapest region first).
  - **Average price:** computed in the `priceMap` `useMemo`. Displayed as a dashed
    horizontal line in the stats bar. Label: `"Rata-rata: Rp 11.450"`.
  - **Availability filter:** pill group before the province list.
    Options: `"Semua"` (all), `"Tersedia"`, `"Tidak Tersedia"`.
    Count badge on each. Filters the province list before sorting.
- `src/components/RegionGroup.tsx`:
  - Props: `{ name: string; provinces: ProvinceResponse[]; product: string; ... }`
  - `<details>` element with styled summary header.
  - Header shows: region name, province count, region average price.
  - Content: same province ranking list (reuses existing row rendering).
  - `open` by default. Animation on toggle (respects reduced-motion).

**Tests:**
- `src/__tests__/regions.test.ts`:
  - All 40 slugs mapped. No unmapped slugs from index.json.
  - `getRegion` returns correct region for known slugs, null for unknown.
  - `groupByRegion` produces expected groups.
- `src/__tests__/sort.test.ts` — add descending sort tests, null-still-last in both directions.
- Update `NationalPage` tests for sort toggle, region grouping, average, availability filter.

### Feature 4: SEO & Social Metadata

**What:** OG tags, Twitter Cards, JSON-LD, sitemap.xml, robots.txt.

**Implementation:**
- `src/utils/meta-tags.ts`:
  ```ts
  function useMetaTags(options: {
    title: string;
    description: string;
    url?: string;
    image?: string;
    type?: string;
  }): void
  ```
  - Creates/updates `<meta>` tags for `og:title`, `og:description`, `og:url`, `og:image`,
    `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
  - Also updates `<title>` (replaces `useDocumentTitle` — call `useMetaTags` instead).
  - Cleans up on unmount (restores base tags).
- `src/utils/structured-data.ts`:
  ```ts
  function useJsonLd(schema: Record<string, unknown>): void
  ```
  - Injects `<script type="application/ld+json">` on mount, removes on unmount.
  - Schema generators: `websiteSchema()`, `datasetSchema(province)`, `webPageSchema(title)`.
- `index.html`:
  - Add default OG/Twitter meta tags (title, description, image, url, type).
  - Add `<link rel="manifest" href="/manifest.json">` (for Phase 3 PWA).
  - Add `<meta name="theme-color" content="#f97316">`.
- `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://nasgunawann.github.io/bensin-api/sitemap.xml
  ```
- `public/og-image.png`:
  - Branded 1200x630 image. Create as a static asset (not generated).
  - Simple design: gradient background with "BBM Indonesia" text and fuel icon.
- `pipeline/generate_sitemap.py`:
  - Reads `v1/index.json`. Writes `public/sitemap.xml`.
  - Includes: homepage, `/nasional`, `/perubahan`, `/peta`, all 40 province URLs.
  - `<lastmod>` from `synced_at`. `<changefreq>hourly</changefreq>`.
- `.github/workflows/sync.yml`:
  - Add step after `python -m pipeline.sanity_check`: `python pipeline/generate_sitemap.py`.
  - `git add public/sitemap.xml` in the commit step.

**Integration per page:**
- `ProvinceListPage`: `useMetaTags({ title: "Daftar Provinsi", description: "..." })`.
  `useJsonLd(websiteSchema())`.
- `ProvinceDetailPage`: `useMetaTags({ title: data.province, description: "Harga BBM di {province}..." })`.
  `useJsonLd(datasetSchema(data))`.
- `NationalPage`: `useMetaTags({ title: "Perbandingan Nasional", ... })`.
  `useJsonLd(webPageSchema("Perbandingan Nasional"))`.

**Tests:**
- `src/__tests__/meta-tags.test.ts`:
  - Creates OG tags on mount. Updates on prop change. Cleans up on unmount.
  - Falls back to base title when no title provided.
- `src/__tests__/structured-data.test.ts`:
  - Injects script tag on mount. Removes on unmount. Valid JSON in content.
- `pipeline/tests/test_sitemap.py`:
  - Generates valid XML. Contains all province URLs. `<lastmod>` matches `synced_at`.

---

## Phase 2: Data & Analytics (depends on Phase 1 patterns)

### Feature 5: Enhanced Price History Chart

**What:** Multi-product overlay, stats summary, CSV export, accessible table fallback.

**Implementation:**
- `src/utils/csv-export.ts`:
  ```ts
  function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void
  ```
  - Creates Blob with UTF-8 BOM (for Excel compatibility).
  - `URL.createObjectURL` → temporary `<a>` click → revoke.
  - Escapes commas, quotes, newlines in cell values.
- `src/utils/history-stats.ts`:
  ```ts
  interface HistoryStats {
    startPrice: number;
    endPrice: number;
    changeAbsolute: number;
    changePercent: number;
    pointCount: number;
  }
  function computeHistoryStats(series: HistoryPoint[]): HistoryStats | null
  ```
  - Returns null for empty series. Single point: change = 0.
- `src/components/PriceHistoryChart.tsx`:
  - **Multi-product:** change product pills from single-select to toggle-select.
    State: `selectedProducts: string[]` (max 3). First product auto-selected.
    Clicking a 4th product deselects the first.
    Pass array to `ChartCanvas`. Legend rendered in the chart header.
  - **Stats bar:** below the chart, horizontal row:
    `"Harga awal: Rp X → Harga terakhir: Rp Y (+Z%)"`.
    Color: emerald for decrease, red for increase, stone for no change.
  - **Export button:** `Download` icon in chart header. onClick calls `exportToCsv`.
    Filename: `riwayat-{slug}-{product}-{range}.csv`.
    Columns: `Tanggal`, `Harga (Rp)`, `Harga (formatted)`.
  - **Data point count:** show `"N titik perubahan"` next to the range selector pills.
    If N=1: `"1 titik — harga belum berubah"`.
- `src/components/PriceHistoryChart.canvas.tsx`:
  - Accept `series: Array<{ name: string; color: { from: string; to: string }; points: HistoryPoint[] }>` instead of single series.
  - Render one `<path>` per series with its own color.
  - Hover: show tooltip with all series values at the hovered date.
  - Legend: rendered by parent, not here.
  - Geometry: compute per-series in a loop inside `useMemo`.
- `src/components/HistoryDataTable.tsx`:
  - Props: `{ series: HistoryPoint[]; productName: string; provinceName: string }`.
  - Toggle: "Tampilkan data dalam tabel" / "Sembunyikan tabel" button.
  - Table: `<table>` with `<caption>`, `<thead>`, `<tbody>`.
  - Columns: Tanggal, Harga, Perubahan (delta from previous point).
  - `sr-only` by default, visible when toggled.
  - Each row: formatted date, formatted price, formatted delta (+/- amount).

**Tests:**
- `src/__tests__/csv-export.test.ts`:
  - Produces valid CSV string. Escapes special chars. BOM present.
  - Empty rows produces header-only CSV.
- `src/__tests__/history-stats.test.ts`:
  - Empty → null. Single point → zero change. Multiple points → correct delta.
  - All same price → 0% change. Negative change → correct sign.
- Update `PriceHistoryChart` tests for multi-select, stats bar, export button.

### Feature 6: Price Change Feed / Timeline

**What:** Chronological feed of price changes across all provinces.

**Implementation:**
- `src/types/api.ts` — add:
  ```ts
  interface HistoryIndexEntry {
    slug: string;
    name: string;
    path: string;
    point_count: number;
  }
  interface HistoryIndexResponse {
    count: number;
    synced_at: string;
    provinsi: HistoryIndexEntry[];
  }
  interface PriceChangeEvent {
    date: string;
    province: string;
    province_slug: string;
    product: string;
    old_price: number;
    new_price: number;
    change_absolute: number;
    change_percent: number;
  }
  ```
- `src/types/schemas.ts` — add `historyIndexResponseSchema` (includes `synced_at`).
- `src/api/client.ts` — add:
  ```ts
  getHistoryIndex: () => fetchJson<HistoryIndexResponse>("/v1/history/index.json", historyIndexResponseSchema)
  getAllHistory: (slugs: string[]) => Promise.allSettled(slugs.map(s => apiClient.getHistory(s)))
  ```
- `src/utils/history-feed.ts`:
  ```ts
  function buildChangeFeed(
    histories: Array<{ slug: string; name: string; products: Record<string, HistoryPoint[]> }>
  ): PriceChangeEvent[]
  ```
  - For each province, for each product, iterate consecutive points.
  - If `price[i] !== price[i-1]`, emit a change event with old/new/delta/%.
  - Sort by date descending, then by province name.
- `src/stores/fuel-store.ts` — add:
  ```ts
  historyFeed: PriceChangeEvent[] | null;
  historyFeedLoading: boolean;
  historyFeedError: ApiError | null;
  fetchHistoryFeed: (bypassCache?: boolean) => Promise<void>;
  ```
  - `fetchHistoryFeed`: fetch index, get all slugs, fetch all histories in parallel,
    transform via `buildChangeFeed`, store result.
  - Uses same `runFetch` pattern.
- `src/pages/PriceChangePage.tsx`:
  - Route: `/perubahan`. Lazy-loaded.
  - Hero: "Riwayat Perubahan Harga" + total changes count + last sync time.
  - Filter: product pills (same style as NationalPage). Date range: 7d / 30d / all.
  - Search: province name filter.
  - List: vertical timeline of `<TimelineEntry>` grouped by date.
  - Loading: shimmer skeleton (5-6 timeline placeholders).
  - Empty: "Belum ada perubahan harga yang tercatat".
  - Error: retry for transient.
  - StaleTimeBanner. Document title + canonical URL + meta tags.
- `src/components/PriceChangeTimeline.tsx`:
  - Groups events by date. Renders date headers + event list.
  - Each date group: formatted date header + count badge.
- `src/components/TimelineEntry.tsx`:
  - Props: `PriceChangeEvent`.
  - Layout: `[product icon] [province name] [product name] [old → new] [delta badge]`.
  - Delta badge: green `"▼ Rp 500 (-2%)"` or red `"▲ Rp 1.000 (+5%)"`.
  - Entire entry is a `<Link to={/provinsi/${slug}}>`.
  - `aria-label`: full description for screen readers.
- Nav integration:
  - Add to `primaryNav` in Layout: `{ to: "/perubahan", label: "nav.changes", icon: History }`.
  - This makes it one of the 3 primary nav items (Provinsi, Nasional, Perubahan).

**Tests:**
- `src/__tests__/history-feed.test.ts`:
  - Empty input → empty output. Single province, single product, no changes → empty.
  - Two consecutive different prices → one event. Same price → no event.
  - Sorting: most recent first.
- `src/__tests__/price-change-page.test.tsx`:
  - Loading, error, empty, populated states.
  - Product filter. Date range filter. Province search.
- `src/__tests__/timeline-entry.test.tsx`:
  - Renders province name, product, prices, delta. Correct color for increase/decrease.
  - Link navigates to province detail.

### Feature 7: Pipeline Hardening & Data Quality

**What:** Slug collision detection, history index timestamp, endpoint docs, health monitoring.

**Implementation:**
- `pipeline/fetch_normalize.py`:
  - After `generate_outputs` builds all payloads, collect slugs into a dict.
    If a slug already exists, append `-2`, `-3`, etc. to the duplicate.
    Log warning: `"Slug collision: '{name1}' and '{name2}' → '{slug}'"`.
  - Add to `index['endpoints']`:
    ```python
    'history_index': '/v1/history/index.json',
    'province_history': '/v1/history/provinsi/{slug}.json',
    ```
- `pipeline/history.py`:
  - In `update_history`, add `'synced_at': iso_now()` to the history index output.
  - Import `iso_now` from `fetch_normalize` (or duplicate the 2-line function).
- `pipeline/schemas.py`:
  - Add `HistoryIndexModel(BaseModel)`:
    ```python
    class HistoryIndexModel(BaseModel):
        count: int
        synced_at: NonEmptyStr
        provinsi: List[HistoryIndexEntry]
    class HistoryIndexEntry(BaseModel):
        slug: NonEmptyStr
        name: NonEmptyStr
        path: NonEmptyStr
        point_count: int
    ```
- `pipeline/health_check.py` (new):
  - `run_health_check(old_price_path, new_price_path) -> list[str]`:
    - Compare province counts. Flag if delta > 5.
    - Check any province has 0 products. Flag.
    - Check all prices zero. Flag.
    - Check `synced_at` freshness. Flag if > 24h old.
  - `main()`: reads old/new, runs checks, prints summary, exits 0/1.
- `pipeline/tests/test_slug_collision.py`:
  - Two mock provinces with identical names → different slugs.
  - Three identical names → `slug`, `slug-2`, `slug-3`.
- `pipeline/tests/test_health_check.py`:
  - Normal payload → no flags.
  - Missing provinces → flag. Zero products → flag. All zero prices → flag.
- `pipeline/tests/test_history_index.py`:
  - After `update_history`, index has `synced_at` field.
  - `synced_at` is valid ISO 8601.
- `.github/workflows/sync.yml`:
  - Add after sanity check: `python pipeline/health_check.py price.json /tmp/new-price.json || true`
  - Add data diff summary:
    ```yaml
    - name: Data diff summary
      if: always()
      run: |
        echo "## Data Changes" >> $GITHUB_STEP_SUMMARY
        git diff --stat v1/ >> $GITHUB_STEP_SUMMARY
    ```

---

## Phase 3: UX & Accessibility (depends on Phase 1 layout)

### Feature 8: PWA / Offline Support

**What:** Service worker, web manifest, offline caching, update banner.

**Implementation:**
- `public/manifest.json`:
  ```json
  {
    "name": "BBM Indonesia — Harga BBM",
    "short_name": "BBM.id",
    "description": "Harga BBM Indonesia terbaru dari Pertamina",
    "start_url": "/bensin-api/",
    "scope": "/bensin-api/",
    "display": "standalone",
    "background_color": "#fafaf9",
    "theme_color": "#f97316",
    "orientation": "any",
    "icons": [
      { "src": "/bensin-api/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/bensin-api/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- `public/sw.js`:
  - Cache names: `bbm-shell-v1`, `bbm-data-v1`, `bbm-fonts-v1`.
  - `install`: pre-cache app shell (`/`, `/index.html`, critical CSS/JS paths).
    Use `event.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_URLS)))`.
  - `activate`: delete caches not in current version set.
  - `fetch`:
    - Navigation requests (`mode === 'navigate'`): network-first, fallback to cached `/index.html`.
    - `/v1/*.json`: network-first, fallback to cache. On success, update cache.
    - Static assets (JS/CSS with hash in filename): cache-first (immutable).
    - Fonts from `fonts.gstatic.com`: cache-first, 30-day expiry.
  - Cache size: data cache limited to 50 entries. LRU eviction on cache write.
- `src/sw-register.ts`:
  - Register `sw.js` only in production (`import.meta.env.PROD`).
  - Listen for `updatefound` on registration. When new SW activates, set `updateAvailable` state.
  - Expose `useServiceWorkerUpdate()` hook: returns `{ updateAvailable, applyUpdate }`.
- `src/components/UpdateBanner.tsx`:
  - Uses `useServiceWorkerUpdate()`.
  - Renders `<WarningBanner>` with "Pembaruan tersedia" message + "Perbarui" button.
  - Button calls `applyUpdate()` which posts `SKIP_WAITING` to SW and reloads.
  - Dismissible (hidden until next update).
- `src/components/OfflineBanner.tsx`:
  - `useEffect` with `window.addEventListener('online'/'offline')`.
  - When offline: renders `<WarningBanner>` with "Anda sedang offline. Menampilkan data tersimpan.".
  - When back online: auto-hides after 3 seconds.
  - `aria-live="polite"`.
- Integration:
  - `src/main.tsx`: `import "./sw-register"`.
  - `src/App.tsx`: render `<OfflineBanner />` and `<UpdateBanner />` at top level.
  - `index.html`: manifest link, theme-color, apple-touch-icon already added in Feature 4.
- Icon generation:
  - `public/icons/icon-192.png` and `icon-512.png`.
  - Branded: orange gradient background, white fuel pump icon, "BBM" text.
  - Create once as static assets (not generated at build time).

**Tests:**
- `src/__tests__/offline-banner.test.tsx`:
  - Renders warning when offline. Hides when online. Auto-hide after reconnect delay.
- `src/__tests__/update-banner.test.tsx`:
  - Hidden when no update. Shows when update available. Button triggers reload.
- `src/__tests__/sw-register.test.ts`:
  - Mock `navigator.serviceWorker`. Verify registration call in production.
  - Verify no registration in development.

### Feature 9: Accessibility Enhancements

**What:** High-contrast mode, focus management, motion preferences, contrast audit.

**Implementation:**
- `src/stores/contrast-store.ts`:
  - Same pattern as theme-store. Key: `"bbm-contrast"`. Values: `"normal"` | `"high"`.
  - Applies `.high-contrast` class on `<html>`.
- `src/components/ContrastToggle.tsx`:
  - `Contrast` icon from lucide-react. Toggle between normal/high.
  - `aria-pressed`. Label: "Aktifkan kontras tinggi" / "Nonaktifkan kontras tinggi".
  - 44x44px.
- `src/index.css`:
  - Add `.high-contrast` overrides:
    ```css
    html.high-contrast { --color-surface: #ffffff; /* pure white */ }
    html.high-contrast body { color: #000000; }
    html.high-contrast .border-stone-200\/80 { border-color: #000; border-width: 2px; }
    html.high-contrast :focus-visible { outline-width: 3px; }
    ```
  - Add `@media (prefers-contrast: high)` to auto-apply without toggle.
- `src/utils/use-focus-heading.ts`:
  ```ts
  function useFocusHeading(ref: RefObject<HTMLHeadingElement | null>): void
  ```
  - On mount (and route change), `ref.current?.focus()` with `tabIndex={-1}` on the h1.
  - Uses `useEffect` with the route key as dependency.
- `src/utils/use-prefers-reduced-motion.ts`:
  ```ts
  function usePrefersReducedMotion(): boolean
  ```
  - Listens to `matchMedia('(prefers-reduced-motion: reduce)')`.
  - Returns reactive boolean. Updates on change.
- Apply `useFocusHeading` to all page `<h1>` elements:
  - `ProvinceListPage`, `ProvinceDetailPage`, `NationalPage`, `PriceChangePage`, `MapPage`.
  - Each page's `<h1>` gets `ref={headingRef}` and `tabIndex={-1}`.
- Update `PriceHistoryChart.canvas.tsx`:
  - Replace `prefersReducedMotion()` function call with `usePrefersReducedMotion()` hook.
  - Reactive: if user toggles reduced-motion while page is open, chart responds.
- Contrast audit fix:
  - Find all `text-stone-400` on light backgrounds (bg-white, bg-stone-50).
  - Bump to `text-stone-500` where it's body text (passes AA at 4.5:1).
  - `text-stone-400` is acceptable only on large text (>= 18px bold) or decorative elements.
- Settings area:
  - In Layout header, group ThemeToggle + LocaleToggle + ContrastToggle into a
    `<div className="flex items-center gap-1">` cluster.

**Tests:**
- `src/__tests__/contrast-store.test.ts` — toggle, persistence, class on html, fallback.
- `src/__tests__/contrast-toggle.test.tsx` — renders, toggles, aria-pressed, 44x44px.
- `src/__tests__/use-focus-heading.test.tsx` — focus called on mount, not called on re-render.
- `src/__tests__/use-prefers-reduced-motion.test.tsx` — returns true/false, updates on change.

### Feature 10: Province Map View

**What:** Interactive SVG chloropleth map colored by fuel price.

**Implementation:**
- **GeoJSON → TypeScript build step:**
  - `scripts/build-map-data.js`:
    - Reads a GeoJSON file (`data/indonesia-provinces.geojson`) from project root.
    - Uses `topojson-simplify` or manual Douglas-Peucker to reduce vertex count.
    - Maps GeoJSON feature properties to province slugs (via a lookup table).
    - Writes `src/data/province-paths.ts`:
      ```ts
      export const PROVINCE_PATHS: Record<string, { d: string; name: string }> = {
        "dki-jakarta": { d: "M 123 456 L ...", name: "Prov. DKI Jakarta" },
        // ...
      };
      export const MAP_VIEWBOX = "0 0 800 600";
      ```
    - Target: < 30KB gzipped for the paths data.
  - Add to `package.json`: `"build:map": "node scripts/build-map-data.js"`.
  - Run before `vite build` (add to `build` script chain).
  - The GeoJSON source file is committed in `data/` (not in `src/`).
- `src/utils/color-scale.ts`:
  ```ts
  function getPriceColor(price: number | null, min: number, max: number): string
  ```
  - Returns HSL color string. Green (120°) → yellow (60°) → red (0°).
  - Null price → `"#d4d4d4"` (stone-300 gray).
  - Single price (min === max) → yellow.
- `src/components/ProvinceMap.tsx`:
  - Props: `{ product: string; provinces: ProvinceResponse[] }`.
  - Renders `<svg viewBox={MAP_VIEWBOX}>` with `<path>` per province.
  - Each path: `d` from `PROVINCE_PATHS`, `fill` from `getPriceColor`.
  - Hover: show `<MapTooltip>` with province name + price.
  - Click: `useNavigate()` to `/provinsi/{slug}`.
  - Keyboard: each `<path>` has `tabIndex={0}`, `role="button"`,
    `aria-label="{province}: {formattedPrice}"`.
  - Focus ring: 2px orange outline on focused path.
  - Legend: horizontal gradient bar with min/max labels.
- `src/components/MapTooltip.tsx`:
  - Positioned near cursor/focused element. Shows province name + price + availability.
  - Uses `position: absolute` relative to the SVG container.
  - Hidden on touch devices (tap navigates directly).
  - `role="tooltip"`, `aria-hidden="true"` (info is on the path's aria-label).
- `src/pages/MapPage.tsx`:
  - Route: `/peta`. Lazy-loaded.
  - Fetches national data (or uses cached from store).
  - Product selector pills (same as NationalPage).
  - Renders `<ProvinceMap>`.
  - Loading: shimmer in map shape.
  - Error: retry state.
  - Hero: "Peta Harga BBM" + product selector + last sync time.
  - Document title + canonical URL + meta tags.
- Nav integration:
  - Add to `secondaryNav` in Layout (goes into OverflowMenu): `{ to: "/peta", label: "nav.map", icon: Map }`.

**Tests:**
- `src/__tests__/color-scale.test.ts`:
  - Min price → green hue. Max price → red hue. Mid → yellow.
  - Null → gray. Min === max → yellow. Boundary clamping.
- `src/__tests__/province-map.test.tsx`:
  - Renders all 40 paths. Hover shows tooltip. Click navigates.
  - Keyboard: focus on path, Enter navigates. `aria-label` on each path.
  - Product selector changes colors.

---

## Phase 4: Export & CI/CD

### Feature 11: Data Export & Embed Widget

**What:** CSV/JSON data export + embeddable widget for external sites.

**Implementation:**
- `src/utils/csv-export.ts` — already built in Feature 5. Extend:
  - Add `exportProvinceCsv(province: ProvinceResponse)` — exports one province's products.
  - Add `exportNationalCsv(national: NationalResponse)` — exports all provinces.
  - Add `exportHistoryCsv(history: HistoryResponse, product: string)` — exports one product's history.
- `src/utils/json-export.ts`:
  ```ts
  function exportToJson(filename: string, data: unknown): void
  ```
  - `JSON.stringify(data, null, 2)` → Blob → download.
- Export buttons:
  - `src/components/ExportDropdown.tsx`:
    - Button with `Download` icon. Opens dropdown: "CSV" / "JSON".
    - `aria-haspopup="menu"`, `aria-expanded`.
    - Closes on selection or outside click.
  - `ProvinceDetailPage`: add `<ExportDropdown>` in action bar.
    CSV exports province data, JSON exports full province payload.
  - `NationalPage`: add `<ExportDropdown>` next to refresh.
    CSV exports all provinces for selected product, JSON exports full national payload.
- **Embed widget:**
  - `src/embed.tsx` — separate entry point:
    ```tsx
    const container = document.currentScript?.previousElementSibling;
    if (!container) return;
    const province = container.getAttribute("data-province") || "dki-jakarta";
    const theme = container.getAttribute("data-theme") || "light";
    // Fetch province data, render PriceGrid into shadow DOM
    ```
  - Creates a shadow DOM on the container div. Injects minimal styles.
  - Fetches province JSON directly (no Zustand, no router — standalone).
  - Auto-refresh every 6 hours via `setInterval`.
  - Error state: shows "Gagal memuat data" with retry button.
- `vite.config.embed.ts`:
  - Separate Vite config. Entry: `src/embed.tsx`. Output: `dist/embed.js`.
  - No code splitting. Single file. Inline CSS.
  - Build runs after main build: `vite build --config vite.config.embed.ts`.
  - Target: < 50KB gzipped (React + component + styles).
- `src/pages/EmbedPage.tsx`:
  - Route: `/embed`. Lazy-loaded.
  - Form: province dropdown (from index data), theme toggle, product filter.
  - Preview: renders the embed widget inline.
  - Code snippet: shows `<div data-province="..." data-theme="..."></div><script src="...embed.js"></script>`.
  - Copy button for the snippet.
- Nav integration:
  - Link in footer: "Embed Widget" → `/embed`.
  - Not in main nav (secondary feature).
- `package.json`:
  - Add `"build:embed": "vite build --config vite.config.embed.ts"`.
  - Update `"build"`: `"npm run typecheck && vite build && npm run build:embed && node scripts/check-bundle-size.js"`.
- `.github/workflows/deploy-pages.yml`:
  - Build step already runs `npm run build`. Since `build:embed` is now in the build chain, it's covered.

**Tests:**
- `src/__tests__/export-dropdown.test.tsx`:
  - Opens/closes. CSV option calls export. JSON option calls export. Outside click closes.
- `src/__tests__/json-export.test.ts`:
  - Produces valid JSON blob. Filename correct.
- `src/__tests__/embed-page.test.tsx`:
  - Renders form. Preview updates on selection. Code snippet contains correct attributes.

### Feature 12: CI/CD Pipeline Enhancements

**What:** Lighthouse CI, data diff reporting, bundle size tracking, dependabot auto-merge.

**Implementation:**
- `.github/workflows/lighthouse.yml`:
  ```yaml
  name: Lighthouse CI
  on:
    pull_request:
      branches: [main]
  jobs:
    lighthouse:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: npm }
        - run: npm ci
        - run: npm run build
        - uses: treosh/lighthouse-ci-action@v12
          with:
            configPath: .lighthouserc.json
            uploadArtifacts: true
  ```
- `.lighthouserc.json`:
  ```json
  {
    "ci": {
      "assert": {
        "assertions": {
          "categories:performance": ["warn", { "minScore": 0.9 }],
          "categories:accessibility": ["error", { "minScore": 0.95 }],
          "categories:best-practices": ["warn", { "minScore": 0.9 }],
          "categories:seo": ["warn", { "minScore": 0.9 }]
        }
      },
      "collect": {
        "staticDistDir": "./dist",
        "url": ["/bensin-api/", "/bensin-api/nasional"]
      }
    }
  }
  ```
  - Accessibility is `error` (blocks PR). Others are `warn` (advisory).
- `scripts/check-bundle-size.js`:
  - After size check, write `dist/bundle-sizes.json`:
    ```json
    { "timestamp": "...", "js": { "vendor.js": 45.2, ... }, "css": { "index.css": 12.1 }, "totalKb": 120.5 }
    ```
  - CI step compares against previous artifact (if available) and warns on >5% increase.
- `.github/workflows/dependabot-auto-merge.yml`:
  ```yaml
  name: Dependabot Auto-Merge
  on: pull_request
  permissions:
    contents: write
    pull-requests: write
  jobs:
    auto-merge:
      if: github.actor == 'dependabot[bot]'
      runs-on: ubuntu-latest
      steps:
        - uses: dependabot/fetch-metadata@v2
        - run: gh pr merge --auto --squash
          env:
            GH_TOKEN: ${{ github.token }}
  ```
  - Only auto-merges `patch` updates for `devDependencies`.

---

## Execution Order (dependency-resolved)

```
Phase 0 (must complete first — infrastructure):
  0A: i18n Infrastructure         — sets up t(), locale store, LocaleToggle, replaces existing strings
  0B: Overflow Menu Component     — sets up nav infrastructure for all future nav items

Phase 1 (quick wins, can be parallel after Phase 0):
  Feature 1: Province Navigation  — touches ProvinceDetailPage only
  Feature 2: Favourites           — touches ProvinceListPage + ProvinceDetailPage
  Feature 3: National Enhancements — touches NationalPage + sort.ts + new regions.ts
  Feature 4: SEO & Metadata       — touches index.html + all pages (meta tags) + pipeline

Phase 2 (data features, sequential):
  Feature 5: Enhanced History Chart — touches PriceHistoryChart components
  Feature 6: Price Change Feed     — new page, new API methods, adds to primaryNav
  Feature 7: Pipeline Hardening    — Python only, zero frontend impact

Phase 3 (UX, depends on Phase 1 layout + Phase 0 i18n):
  Feature 8: PWA / Offline         — touches index.html, new public files, main.tsx
  Feature 9: Accessibility         — touches many components, high-contrast CSS
  Feature 10: Province Map         — new page, build script, adds to secondaryNav (OverflowMenu)

Phase 4 (final, depends on above):
  Feature 11: Export & Embed       — extends csv-export, new Vite entry, adds to footer
  Feature 12: CI/CD                — workflow files only, no source code impact
```

**Merge conflict minimization:**
- Phase 0 creates the i18n/nav infrastructure that Phase 1-3 features depend on.
- Features 1-4 touch different pages (ProvinceDetail, ProvinceList, National, all-pages-meta).
  Low conflict risk if done in parallel.
- Feature 5 touches only history chart components. No overlap with 1-4.
- Feature 6 adds a new page + modifies Layout nav (but nav is data-driven after Phase 0B).
- Feature 8 touches index.html and main.tsx — do after Features 4 (which also touches index.html).
- Feature 9 is a broad accessibility pass — do after all UI features are in place.
- Feature 10 uses the OverflowMenu from Phase 0B — no Layout conflict.
- Feature 11 is mostly new files + extends existing export utility.
- Feature 12 is CI-only — no source conflicts.

---

## Verification Checklist (per feature)

Every feature implementation must pass ALL of these before declaring complete:

1. `npm run lint` — no new warnings
2. `npm run typecheck` — no type errors
3. `npm run test` — all existing + new tests pass
4. `npm run build` — bundle within budget (200KB JS, 75KB CSS gzipped per chunk)
5. `python -m pytest pipeline/tests/` — for pipeline changes (Feature 4, 7)
6. `npm run dev` — manual route walkthrough, all states render (loading, empty, error, success)
7. Keyboard: Tab through all new interactive elements, verify focus-visible ring
8. `aria-label` on every interactive element, `aria-live` on dynamic content
9. Dark mode: toggle theme, verify all new components render correctly
10. Mobile: 320px width, no horizontal overflow, touch targets >= 44px
11. i18n: toggle locale, verify all new strings are translated
12. Reduced motion: `prefers-reduced-motion: reduce`, verify no jarring animations

---

## Residual Risks

| Risk | Mitigation |
|---|---|
| Bundle size creep from map SVG + i18n strings | Monitor per-feature via `check-bundle-size.js`. Map data target < 30KB gzip. i18n ~2KB gzip for ~100 keys. |
| GeoJSON source data quality | Use verified Natural Earth or GADM data. Manual province slug mapping table. Visual QA after build. |
| Service worker stale cache | Versioned cache names. `activate` event deletes old caches. Update banner forces reload. |
| 40 parallel history fetches on Price Change page | `Promise.allSettled` with individual error handling. Show partial results. Cache in Zustand. |
| i18n missing translations | Fallback to Indonesian (`id`) for any missing key. Test asserts all keys exist in both locales. |
| Embed widget bundle size | Separate build, tree-shake aggressively. Target < 50KB gzip. No router, no Zustand, no Lucide. |
| Lighthouse CI flakiness | Use `staticDistDir` for deterministic results. Accessibility is blocking; others are advisory. |
