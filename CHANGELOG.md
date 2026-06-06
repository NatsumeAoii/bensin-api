# Changelog

All notable changes to this project should be documented in this file.

This project follows the Keep a Changelog structure. No git tags were found in
the repository; the `1.0.0` label is taken from `package.json`.

## [1.0.1]

### Added

- Added maintainer-focused documentation files: `QUICKSTART.md`,
  `ARCHITECTURE.md`, `TROUBLESHOOTING.md`, `LICENSE.md`, and
  `CODE_OF_CONDUCT.md`.

### Changed

- Reworked `README.md` to document the observed current stack, commands,
  static API endpoints, generated data shape, CI workflow, and onboarding
  pitfalls.
- Reworked `SECURITY.md` to keep reporting paths grounded in visible GitHub
  repository links and observed deployer considerations.

### Deprecated

- No entries.

### Removed

- No entries.

### Fixed

- Clarified that the frontend has no observed environment-variable switch for
  local API data and currently fetches the production GitHub Pages base URL.
- Clarified the current generated-data drift between committed `v1/` BIOSOLAR
  product names and the current pipeline canonicalization map.

### Security

- Documented the static-site threat surface, pipeline trust boundary, GitHub
  Actions token permissions, and private vulnerability reporting path.

## [1.0.0] - 2026-06-05

### Added

- Added Python generator script, requirements, and initial README
  (`84a9bcc`, 2026-06-01).
- Added Pydantic schemas and unit tests (`580044f`, 2026-06-01).
- Added scheduled GitHub Actions sync workflow (`92404c1`, 2026-06-01).
- Added generated `v1/` snapshots (`c669877`, 2026-06-01).
- Added complete `nasional.json` national fuel-price payload
  (`a8dd723`, 2026-06-01).
- Added automated scheduled PR merging with GitHub CLI after test validation
  (`c5e83e0`, 2026-06-02).

### Changed

- Made schema validation stricter and improved price parsing for decimal
  formats (`23b3729`, 2026-06-01).
- Added fetch retry backoff and product canonical mapping (`cc8603a`,
  2026-06-01).
- Replaced direct workflow pushes with an automated pull request workflow
  (`8f15a79`, 2026-06-01).
- Extracted pipeline configuration and optimized Pydantic import scope
  (`e40f51c`, 2026-06-01).
- Simplified the API schema contract and reduced payload size by about 43.5%
  (`35874ed`, 2026-06-01).
- Decoupled tests from physical generated outputs with mock data and temporary
  paths (`8be8f6c`, 2026-06-01).
- Updated README and `.gitignore` for clarity and consistency (`71bc6db`,
  2026-06-01; `26785b6`, 2026-06-01).
- Repeatedly updated generated `v1/` snapshots through automated sync pull
  requests from 2026-06-02 through 2026-06-05.

### Deprecated

- No entries.

### Removed

- No entries.

### Fixed

- No dedicated bug-fix commits were identifiable beyond the parser, schema, CI,
  and documentation changes listed above.

### Security

- No dedicated security-fix commits or advisories were found.
