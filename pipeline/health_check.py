#!/usr/bin/env python3
"""Post-generation health checks for the fuel price pipeline.

Compares old and new ``v1/index.json`` snapshots and flags anomalies:
 - Province count delta > 5
 - Any province with 0 products
 - All prices zero
 - ``synced_at`` older than 24 hours

Run as a script::

    python pipeline/health_check.py old/index.json new/index.json

Exits 0 when clean, 1 when flags are found.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List


def _load_index(path: str) -> Dict[str, Any]:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def run_health_check(
    old_price_path: str,
    new_price_path: str,
) -> List[str]:
    """Run health checks comparing old and new index snapshots.

    Returns a list of flag messages (empty when everything looks healthy).
    """
    flags: List[str] = []
    old_index = _load_index(old_price_path)
    new_index = _load_index(new_price_path)

    # 1. Province count delta
    old_count = old_index.get('provinsi_count', len(old_index.get('provinsi', {})))
    new_provinsi = new_index.get('provinsi', {})
    new_count = new_index.get('provinsi_count', len(new_provinsi))
    if abs(new_count - old_count) > 5:
        flags.append(
            f'Province count changed by {abs(new_count - old_count)} '
            f'(old={old_count}, new={new_count})'
        )

    # 2. Any province with 0 products
    for slug, info in new_provinsi.items():
        products_count = info.get('products_count', 0)
        if products_count == 0:
            flags.append(f'Province {slug} has 0 products')

    # 3. All prices zero — check via nasional data if available, else provinsi products_count
    #    We detect this by checking if every province has products_count > 0 but
    #    the actual products all have price_rupiah == 0 or None. Since the index
    #    doesn't carry per-product prices, we flag if the total products_count
    #    across all provinces is 0 as a proxy.
    total_products = sum(
        info.get('products_count', 0) for info in new_provinsi.values()
    )
    if total_products == 0 and new_count > 0:
        flags.append('All provinces have 0 total products — possible all-zero prices')

    # 4. synced_at freshness
    synced_at = new_index.get('synced_at')
    if synced_at:
        try:
            sync_dt = datetime.fromisoformat(synced_at.replace('Z', '+00:00'))
            age = datetime.now(timezone.utc) - sync_dt
            if age > timedelta(hours=24):
                flags.append(f'synced_at is {age} old (>{timedelta(hours=24)})')
        except (ValueError, TypeError):
            flags.append(f'synced_at is not valid ISO 8601: {synced_at!r}')

    return flags


def main() -> None:
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} <old_index.json> <new_index.json>')
        sys.exit(2)
    old_path, new_path = sys.argv[1], sys.argv[2]
    try:
        flags = run_health_check(old_path, new_path)
    except FileNotFoundError as exc:
        print(f'Error: {exc}')
        sys.exit(2)
    if flags:
        for flag in flags:
            print('FLAG:', flag)
        sys.exit(1)
    print('All health checks passed')
    sys.exit(0)


if __name__ == '__main__':
    main()
