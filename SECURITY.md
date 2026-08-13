# Security Policy

## Supported Versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest `main` branch   | Yes       |
| Older commits or forks | No        |

This repository is a static site and data pipeline. The latest `main` branch is
the supported publication surface; forks and older commits do not receive
security fixes from this project.

## Reporting A Vulnerability

Do not open a public issue for suspected vulnerabilities.

Use GitHub private vulnerability reporting for this repository:

```text
https://github.com/nasgunawann/bensin-api/security/advisories
```

If private vulnerability reporting is unavailable, contact the maintainer
through the visible GitHub profile:

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
  `requirements.txt` and `requirements.lock`.

## Out Of Scope

- Vulnerabilities in the upstream MyPertamina service.
- GitHub Pages platform availability or rate limiting.
- Social engineering.
- Reports requiring access to secrets not present in this repository.

Conduct concerns are handled separately under `CODE_OF_CONDUCT.md`; do not use
the security channel for ordinary contribution disputes or interpersonal
conduct reports.

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
  pushes regenerated snapshots directly to `main`. The workflow rejects changed
  paths outside `price.json` and `v1/`, and stages only those paths. The Pages
  deploy workflow uses `pages: write` and `id-token: write`.
- GitHub Actions are pinned to full commit SHAs. Pages artifacts are validated
  for required files, generated JSON, metadata sizes, and a SHA-256 manifest
  before upload.
- No hardcoded application secrets were found in project source.

## Hardening Checklist

- Keep npm and Python dependencies patched (Dependabot is configured in
  `.github/dependabot.yml` for npm, pip, and GitHub Actions).
- CI runs `npm audit --audit-level=high` and `pip-audit -r requirements.lock`.
  High and critical findings block CI. Moderate findings require either an
  available update or a documented, reviewed exception.
- Review generated `v1/` diffs before trusting changed data.
- Treat `raw/` payloads as untrusted upstream input; the generator validates
  fetched payloads before overwriting `price.json`.
- Keep GitHub Actions permissions scoped to the minimum needed.
- Frontend code is enforced before merge by `ci.yml` (lint, typecheck, format
  check, test, build).
- `CODEOWNERS` requires maintainer review for workflows, dependencies, pipeline
  code, generated API output, and security policy changes.
- Dependency audit exceptions must identify the package, severity, reason,
  compensating control, owner, and review date. Do not suppress findings only
  to make CI green.
