#!/usr/bin/env python3
"""Data sanity checks for generated ``v1/`` output.

This is the single source of truth for the post-generation sanity gate. Both
the unit tests and the CI workflow import from here so the validated logic and
the deployed logic can never drift apart.

Run as a script (``python pipeline/sanity_check.py``) to validate the on-disk
``v1/`` snapshots; exits non-zero with a diagnostic on the first failure.
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, List

from pipeline.config import OUT_DIR

MIN_PROVINCE_COUNT = 30
MIN_NON_NULL_RATIO = 0.5
MIN_NASIONAL_BYTES = 10 * 1024  # 10 KB
MAX_NASIONAL_BYTES = 10 * 1024 * 1024  # 10 MB


def check_price_non_null_ratio(products: List[Dict[str, Any]]) -> bool:
    """Return True iff non-null ``price_rupiah`` count / total >= 0.5.

    Returns False when there are no products (an empty set cannot satisfy the
    freshness expectation).
    """
    total = len(products)
    if total == 0:
        return False
    non_null = sum(1 for p in products if p.get("price_rupiah") is not None)
    return (non_null / total) >= MIN_NON_NULL_RATIO


def check_province_count(index: Dict[str, Any]) -> bool:
    """Return True iff the index lists at least MIN_PROVINCE_COUNT provinces."""
    return len(index.get("provinsi", {})) >= MIN_PROVINCE_COUNT


def check_nasional_size(size_bytes: int) -> bool:
    """Return True iff the national payload size is within the sane range."""
    return MIN_NASIONAL_BYTES <= size_bytes <= MAX_NASIONAL_BYTES


def run(out_dir: str = OUT_DIR) -> List[str]:
    """Run all sanity checks against an output directory.

    Returns a list of human-readable failure messages (empty when all pass).
    """
    failures: List[str] = []

    index_path = os.path.join(out_dir, "index.json")
    with open(index_path, "r", encoding="utf-8") as f:
        index = json.load(f)
    if not check_province_count(index):
        failures.append(
            f"index.json has fewer than {MIN_PROVINCE_COUNT} province entries"
        )

    all_products: List[Dict[str, Any]] = []
    prov_dir = os.path.join(out_dir, "provinsi")
    for fname in os.listdir(prov_dir):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(prov_dir, fname), "r", encoding="utf-8") as f:
            prov = json.load(f)
        all_products.extend(prov.get("products", []))
    if not check_price_non_null_ratio(all_products):
        non_null = sum(
            1 for p in all_products if p.get("price_rupiah") is not None
        )
        failures.append(
            f"only {non_null}/{len(all_products)} prices are non-null "
            f"(need >={MIN_NON_NULL_RATIO:.0%})"
        )

    size = os.path.getsize(os.path.join(out_dir, "nasional.json"))
    if not check_nasional_size(size):
        failures.append(
            f"nasional.json size {size} bytes outside "
            f"{MIN_NASIONAL_BYTES}-{MAX_NASIONAL_BYTES} byte range"
        )

    return failures


def main() -> int:
    failures = run()
    if failures:
        for failure in failures:
            print("FAIL:", failure)
        return 1
    print("All sanity checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
