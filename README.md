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

The frontend API client fetches generated `v1/` JSON from the same deployment
by default. It can be overridden with the `VITE_API_BASE_URL` environment
variable (see `.env.example`) to point the dashboard at another static API
host.

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

The generator writes `v1/index.json`, `v1/nasional.json`,
`v1/provinsi/*.json`, and `v1/history/`. With `--fetch`, it also writes a
timestamped file under `raw/` and overwrites `price.json`.

## Public API

Production base URL:

```text
https://nasgunawann.github.io/bensin-api
```

| Endpoint                   | Purpose                                                                |
| -------------------------- | ---------------------------------------------------------------------- |
| `/v1/index.json`           | Lightweight index of provinces, paths, product counts, and file sizes. |
| `/v1/nasional.json`        | Full national payload containing all provinces.                        |
| `/v1/provinsi/{slug}.json` | Fuel prices for one province slug.                                     |
| `/v1/history/provinsi/{slug}.json` | Change-based price history for one province slug.             |

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
- Product names in the committed snapshots are canonical (matching
  `PRODUCT_CANONICAL_MAP`), e.g. `BIOSOLAR` and `BIOSOLAR NON SUBSIDI`.

Product availability values are defined by both the Python schema and the
TypeScript API types:

| Value         | Meaning                                                            |
| ------------- | ------------------------------------------------------------------ |
| `available`   | `price_rupiah` contains an integer price.                          |
| `unavailable` | The upstream value is empty, null, zero, or otherwise unavailable. |
| `unknown`     | The parser cannot determine availability from the upstream value.  |

## Configuration

No `.env` file is required. The frontend reads one optional environment
variable, `VITE_API_BASE_URL` (see `.env.example`); when unset it uses the
same deployment base path as the dashboard.

Observed configuration values:

| Location                                                  | Value                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/api/client.ts`                                       | Fetch base URL, overridable via `VITE_API_BASE_URL`; defaults to the dashboard's same-origin Vite base path. |
| `src/api/client.ts`                                       | Fetch timeout is 10 seconds; responses are validated against Zod schemas.                                    |
| `pipeline/config.py`                                      | Upstream URL is `https://api.web.mypertamina.id/price`.                                                      |
| `pipeline/fetch_normalize.py`                             | Upstream fetch timeout is 15 seconds with 3 attempts.                                                        |
| `scripts/check-bundle-size.js`                            | JS chunk limit is 200 KB gzipped; CSS limit is 75 KB gzipped.                                                |
| `vite.config.ts`, `vitest.config.ts`, `tsconfig.app.json` | `@/` resolves to `src/`.                                                                                     |

## Scripts

| Command                  | What it does                                                  |
| ------------------------ | ------------------------------------------------------------- |
| `npm run dev`            | Starts the Vite dev server.                                   |
| `npm run build`          | Runs TypeScript typecheck, Vite build, and bundle-size check. |
| `npm run preview`        | Serves the production build locally.                          |
| `npm run typecheck`      | Runs `tsc --noEmit`.                                          |
| `npm run lint`           | Runs ESLint.                                                  |
| `npm run test`           | Runs Vitest once.                                             |
| `npm run test:watch`     | Runs Vitest in watch mode.                                    |
| `npm run test:coverage`  | Runs Vitest with V8 coverage and thresholds.                  |
| `npm run test:all`       | Runs Vitest and then `python -m pytest pipeline/tests/`.      |
| `npm run format`         | Formats `src/` with Prettier.                                 |
| `npm run format:check`   | Checks `src/` formatting without writing.                     |
| `npm run clean`          | Removes `dist/`.                                              |
| `npm run ci`             | Runs lint, typecheck, Vitest, and build.                      |
| `npm run pipeline`       | Runs the Python generator against local `price.json`.         |
| `npm run pipeline:fetch` | Fetches upstream data, then runs the generator.               |
| `npm run pipeline:test`  | Runs pipeline pytest tests.                                   |

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

- `npm run lint`, `npm run typecheck`, and `npm run format:check` passed.
- `npm run test` passed with 37 files and 210 tests.
- `npm run build` passed; all JS chunks were below the 200 KB gzip budget and
  CSS below the 75 KB budget.
- `python -m pytest pipeline/tests/` passed with 49 tests.

## CI And Deployment

Two GitHub Actions workflows are present:

`.github/workflows/sync.yml` regenerates the data. It runs every 6 hours
(cron `0 */6 * * *`) and on manual dispatch. The job:

1. Checks out the repository.
2. Sets up Python `3.12` with pip caching.
3. Installs `requirements.txt`.
4. Runs `python pipeline/fetch_normalize.py --fetch` (validates the upstream
   payload before overwriting `price.json`).
5. Runs `python -m pytest pipeline/tests/`.
6. Runs the shared data sanity check via `python -m pipeline.sanity_check`:
   - `v1/index.json` must contain at least 30 provinces.
   - At least 50% of product entries must have non-null `price_rupiah`.
   - `v1/nasional.json` must be between 10 KB and 10 MB.
7. Commits and pushes updated snapshots directly to `main` with `[skip ci]`.

`.github/workflows/ci.yml` enforces code quality on push and pull request: a
frontend job (`npm ci`, lint, typecheck, format check, test, build) and a
pipeline job (pytest).

`.github/workflows/deploy-pages.yml` builds the dashboard and deploys it to
GitHub Pages on push to `main`, after a successful sync run, or on manual
dispatch.

## Project Structure

```text
bensin-api/
  .github/workflows/sync.yml       Data sync workflow (every 6 hours)
  .github/workflows/ci.yml         Frontend + pipeline CI on push/PR
  .github/workflows/deploy-pages.yml  GitHub Pages deploy
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
`node_modules/`, `dist/`, `coverage/`, `.pytest_cache/`, `.hypothesis/`,
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

No. The React app is a static Vite app. It fetches generated JSON from the same
deployment by default, or from `VITE_API_BASE_URL` when that override is set.

</details>

<details><summary><strong>How do I make the frontend use local `v1/` JSON files?</strong></summary>

For `npm run dev`, leaving `VITE_API_BASE_URL` unset fetches `/v1/` from the
Vite dev origin. To serve `v1/` from another local static server, set
`VITE_API_BASE_URL` in a `.env.local` file (see `.env.example`) to that host,
e.g. `http://localhost:3000`.

</details>

<details><summary><strong>Are there environment variables I must set?</strong></summary>

None are required. The frontend reads one optional variable,
`VITE_API_BASE_URL` (see `.env.example`). The sync workflow uses GitHub's
built-in `GITHUB_TOKEN`.

</details>

<details><summary><strong>Which files are generated and safe to regenerate?</strong></summary>

The pipeline writes `v1/index.json`, `v1/nasional.json`, `v1/provinsi/*.json`,
and `v1/history/`. With `--fetch`, it also writes `raw/raw-*.json` and
overwrites `price.json`. `dist/` and `coverage/` are generated by build/test.

</details>

<details><summary><strong>Are the committed `v1/` product names canonical?</strong></summary>

Yes. The committed snapshots use the canonical names from
`PRODUCT_CANONICAL_MAP` (e.g. `BIOSOLAR`, `BIOSOLAR NON SUBSIDI`). Regenerating
from the committed `price.json` changes only the `synced_at` timestamps.

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
