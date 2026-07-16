"""Tests for pipeline.health_check.run_health_check."""
import json
import os
import tempfile
from datetime import datetime, timezone, timedelta

import pytest

from pipeline.health_check import run_health_check


def _write_index(path, provinsi_count=None, provinsi=None, synced_at=None):
    if provinsi is None:
        provinsi = {
            'aceh': {'slug': 'aceh', 'name': 'Prov. Aceh', 'path': '/v1/provinsi/aceh.json', 'products_count': 4},
            'bali': {'slug': 'bali', 'name': 'Prov. Bali', 'path': '/v1/provinsi/bali.json', 'products_count': 3},
        }
    if provinsi_count is None:
        provinsi_count = len(provinsi)
    if synced_at is None:
        synced_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    data = {
        'api_name': 'Indonesia Fuel Price API',
        'version': 'v1',
        'author': 'Test',
        'github_repository': 'https://example.com',
        'synced_at': synced_at,
        'provinsi_count': provinsi_count,
        'provinsi': provinsi,
        'endpoints': {},
    }
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f)


def test_normal_payload_no_flags(tmp_path):
    old = str(tmp_path / 'old' / 'index.json')
    new = str(tmp_path / 'new' / 'index.json')
    _write_index(old)
    _write_index(new)
    assert run_health_check(old, new) == []


def test_province_count_delta_flags(tmp_path):
    old = str(tmp_path / 'old' / 'index.json')
    new = str(tmp_path / 'new' / 'index.json')
    _write_index(old)
    big_provinsi = {f'p{i}': {'slug': f'p{i}', 'name': f'P{i}', 'path': f'/v1/provinsi/p{i}.json', 'products_count': 1} for i in range(20)}
    _write_index(new, provinsi=big_provinsi)
    flags = run_health_check(old, new)
    assert any('Province count changed' in f for f in flags)


def test_zero_products_flags(tmp_path):
    old = str(tmp_path / 'old' / 'index.json')
    new = str(tmp_path / 'new' / 'index.json')
    _write_index(old)
    provinsi = {
        'aceh': {'slug': 'aceh', 'name': 'Prov. Aceh', 'path': '/v1/provinsi/aceh.json', 'products_count': 0},
    }
    _write_index(new, provinsi=provinsi)
    flags = run_health_check(old, new)
    assert any('0 products' in f for f in flags)


def test_stale_synced_at_flags(tmp_path):
    old = str(tmp_path / 'old' / 'index.json')
    new = str(tmp_path / 'new' / 'index.json')
    _write_index(old)
    stale = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat().replace('+00:00', 'Z')
    _write_index(new, synced_at=stale)
    flags = run_health_check(old, new)
    assert any('synced_at' in f for f in flags)
