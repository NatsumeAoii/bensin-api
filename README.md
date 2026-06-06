# Bensin-API

Bensin-API is a public Indonesian fuel-price data project with two maintained
parts:

- A static JSON API under `v1/`, generated from a MyPertamina price payload.
- A React dashboard that reads those static JSON files from GitHub Pages.

The repository has no application backend server. The Python code is a data
generation pipeline, and the frontend is a Vite single-page app.

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite dev server URL shown in your terminal. The default Vite port is
`http://localhost:5173`.

The frontend API client currently uses this fixed base URL:

```text
https://nasgunawann.github.io/bensin-api
```

There is no observed environment variable or config file for switching the
frontend to local `v1/` data.

## Requirements

- Node.js `>=20.0.0`, as declared in `package.json`.
- npm, because this repository includes `package-lock.json`.
- Python for pipeline work. The GitHub Actions workflow uses Python `3.12`;
  `CONTRIBUTING.md` says Python `>=3.10`.
- Python packages from `requirements.txt`: `httpx`, `pydantic`, `pytest`, and
  `hypothesis`.

## Install

Frontend dependencies:

```bash
npm install
```

Pipeline dependencies:

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For Linux or macOS shells, activate the virtual environment with:

```bash
source .venv/bin/activate
```

## Usage

Run the dashboard locally:

```bash
npm run dev
```

Build the dashboard:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Generate static API files from the committed `price.json` snapshot:

```bash
python pipeline/fetch_normalize.py
```

Fetch the upstream MyPertamina payload before generating:

```bash
python pipeline/fetch_normalize.py --fetch
```

The generator writes `v1/index.json`, `v1/nasional.json`, and
`v1/provinsi/*.json`. With `--fetch`, it also writes a timestamped file under
`raw/` and overwrites `price.json`.

## Public API

Production base URL:

```text
https://nasgunawann.github.io/bensin-api
```

| Endpoint | Purpose |
| --- | --- |
| `/v1/index.json` | Lightweight index of provinces, paths, product counts, and file sizes. |
| `/v1/nasional.json` | Full national payload containing all provinces. |
| `/v1/provinsi/{slug}.json` | Fuel prices for one province slug. |

Example:

```js
const baseUrl = "https://nasgunawann.github.io/bensin-api";
const response = await fetch(`${baseUrl}/v1/provinsi/dki-jakarta.json`);

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const province = await response.json();
console.log(province.province, province.products);
```

## Data Shape

Observed current generated data:

- `v1/index.json` reports `provinsi_count: 40`.
- `v1/provinsi/` contains 40 province JSON files.
- Each current province file contains 9 products.
- `v1/nasional.json` contains the same 40 provinces in one file.
- Current generated snapshots have `synced_at` values from
  `2026-06-05T12:14:30Z` and `pertamina_updated_at`
  `2026-06-01T15:59:37.000Z`.

Important drift to know: `pipeline/config.py` maps
`PERTAMINA BIOSOLAR SUBSIDI` to `BIOSOLAR` and
`PERTAMINA BIOSOLAR NON SUBSIDI` to `BIOSOLAR NON SUBSIDI`, but the committed
`v1/` snapshots still contain the longer upstream product names. Running the
current generator against `price.json` will produce the canonical names.

Product availability values are defined by both the Python schema and the
TypeScript API types:

| Value | Meaning |
| --- | --- |
| `available` | `price_rupiah` contains an integer price. |
| `unavailable` | The upstream value is empty, null, zero, or otherwise unavailable. |
| `unknown` | The parser cannot determine availability from the upstream value. |

## Configuration

No `.env` file, `VITE_*` variable, or runtime configuration loader is present in
the frontend code.

Observed fixed configuration values:

| Location | Value |
| --- | --- |
| `src/api/client.ts` | Frontend fetch base URL is `https://nasgunawann.github.io/bensin-api`. |
| `src/api/client.ts` | Frontend fetch timeout is 10 seconds. |
| `pipeline/config.py` | Upstream URL is `https://api.web.mypertamina.id/price`. |
| `pipeline/fetch_normalize.py` | Upstream fetch timeout is 15 seconds with 3 attempts. |
| `scripts/check-bundle-size.js` | JS chunk limit is 200 KB gzipped. |
| `vite.config.ts`, `vitest.config.ts`, `tsconfig.app.json` | `@/` resolves to `src/`. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite dev server. |
| `npm run build` | Runs TypeScript typecheck, Vite build, and bundle-size check. |
| `npm run preview` | Serves the production build locally. |
| `npm run typecheck` | Runs `tsc --noEmit`. |
| `npm run lint` | Runs ESLint. |
| `npm run test` | Runs Vitest once. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run test:all` | Runs Vitest and then `python -m pytest pipeline/tests/`. |
| `npm run clean` | Removes `dist/`. |
| `npm run ci` | Runs lint, typecheck, Vitest, and build. |
| `npm run pipeline` | Runs the Python generator against local `price.json`. |
| `npm run pipeline:fetch` | Fetches upstream data, then runs the generator. |
| `npm run pipeline:test` | Runs pipeline pytest tests. |

## Testing

Frontend tests use Vitest with jsdom and `@testing-library/jest-dom` setup from
`src/__tests__/setup.ts`.

```bash
npm run test
```

Pipeline tests use pytest and Hypothesis.

```bash
python -m pytest pipeline/tests/
```

Combined test command:

```bash
npm run test:all
```

Verified in this checkout:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed with 33 files and 174 tests.
- `npm run build` passed and all JS chunks were below the 200 KB gzip budget.
- `python -m pytest pipeline/tests/` passed once with 17 tests, then a repeat
  full run on local Python `3.14.4` hit a Hypothesis `DeadlineExceeded` timing
  flake in `test_property5_valid_nasional_roundtrip`; rerunning that isolated
  test passed.

## CI And Deployment

The visible GitHub Actions workflow is `.github/workflows/sync.yml`.

It runs hourly and on manual dispatch. The job:

1. Checks out the repository.
2. Sets up Python `3.12`.
3. Installs `requirements.txt`.
4. Runs `python pipeline/fetch_normalize.py --fetch`.
5. Runs `python -m pytest pipeline/tests/`.
6. Runs data sanity checks:
   - `v1/index.json` must contain at least 30 provinces.
   - At least 50% of product entries must have non-null `price_rupiah`.
   - `v1/nasional.json` must be between 10 KB and 10 MB.
7. Creates a pull request with `peter-evans/create-pull-request@v6`.
8. Auto-merges the generated PR with `gh pr merge`.

No frontend GitHub Actions workflow was found in this checkout, although
`package.json` provides local frontend verification commands.

## Project Structure

```text
bensin-api/
  .github/workflows/sync.yml       Hourly Python data sync workflow
  .kiro/specs/                     Requirements/design/task notes present locally
  .vscode/extensions.json          VS Code extension recommendations
  pipeline/                        Python data generator and schemas
  pipeline/tests/                  pytest and Hypothesis tests
  public/                          Static browser assets
  raw/                             Ignored upstream payload output directory
  scripts/check-bundle-size.js     Post-build JS gzip size check
  src/                             React dashboard source
  src/__tests__/                   Vitest unit and property tests
  src/api/client.ts                Fixed-base-url JSON client
  src/components/                  Reusable UI components
  src/pages/                       Route pages
  src/stores/                      Zustand stores
  src/types/                       TypeScript API response types
  src/utils/                       Format, search, sort, slug, and hook utilities
  v1/                              Committed generated static JSON API snapshots
  index.html                       Vite HTML entry
  package.json                     Node dependencies and scripts
  price.json                       Local upstream snapshot used by the pipeline
  requirements.txt                 Python dependencies
  vite.config.ts                   Vite config
  vitest.config.ts                 Vitest config
```

Generated or installed directories present in this workspace include
`node_modules/`, `web/node_modules/`, `dist/`, `.pytest_cache/`, `.hypothesis/`,
and Python `__pycache__/` directories. They are not maintained source files.

## Contributing

See `CONTRIBUTING.md`.

Before opening a pull request, run the checks that match your change:

```bash
npm run ci
python -m pytest pipeline/tests/
```

If you only changed frontend code, `npm run ci` is the observed frontend check.
If you changed pipeline code or generated data, run the pipeline tests.

## Security

See `SECURITY.md`.

Do not open a public issue for suspected vulnerabilities. Use the repository's
GitHub Security Advisories page or contact the maintainer via the visible
GitHub profile `@nasgunawann`.

## License

MIT. See `LICENSE` and `LICENSE.md`.

## Q&A

<details><summary><strong>Do I need to run a backend server for the dashboard?</strong></summary>

No. The React app is a static Vite app. It fetches JSON from GitHub Pages using
the fixed base URL in `src/api/client.ts`.

</details>

<details><summary><strong>How do I make the frontend use local `v1/` JSON files?</strong></summary>

There is no observed configuration switch for that. The current code hard-codes
`https://nasgunawann.github.io/bensin-api`. Testing local JSON would require a
code change to `BASE_URL` in `src/api/client.ts` or adding a supported
configuration path.

</details>

<details><summary><strong>Are there environment variables I must set?</strong></summary>

No required environment variables were found in the code, package scripts,
pipeline, or workflow. The workflow uses GitHub's built-in `GITHUB_TOKEN`.

</details>

<details><summary><strong>Which files are generated and safe to regenerate?</strong></summary>

The pipeline writes `v1/index.json`, `v1/nasional.json`, and
`v1/provinsi/*.json`. With `--fetch`, it also writes `raw/raw-*.json` and
overwrites `price.json`. `dist/` is generated by `npm run build`.

</details>

<details><summary><strong>Why do current `v1/` product names differ from `PRODUCT_CANONICAL_MAP`?</strong></summary>

The committed snapshots appear older than the current canonicalization logic.
The current pipeline maps upstream BIOSOLAR names to shorter canonical values,
but the committed `v1/` files still contain `PERTAMINA BIOSOLAR SUBSIDI` and
`PERTAMINA BIOSOLAR NON SUBSIDI`.

</details>

<details><summary><strong>What should I run before changing pipeline code?</strong></summary>

Install Python dependencies with `pip install -r requirements.txt`, then run
`python -m pytest pipeline/tests/`. If you intentionally regenerate data, review
the `v1/` diff because timestamps and product names can change.

</details>

<details><summary><strong>What should I run before changing frontend code?</strong></summary>

Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
The shorthand command `npm run ci` runs those frontend checks in sequence.

</details>

<details><summary><strong>Why can `npm run build` fail after tests pass?</strong></summary>

The build runs `scripts/check-bundle-size.js` after Vite finishes. Any generated
JS chunk over 200 KB gzipped causes a build failure.

</details>

<details><summary><strong>What does the scheduled sync workflow validate?</strong></summary>

It validates generated data with pytest and an inline sanity check. The sanity
check enforces at least 30 provinces, at least 50% non-null prices, and a
`v1/nasional.json` size between 10 KB and 10 MB.

</details>

<details><summary><strong>Is `v1/` source or build output?</strong></summary>

It is generated output, but it is also committed and served as the public static
API. Treat it as generated data that must be reviewed when regenerated.

</details>
