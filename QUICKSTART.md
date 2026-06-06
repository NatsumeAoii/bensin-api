# Quick Start

This is the fastest path from a fresh clone to a running dashboard.

## 1. Install Frontend Dependencies

```bash
npm install
```

`package.json` requires Node.js `>=20.0.0`.

## 2. Start The Dashboard

```bash
npm run dev
```

Open the local URL printed by Vite. The default is:

```text
http://localhost:5173
```

The dashboard fetches data from:

```text
https://nasgunawann.github.io/bensin-api
```

No local backend is required.

## 3. Run Frontend Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Or run the frontend sequence:

```bash
npm run ci
```

## 4. Optional: Set Up The Python Pipeline

Only do this if you need to work on the data generator or generated `v1/` JSON.

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest pipeline/tests/
```

Linux/macOS activation:

```bash
source .venv/bin/activate
```

## 5. Optional: Regenerate API Snapshots

From the committed `price.json` snapshot:

```bash
python pipeline/fetch_normalize.py
```

Fetch upstream before generating:

```bash
python pipeline/fetch_normalize.py --fetch
```

Expected outputs:

- `v1/index.json`
- `v1/nasional.json`
- `v1/provinsi/*.json`

With `--fetch`, the script also writes `raw/raw-*.json` and overwrites
`price.json`.

## Known Quick-Start Limits

- No `.env` setup is documented because no environment variables were found.
- The frontend does not have an observed local API base URL switch.
- The visible GitHub Actions workflow validates the Python sync path, not the
  frontend npm checks.
