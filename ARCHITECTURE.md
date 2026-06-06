# Architecture

## Overview

Bensin-API is a static data API plus a static React dashboard.

```text
MyPertamina API
  -> pipeline/fetch_normalize.py
  -> v1/index.json, v1/nasional.json, v1/provinsi/*.json
  -> GitHub Pages static hosting
  -> React dashboard fetches JSON in the browser
```

There is no server-side application runtime in the repository.

## Data Pipeline

The pipeline lives in `pipeline/`.

- `pipeline/config.py` defines repository paths, the upstream URL, output
  directories, and product-name canonicalization.
- `pipeline/fetch_normalize.py` reads `price.json`, optionally fetches
  `https://api.web.mypertamina.id/price`, normalizes prices and province
  slugs, validates output, and writes `v1/`.
- `pipeline/schemas.py` defines Pydantic models for product, province,
  national, and index payloads.
- `pipeline/tests/` covers parsing, schema validation, sanity checks, and an
  end-to-end generator run using a temporary output directory.

The generator accepts two input shapes observed in code:

- `{"data": [ ... ]}`
- `{"data": {"data": [ ... ], "total": ...}}`

The committed `price.json` uses the nested shape.

## Static API

The generated static API is committed under `v1/`.

- `v1/index.json` is a province catalog and endpoint index.
- `v1/nasional.json` contains all province payloads.
- `v1/provinsi/*.json` contains one province per file.

Current observed snapshots contain 40 province files and 9 products per
province. The current committed snapshots and current pipeline canonicalization
are not fully aligned for BIOSOLAR product names; see `README.md` Q&A and
`TROUBLESHOOTING.md`.

## Frontend Application

The frontend lives in `src/` and is built by Vite.

- `src/main.tsx` mounts the app into `#root` and wraps it in
  `AppErrorBoundary`.
- `src/App.tsx` initializes the theme store and renders `RouterProvider`.
- `src/router.tsx` defines lazy-loaded routes with retry and chunk-error
  handling.
- `src/api/client.ts` fetches the static API with a 10-second timeout and typed
  `ApiError` classifications.
- `src/stores/fuel-store.ts` caches index, province, and national data in
  Zustand and tracks failed attempts per request key.
- `src/stores/theme-store.ts` stores light/dark theme preference in
  `localStorage` and falls back to OS preference.

Observed routes:

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `ProvinceListPage` | Searchable province list. |
| `/provinsi/:slug` | `ProvinceDetailPage` | Province-specific price cards. |
| `/nasional` | `NationalPage` | National comparison by product. |
| `*` | `NotFoundPage` | 404 fallback. |

## UI And State Patterns

The frontend uses shared components for:

- Error states with retry buttons.
- Empty states.
- Skeleton loading states.
- Manual refresh.
- Sharing via Web Share API with clipboard fallback.
- Stale-data and stale-time banners.
- Theme toggle.
- Price cards and grids.

The app includes accessibility-oriented behavior in code:

- Native buttons and links for interactions.
- `aria-live` regions for updates and errors.
- `aria-label` on compact controls.
- Minimum 44 px tap-target classes on interactive controls.
- `prefers-reduced-motion` handling in CSS.

## Build And Test Architecture

Build tooling:

- Vite with React plugin.
- Tailwind CSS 4 through `@tailwindcss/vite`.
- LightningCSS for CSS transform and minification.
- Manual vendor chunking for React, React DOM, React Router, and Zustand.
- Bundle-size enforcement in `scripts/check-bundle-size.js`.

Testing:

- Vitest with jsdom for frontend tests.
- `fast-check` property tests under `src/__tests__/properties/`.
- pytest and Hypothesis for pipeline tests.

## CI Workflow

The observed workflow is `.github/workflows/sync.yml`.

It is a scheduled data-sync workflow, not a full frontend CI workflow. It runs
hourly and on manual dispatch, fetches upstream data, regenerates `v1/`, runs
pipeline tests, performs data sanity checks, opens a pull request, and
auto-merges that pull request.

## Security Boundaries

- All API data is public static JSON.
- The frontend has no authentication, cookies, or server-side execution.
- The theme preference is stored in `localStorage`.
- The pipeline calls an external upstream service and writes files locally.
- The GitHub workflow uses `GITHUB_TOKEN` with `contents: write` and
  `pull-requests: write`.

## Generated And Installed Artifacts

These directories are present in this workspace but are not maintained source:

- `node_modules/`
- `web/node_modules/`
- `dist/`
- `.pytest_cache/`
- `.hypothesis/`
- Python `__pycache__/`

They should not be used as the source of project behavior documentation.
