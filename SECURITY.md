# Security Policy

## Supported Versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest `main` branch   | Yes       |
| Older commits or forks | No        |

This repository is a single-branch static site and data pipeline. No separate
release branches or supported legacy versions were found.

## Reporting A Vulnerability

Do not open a public issue for suspected vulnerabilities.

Use GitHub private vulnerability reporting for this repository:

```text
https://github.com/nasgunawann/bensin-api/security/advisories
```

If that is unavailable, contact the maintainer through the visible GitHub
profile:

```text
https://github.com/nasgunawann
```

Include:

- Affected file, endpoint, workflow, or dependency.
- Steps to reproduce.
- Expected impact.
- Any proof of concept needed to validate the report.
- Suggested fix, if known.

## Reporter Expectations

- Acknowledgment target: within 72 hours.
- Initial assessment target: within 7 days.
- Fix target for confirmed critical issues: best effort, typically within
  14 days.

These timelines are the policy stated by the current repository docs; they are
not enforced by code.

## Disclosure Policy

Please keep vulnerability details private until a fix is available and the
maintainer has coordinated disclosure. After remediation, disclosure should be
made through a GitHub Security Advisory when appropriate.

## In Scope

- Python pipeline code in `pipeline/`.
- Generated public JSON under `v1/`.
- Frontend code under `src/`.
- GitHub Actions workflows under `.github/workflows/` (`sync.yml`, `ci.yml`,
  `deploy-pages.yml`).
- Direct npm and Python dependencies declared in `package.json` and
  `requirements.txt`.

## Out Of Scope

- Vulnerabilities in the upstream MyPertamina service.
- GitHub Pages platform availability or rate limiting.
- Social engineering.
- Reports requiring access to secrets not present in this repository.

## Security Considerations For Deployers

- The frontend is a static SPA and has no observed authentication, credential
  cookies, server sessions, or user-data collection.
- Theme preference is stored in `localStorage` under the key `theme`.
- The frontend fetches public JSON from
  `https://nasgunawann.github.io/bensin-api` (or `VITE_API_BASE_URL` when set)
  with a 10-second timeout, and validates every response against a Zod schema
  before use.
- The pipeline can fetch from `https://api.web.mypertamina.id/price`; fetched
  payloads are written to `price.json`, `raw/`, and generated `v1/` files.
- Pipeline output is validated with Pydantic before writes in
  `pipeline/fetch_normalize.py`.
- The scheduled sync workflow uses `GITHUB_TOKEN` with `contents: write` and
  pushes regenerated snapshots directly to `main`. The Pages deploy workflow
  uses `pages: write` and `id-token: write`.
- No hardcoded application secrets were found in project source.

## Hardening Checklist

- Keep npm and Python dependencies patched (Dependabot is configured in
  `.github/dependabot.yml` for npm, pip, and GitHub Actions).
- Review generated `v1/` diffs before trusting changed data.
- Treat `raw/` payloads as untrusted upstream input; the generator validates
  fetched payloads before overwriting `price.json`.
- Keep GitHub Actions permissions scoped to the minimum needed.
- Frontend code is enforced before merge by `ci.yml` (lint, typecheck, format
  check, test, build).
