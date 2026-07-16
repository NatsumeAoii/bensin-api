"""Tests for history index synced_at field and ISO 8601 validity."""
import json
import os
import tempfile
from datetime import datetime, timezone

import pytest

from pipeline.history import update_history


def _payload(slug, name, synced_at, *pairs):
    products = [{'product': n, 'price_rupiah': p} for n, p in pairs]
    return {
        'province': name, 'province_slug': slug, 'synced_at': synced_at,
        'products': products,
    }


def test_history_index_has_synced_at(monkeypatch):
    import pipeline.history as hist
    with tempfile.TemporaryDirectory() as tmp:
        prov_dir = os.path.join(tmp, 'provinsi')
        monkeypatch.setattr(hist, 'HISTORY_DIR', tmp)
        monkeypatch.setattr(hist, 'HISTORY_PROV_DIR', prov_dir)

        update_history([_payload('aceh', 'Prov. Aceh', '2026-06-01T10:00:00Z',
                                 ('PERTAMAX', 12600))])

        with open(os.path.join(tmp, 'index.json'), encoding='utf-8') as f:
            idx = json.load(f)
        assert 'synced_at' in idx


def test_history_index_synced_at_is_iso8601(monkeypatch):
    import pipeline.history as hist
    with tempfile.TemporaryDirectory() as tmp:
        prov_dir = os.path.join(tmp, 'provinsi')
        monkeypatch.setattr(hist, 'HISTORY_DIR', tmp)
        monkeypatch.setattr(hist, 'HISTORY_PROV_DIR', prov_dir)

        update_history([_payload('aceh', 'Prov. Aceh', '2026-06-01T10:00:00Z',
                                 ('PERTAMAX', 12600))])

        with open(os.path.join(tmp, 'index.json'), encoding='utf-8') as f:
            idx = json.load(f)
        synced_at = idx['synced_at']
        # Must parse as valid ISO 8601
        dt = datetime.fromisoformat(synced_at.replace('Z', '+00:00'))
        assert dt.tzinfo is not None
