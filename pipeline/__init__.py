"""Bensin-API data pipeline.

Reads a MyPertamina price snapshot (``price.json`` at the repo root), normalizes
prices and province slugs, validates the result with Pydantic, and writes the
static JSON API under ``v1/`` plus append-only price history under
``v1/history/``.

Supported ``price.json`` input shapes (see ``fetch_normalize.extract_provinces``):

- ``{"data": [ ... ]}``
- ``{"data": {"data": [ ... ], "total": ...}}``  — the committed shape
- ``[ ... ]``  — a bare province list

Each province entry is expected to carry a ``province`` name and a
``list_price`` array of ``{"product", "price", "updatedDate"}`` objects.

Modules
-------
- ``config``         — paths, upstream URL, and product canonicalization map.
- ``fetch_normalize``— fetch/parse/normalize/write orchestration and ``main()``.
- ``schemas``        — Pydantic models gating every file write.
- ``history``        — change-based per-province price history accumulation.
- ``sanity_check``   — post-generation data sanity gate (shared with CI).
"""
