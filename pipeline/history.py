#!/usr/bin/env python3
"""Price history accumulation (change-based / event storage).

This module maintains an append-only price history under ``v1/history/``:
 - v1/history/provinsi/{province_slug}.json  — per-province change events
 - v1/history/index.json                     — list of available history files

It is intentionally isolated from the main ``v1/`` generation. A failure here
must never corrupt or block the primary snapshot output, so the public entry
point ``update_history`` swallows and reports errors rather than raising.

Storage model
-------------
For each product we store one point *only when the price changes* from the last
recorded value. Pertamina prices are step functions that hold flat for weeks,
so this keeps payloads tiny and the chart meaningful (one point per revision).

A point is ``{"date": "YYYY-MM-DD", "price_rupiah": <int>}``. Products that are
unavailable (price ``None``) are not recorded — only concrete prices form the
series, and the next concrete price after a gap is appended as a new change.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from pipeline.config import OUT_DIR
from pipeline.fetch_normalize import iso_now
from pipeline.schemas import HistoryModel

HISTORY_DIR = os.path.join(OUT_DIR, 'history')
HISTORY_PROV_DIR = os.path.join(HISTORY_DIR, 'provinsi')


def derive_date(synced_at: str) -> str:
    """Derive a ``YYYY-MM-DD`` date key from an ISO 8601 sync timestamp.

    The history is keyed by calendar day: at most one change point per product
    per day, which matches how often real prices can meaningfully differ and
    avoids multiple points from the 6h sync cadence collapsing onto one day.
    Falls back to the raw string's first 10 chars if it is already a date.
    """
    if not synced_at:
        raise ValueError('synced_at is required to derive a history date')
    # ISO 8601 always starts with YYYY-MM-DD; slice is robust to the suffix.
    return synced_at[:10]


def load_history(path: str) -> Optional[Dict[str, Any]]:
    """Load and validate an existing per-province history file.

    Returns the validated dict, or ``None`` when the file does not exist yet
    (first run for this province). Raises on a corrupt/invalid existing file so
    the caller can decide how to handle it rather than silently overwriting.
    """
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Validate the on-disk contract before we trust and extend it.
    HistoryModel.model_validate(data)
    return data


def merge_history(
    existing: Optional[Dict[str, Any]],
    province: str,
    province_slug: str,
    products: List[Dict[str, Any]],
    date: str,
) -> Dict[str, Any]:
    """Merge today's prices into prior history, appending only real changes.

    Pure function (no I/O) so the accumulation rules are unit-testable.

    Rules:
      - A product's point is appended only if its price differs from the last
        recorded point for that product.
      - Products with ``price_rupiah`` of ``None`` (unavailable) are skipped.
      - If a point already exists for ``date`` it is not duplicated; an
        existing same-day point is updated to the latest non-null price so the
        most recent sync of the day wins.
      - Unknown/legacy products already in history are preserved untouched.
    """
    result_products: Dict[str, List[Dict[str, Any]]] = {}

    # Start from a deep-ish copy of existing series so we never mutate input.
    if existing is not None:
        for name, points in existing.get('products', {}).items():
            result_products[name] = [dict(p) for p in points]

    for product in products:
        name = product.get('product')
        price = product.get('price_rupiah')
        if not name or price is None:
            continue

        series = result_products.setdefault(name, [])

        if series and series[-1].get('date') == date:
            # Same calendar day already recorded — keep one point, latest price.
            series[-1]['price_rupiah'] = price
            continue

        last_price = series[-1]['price_rupiah'] if series else None
        if last_price == price:
            # No change since last recorded value — nothing to append.
            continue

        series.append({'date': date, 'price_rupiah': price})

    return {
        'province': province,
        'province_slug': province_slug,
        'products': result_products,
    }


def write_history(path: str, data: Dict[str, Any]) -> None:
    """Validate against HistoryModel then write the history file as UTF-8 JSON.

    Note: this deliberately does NOT reuse ``fetch_normalize.write_json`` —
    that function routes any path containing ``/provinsi/`` through
    ``ProvinceModel`` validation, which would reject history files living at
    ``v1/history/provinsi/<slug>.json``. History owns its own validation gate.
    """
    HistoryModel.model_validate(data)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def update_history(province_payloads: List[Dict[str, Any]]) -> int:
    """Append change-based history for each province. Fault-isolated.

    Accepts the same per-province payloads produced by the main pipeline
    (each with ``province``, ``province_slug``, ``synced_at``, ``products``).
    Returns the number of province history files written. Never raises: any
    failure is reported and counted as a skip so the primary ``v1/`` output is
    unaffected.
    """
    os.makedirs(HISTORY_PROV_DIR, exist_ok=True)
    written = 0
    index_entries: List[Dict[str, Any]] = []

    for payload in province_payloads:
        slug = payload.get('province_slug')
        province = payload.get('province')
        synced_at = payload.get('synced_at')
        if not slug or not province or not synced_at:
            print('History: skipping payload with missing fields:', slug)
            continue

        prov_path = os.path.join(HISTORY_PROV_DIR, f'{slug}.json')
        try:
            date = derive_date(synced_at)
            existing = load_history(prov_path)
            merged = merge_history(
                existing, province, slug, payload.get('products', []), date
            )
            write_history(prov_path, merged)
            written += 1
            point_count = sum(len(v) for v in merged['products'].values())
            index_entries.append({
                'slug': slug,
                'name': province,
                'path': f'/v1/history/provinsi/{slug}.json',
                'point_count': point_count,
            })
        except Exception as exc:  # noqa: BLE001 - boundary: isolate per-province
            print(f'History: failed to update {slug}:', exc)
            continue

    # Best-effort history index; failure here is non-critical.
    try:
        index_entries.sort(key=lambda e: e['slug'])
        index_path = os.path.join(HISTORY_DIR, 'index.json')
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(
                {'count': len(index_entries), 'synced_at': iso_now(), 'provinsi': index_entries},
                f, ensure_ascii=False, indent=2,
            )
    except Exception as exc:  # noqa: BLE001
        print('History: failed to write history index:', exc)

    return written
