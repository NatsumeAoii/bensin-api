# Troubleshooting

## `npm run dev` starts, but data is not local

By default the frontend API client fetches from:

```text
https://nasgunawann.github.io/bensin-api
```

To read locally generated `v1/` files, set `VITE_API_BASE_URL` in a `.env.local`
file (see `.env.example`) to a host serving the repo root, then start a static
server there. For example:

```text
VITE_API_BASE_URL=http://localhost:3000
```

```bash
npx serve .   # or: python -m http.server 3000
```

## `npm run build` fails on bundle size

`npm run build` runs:

```bash
npm run typecheck && vite build && node scripts/check-bundle-size.js
```

The bundle check fails if any JS chunk in `dist/assets/` exceeds 200 KB gzipped.
Check the failing chunk name in the command output and review recent dependency
or import changes.

## `python pipeline/fetch_normalize.py` says `price.json` is missing

The generator reads `price.json` from the repository root. From the root, run:

```bash
python pipeline/fetch_normalize.py
```

If `price.json` is not present, fetch upstream:

```bash
python pipeline/fetch_normalize.py --fetch
```

This requires `httpx` from `requirements.txt`.

## Pipeline imports fail under pytest

Run pytest from the repository root:

```bash
python -m pytest pipeline/tests/
```

Install pipeline dependencies first:

```bash
pip install -r requirements.txt
```

## Regenerating `v1/` changes timestamps

The committed `v1/` snapshots already use the canonical product names from
`PRODUCT_CANONICAL_MAP` (e.g. `BIOSOLAR`, `BIOSOLAR NON SUBSIDI`). Regenerating
from the committed `price.json` changes only the `synced_at` timestamps, so
review the diff and discard a timestamp-only churn if you did not intend it.

## `npm run test:all` fails after frontend tests pass

`npm run test:all` runs both:

```bash
vitest run
python -m pytest pipeline/tests/
```

If the failure is in the Python section, verify that `requirements.txt` has
been installed in the active Python environment.

On local Python `3.14.4`, a repeat full pytest run during documentation review
hit a Hypothesis `DeadlineExceeded` timing flake in
`test_property5_valid_nasional_roundtrip`. The same full suite passed earlier,
and the isolated test passed on rerun. If this recurs, treat it as a flaky
deadline issue before assuming the generated JSON round-trip assertion is wrong.

## The dashboard reports `Koneksi terlalu lama`

`src/api/client.ts` aborts fetches after 10 seconds. The store tracks failed
attempts per request key and stops retrying after 3 failed attempts until the
reset timer runs. This can happen when GitHub Pages or the network is slow.

Use the visible refresh action after the connection recovers.

## The scheduled sync workflow publishes bad data

The workflow runs `python -m pipeline.sanity_check` before committing, which
enforces:

- At least 30 province entries in `v1/index.json`.
- At least 50% of product prices are non-null.
- `v1/nasional.json` size is between 10 KB and 10 MB.

It then pushes the updated snapshots directly to `main`. If a bad snapshot
passes these checks, add a more specific pipeline test or extend
`pipeline/sanity_check.py`.

## `@/` imports do not resolve

The alias is configured in three places:

- `vite.config.ts`
- `vitest.config.ts`
- `tsconfig.app.json`

If a new alias is added, update all relevant configs.

## `npm run pipeline:fetch` rewrites unexpected files

This is expected. The command runs:

```bash
python pipeline/fetch_normalize.py --fetch
```

It can write:

- `price.json`
- `raw/raw-*.json`
- `v1/index.json`
- `v1/nasional.json`
- `v1/provinsi/*.json`

Review all generated diffs before committing.
