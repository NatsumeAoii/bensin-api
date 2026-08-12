#!/usr/bin/env python3
"""Fetch and normalize Pertamina price payload (local prototype).

This script reads `price.json` in the repository root, normalizes price fields,
and writes static JSON files under `v1/`:
 - v1/index.json
 - v1/nasional.json
 - v1/provinsi/{province_slug}.json

Designed as a local generator suitable to run in GitHub Actions.

Input shapes
------------
``price.json`` may take one of these shapes (all handled by ``extract_provinces``):
 1. ``{"data": [ ... ]}``
 2. ``{"data": {"data": [ ... ], "total": ...}}``  (the committed shape)
 3. ``[ ... ]``  (a bare list)
"""
from __future__ import annotations
import json
import os
import hashlib
import shutil
import sys
import tempfile
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

# Ensure repository root is in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import logging
import re
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

from pipeline.config import (
    ROOT,
    PRICE_FILE,
    RAW_DIR,
    UPSTREAM_URL,
    OUT_DIR,
    PROV_DIR,
    PRODUCT_CANONICAL_MAP,
)
from pipeline.schemas import ProvinceModel, IndexModel, NationalModel

FETCH_TIMEOUT_SECONDS = 15.0
FETCH_MAX_RETRIES = 3
FETCH_BACKOFF_FACTOR = 2.0


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = s.replace('prov.', '').replace('provinsi', '')
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9\s-]", '', s)
    s = re.sub(r"\s+", '-', s)
    s = re.sub(r"-+", '-', s)
    s = s.strip('-')
    return s or 'unknown'


def parse_price(raw: Any) -> Tuple[Optional[int], str]:
    # Returns (price_rupiah_or_none, availability)
    if raw is None:
        return None, 'unavailable'
    s = str(raw).strip()
    if s == '' or s.lower() in ('n/a', 'na', 'null'):
        return None, 'unavailable'
    
    # Accept only the formats emitted by the upstream source: an optional
    # currency prefix, digits, and one unambiguous decimal separator.
    s = re.sub(r'(?i)^\s*(rp|idr)\s*', '', s).strip()
    if s.startswith('-') or not re.fullmatch(r'\d[\d.,]*', s):
        return None, 'unknown'
    s = s.strip()
    
    if not any(c.isdigit() for c in s):
        return None, 'unknown'
        
    has_dot = '.' in s
    has_comma = ',' in s
    
    if has_dot and has_comma:
        dot_idx = s.rfind('.')
        comma_idx = s.rfind(',')
        if dot_idx > comma_idx:
            thousands_sep = ','
            decimal_sep = '.'
        else:
            thousands_sep = '.'
            decimal_sep = ','
    elif has_dot:
        parts = s.split('.')
        if len(parts) > 2:
            thousands_sep = '.'
            decimal_sep = None
        else:
            last_part = parts[-1]
            if len(last_part) == 3:
                thousands_sep = '.'
                decimal_sep = None
            else:
                thousands_sep = None
                decimal_sep = '.'
    elif has_comma:
        parts = s.split(',')
        if len(parts) > 2:
            thousands_sep = ','
            decimal_sep = None
        else:
            last_part = parts[-1]
            if len(last_part) == 3:
                thousands_sep = ','
                decimal_sep = None
            else:
                thousands_sep = None
                decimal_sep = ','
    else:
        thousands_sep = None
        decimal_sep = None

    if thousands_sep:
        s = s.replace(thousands_sep, '')
        
    if decimal_sep:
        parts = s.split(decimal_sep)
        integer_part = re.sub(r'[^0-9]', '', parts[0])
        decimal_part = re.sub(r'[^0-9]', '', parts[1])
        if not integer_part:
            integer_part = '0'
        try:
            val = int((Decimal(f"{integer_part}.{decimal_part}")
                       .quantize(Decimal('1'), rounding=ROUND_HALF_UP)))
        except (InvalidOperation, ValueError):
            return None, 'unknown'
    else:
        digits = re.sub(r'[^0-9]', '', s)
        if digits == '':
            return None, 'unknown'
        try:
            val = int(digits)
        except ValueError:
            return None, 'unknown'

    if val > 10_000_000:
        return None, 'unknown'
    if val == 0:
        return None, 'unavailable'
    if val < 0:
        return None, 'unknown'
    return val, 'available'


def ensure_dirs() -> None:
    os.makedirs(PROV_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)


def build_province_file(prov_obj: Dict[str, Any]) -> Dict[str, Any]:
    province_name = prov_obj.get('province')
    slug = slugify(province_name)
    products = []

    list_price = prov_obj.get('list_price', [])

    # Province-level timestamp: take the latest (max) updatedDate across all
    # products rather than the first one encountered, so the value does not
    # depend on upstream product ordering and is not lost when the first
    # product happens to omit a date.
    update_dates = [
        p.get('updatedDate') for p in list_price if p.get('updatedDate')
    ]
    pertamina_updated_at = max(update_dates) if update_dates else None

    for p in list_price:
        prod_name = p.get('product') or ''
        raw_price = p.get('price')
        updated = p.get('updatedDate')
        price_rupiah, availability = parse_price(raw_price)
        
        prod_clean = prod_name.strip().upper() if isinstance(prod_name, str) else None
        prod_canonical = PRODUCT_CANONICAL_MAP.get(prod_clean, prod_clean) if prod_clean else 'UNKNOWN'
        
        prod_item = {
            'product': prod_canonical,
            'price_rupiah': price_rupiah,
            'availability': availability,
        }
        
        if updated and updated != pertamina_updated_at:
            prod_item['pertamina_updated_at'] = updated
            
        products.append(prod_item)

    payload = {
        'province': province_name,
        'province_slug': slug,
        'pertamina_updated_at': pertamina_updated_at,
        'synced_at': iso_now(),
        'products': products,
    }
    return payload


def write_json(path: str, data: Any) -> None:
    try:
        # determine which model to use
        if path.endswith('index.json'):
            IndexModel.model_validate(data)
        elif path.endswith('nasional.json'):
            NationalModel.model_validate(data)
        elif '/provinsi/' in path.replace('\\', '/'):
            ProvinceModel.model_validate(data)
    except Exception as e:
        print('Validation error:', e)
        raise
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def extract_provinces(src: Any) -> List[Dict[str, Any]]:
    """Normalize the supported ``price.json`` shapes into a province list."""
    if isinstance(src, dict):
        data = src.get('data')
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get('data'), list):
            return data['data']
        return []
    if isinstance(src, list):
        return src
    return []


def is_valid_upstream_payload(raw_text: str, minimum_provinces: int = 1) -> bool:
    """Validate a fetched upstream payload before it overwrites ``price.json``.

    A hijacked or malformed upstream response should never clobber the trusted
    committed snapshot, so we require the payload to parse as JSON and to yield
    at least one province with a ``list_price`` array.
    """
    try:
        parsed = json.loads(raw_text)
    except (ValueError, TypeError):
        print('Upstream payload rejected: not valid JSON')
        return False
    provinces = extract_provinces(parsed)
    if len(provinces) < minimum_provinces:
        print('Upstream payload rejected: no provinces found')
        return False
    seen_slugs = set()
    for province in provinces:
        if not isinstance(province, dict):
            print('Upstream payload rejected: province is not an object')
            return False
        name = province.get('province')
        prices = province.get('list_price')
        if not isinstance(name, str) or not name.strip() or not isinstance(prices, list) or not prices:
            print('Upstream payload rejected: invalid province or list_price')
            return False
        slug = slugify(name)
        if slug in seen_slugs:
            print('Upstream payload rejected: duplicate province')
            return False
        seen_slugs.add(slug)
        products = set()
        for product in prices:
            if not isinstance(product, dict) or not isinstance(product.get('product'), str) or not product.get('product').strip():
                print('Upstream payload rejected: invalid product')
                return False
            canonical = PRODUCT_CANONICAL_MAP.get(product['product'].strip().upper(), product['product'].strip().upper())
            if canonical in products:
                print('Upstream payload rejected: duplicate product')
                return False
            products.add(canonical)
            parsed_price, _ = parse_price(product.get('price'))
            if product.get('price') not in (None, '', 'N/A', 'NA', 'null') and parsed_price is None:
                print('Upstream payload rejected: invalid price')
                return False
    return True


def fetch_upstream() -> Optional[str]:
    """Fetch the upstream payload with bounded retries and backoff.

    Returns the raw response text, or ``None`` if every attempt failed.
    """
    import httpx
    import time

    print('Fetching upstream:', UPSTREAM_URL)
    for attempt in range(1, FETCH_MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=FETCH_TIMEOUT_SECONDS) as client:
                resp = client.get(UPSTREAM_URL)
                resp.raise_for_status()
                return resp.text
        except Exception as exc:  # noqa: BLE001 - network boundary
            print(f"Attempt {attempt} failed: {exc}")
            if attempt == FETCH_MAX_RETRIES:
                return None
            sleep_time = FETCH_BACKOFF_FACTOR ** attempt
            print(f"Retrying in {sleep_time} seconds...")
            time.sleep(sleep_time)
    return None


def save_upstream_payload(raw_text: str) -> None:
    """Persist a validated upstream payload to ``raw/`` and ``price.json``."""
    ts = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    os.makedirs(RAW_DIR, exist_ok=True)
    raw_path = os.path.join(RAW_DIR, f'raw-{ts}.json')
    try:
        with open(raw_path, 'w', encoding='utf-8') as f:
            f.write(raw_text)
        with open(PRICE_FILE, 'w', encoding='utf-8') as f:
            f.write(raw_text)
        print('Saved raw payload to', raw_path)
    except OSError as oe:
        print('Failed writing raw file:', oe)


def load_source() -> Optional[Any]:
    """Read and parse the local ``price.json``. Returns None if missing."""
    if not os.path.exists(PRICE_FILE):
        print('price.json not found at', PRICE_FILE)
        return None
    with open(PRICE_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_outputs(provinces: List[Dict[str, Any]], output_root: Optional[str] = None,
                     source_status: str = 'fresh', source_snapshot_at: Optional[str] = None,
                     source_fetched_at: Optional[str] = None,
                     source_hash: Optional[str] = None) -> List[Dict[str, Any]]:
    """Normalize provinces and write index, national, and per-province files.

    Returns the list of per-province payloads (the national list).
    """
    index = {
        'api_name': 'Indonesia Fuel Price API',
        'version': 'v1',
        'author': 'Nasrullah Gunawan',
        'github_repository': 'https://github.com/nasgunawann/bensin-api',
        'synced_at': iso_now(),
        'generated_at': iso_now(),
        'source_status': source_status,
        'source_snapshot_at': source_snapshot_at,
        'source_fetched_at': source_fetched_at,
        'source_hash': source_hash,
        'pertamina_updated_at': None,
        'provinsi_count': 0,
        'provinsi': {},
        'endpoints': {
            'all_provinces': '/v1/nasional.json',
            'history_index': '/v1/history/index.json',
            'province_history': '/v1/history/provinsi/{slug}.json',
        }
    }

    nasional_list = []
    slug_counts: Dict[str, int] = {}
    for prov in provinces:
        if not isinstance(prov, dict):
            raise ValueError('upstream province entry is not an object')
        payload = build_province_file(prov)
        slug = payload['province_slug']
        if slug in slug_counts:
            slug_counts[slug] += 1
            new_slug = f'{slug}-{slug_counts[slug]}'
            logger.warning('Slug collision: %r already seen, renaming to %r', slug, new_slug)
            slug = new_slug
            payload['province_slug'] = slug
        else:
            slug_counts[slug] = 1
        payload.update({
            'generated_at': index['generated_at'],
            'source_status': source_status,
            'source_snapshot_at': source_snapshot_at,
            'source_fetched_at': source_fetched_at,
            'source_hash': source_hash,
        })
        prov_path = f'v1/provinsi/{slug}.json'
        out_path = os.path.join(output_root or ROOT, prov_path)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        write_json(out_path, payload)
        file_size = os.path.getsize(out_path)
        products_count = len(payload['products'])
        index['provinsi'][slug] = {
            'name': payload['province'],
            'slug': slug,
            'path': '/' + prov_path.replace('\\', '/'),
            'pertamina_updated_at': payload['pertamina_updated_at'],
            'synced_at': payload['synced_at'],
            'products_count': products_count,
            'file_size_bytes': file_size,
        }
        nasional_list.append(payload)
        if index['pertamina_updated_at'] is None and payload['pertamina_updated_at']:
            index['pertamina_updated_at'] = payload['pertamina_updated_at']

    index['provinsi_count'] = len(index['provinsi'])

    nasional_payload = {
        'version': 'v1',
        'synced_at': index['synced_at'],
        'pertamina_updated_at': index['pertamina_updated_at'],
        'provinces': nasional_list,
    }
    nasional_payload.update({key: index[key] for key in ('generated_at', 'source_status', 'source_snapshot_at', 'source_fetched_at', 'source_hash')})
    write_json(os.path.join(output_root or ROOT, 'v1', 'nasional.json'), nasional_payload)
    write_json(os.path.join(output_root or ROOT, 'v1', 'index.json'), index)

    print('Generated v1 files:')
    print(' - v1/index.json')
    print(' - v1/nasional.json')
    print(' - v1/provinsi/*.json')

    return nasional_list


def publish_outputs(provinces: List[Dict[str, Any]], source_status: str,
                    source_snapshot_at: Optional[str], source_fetched_at: Optional[str],
                    source_hash: Optional[str]) -> List[Dict[str, Any]]:
    """Generate and validate a complete tree, then replace the published tree."""
    with tempfile.TemporaryDirectory(prefix='bensin-api-stage-') as stage:
        staged_v1 = os.path.join(stage, 'v1')
        os.makedirs(staged_v1, exist_ok=True)
        existing_history = os.path.join(OUT_DIR, 'history')
        staged_history = os.path.join(staged_v1, 'history')
        if os.path.isdir(existing_history):
            shutil.copytree(existing_history, staged_history, ignore=lambda _path, names: [
                name for name in names
                if name.endswith('.json') and name.removesuffix('.json') not in {
                    slugify(province.get('province', ''))
                    for province in provinces if isinstance(province, dict)
                }
            ])
        nasional_list = generate_outputs(
            provinces,
            output_root=stage,
            source_status=source_status,
            source_snapshot_at=source_snapshot_at,
            source_fetched_at=source_fetched_at,
            source_hash=source_hash,
        )
        from pipeline.history import update_history
        update_history(nasional_list, output_dir=staged_v1)
        from pipeline.generated_tree_check import validate_generated_tree
        validate_generated_tree(staged_v1)

        backup = f'{OUT_DIR}.previous'
        if os.path.exists(backup):
            shutil.rmtree(backup)
        if os.path.exists(OUT_DIR):
            os.replace(OUT_DIR, backup)
        try:
            os.replace(staged_v1, OUT_DIR)
        except Exception:
            if os.path.exists(backup):
                os.replace(backup, OUT_DIR)
            raise
        finally:
            if os.path.exists(backup):
                shutil.rmtree(backup)
        return nasional_list


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch', action='store_true', help='Fetch upstream data before normalizing')
    args = parser.parse_args()

    # If requested, try to fetch upstream and overwrite local PRICE_FILE — but
    # only if the payload validates, so a bad upstream response can't clobber
    # the trusted committed snapshot.
    source_status = 'fallback'
    source_fetched_at = None
    if args.fetch:
        try:
            raw = fetch_upstream()
            if raw is None:
                source_status = 'fallback'
                print('Warning: upstream fetch failed, continuing with existing price.json')
            elif not is_valid_upstream_payload(raw):
                source_status = 'fallback'
                print('Warning: upstream payload invalid, continuing with existing price.json')
            else:
                save_upstream_payload(raw)
                source_fetched_at = iso_now()
        except Exception as e:  # noqa: BLE001 - never let fetch abort generation
            source_status = 'fallback'
            print('Warning: failed fetching upstream, will continue with existing price.json —', e)

    src = load_source()
    if src is None:
        return
    provinces = extract_provinces(src)
    source_snapshot_at = None
    source_hash = None
    try:
        source_snapshot_at = os.path.getmtime(PRICE_FILE)
        source_snapshot_at = datetime.fromtimestamp(source_snapshot_at, timezone.utc).isoformat().replace('+00:00', 'Z')
        with open(PRICE_FILE, 'rb') as source_file:
            source_hash = hashlib.sha256(source_file.read()).hexdigest()
    except OSError:
        pass
    publish_outputs(provinces, source_status, source_snapshot_at, source_fetched_at, source_hash)


if __name__ == '__main__':
    main()
