import json
import os
import tempfile

import pytest
from pydantic import ValidationError

from pipeline.history import (
    derive_date,
    merge_history,
    load_history,
    write_history,
    update_history,
)


# ---------------------------------------------------------------------------
# derive_date
# ---------------------------------------------------------------------------

def test_derive_date_extracts_calendar_day():
    assert derive_date('2026-06-07T10:09:24.202070Z') == '2026-06-07'


def test_derive_date_rejects_empty():
    with pytest.raises(ValueError):
        derive_date('')


# ---------------------------------------------------------------------------
# merge_history — change-based accumulation rules
# ---------------------------------------------------------------------------

def _products(*pairs):
    return [{'product': name, 'price_rupiah': price} for name, price in pairs]


def test_first_run_appends_initial_points():
    merged = merge_history(None, 'Prov. Aceh', 'aceh',
                           _products(('PERTAMAX', 12600)), '2026-06-01')
    assert merged['products']['PERTAMAX'] == [
        {'date': '2026-06-01', 'price_rupiah': 12600}
    ]


def test_unchanged_price_is_not_appended():
    existing = {
        'province': 'Prov. Aceh', 'province_slug': 'aceh',
        'products': {'PERTAMAX': [{'date': '2026-06-01', 'price_rupiah': 12600}]},
    }
    merged = merge_history(existing, 'Prov. Aceh', 'aceh',
                           _products(('PERTAMAX', 12600)), '2026-06-05')
    # Same price on a later day → no new point
    assert merged['products']['PERTAMAX'] == [
        {'date': '2026-06-01', 'price_rupiah': 12600}
    ]


def test_changed_price_appends_new_point():
    existing = {
        'province': 'Prov. Aceh', 'province_slug': 'aceh',
        'products': {'PERTAMAX': [{'date': '2026-06-01', 'price_rupiah': 12600}]},
    }
    merged = merge_history(existing, 'Prov. Aceh', 'aceh',
                           _products(('PERTAMAX', 13000)), '2026-07-01')
    assert merged['products']['PERTAMAX'] == [
        {'date': '2026-06-01', 'price_rupiah': 12600},
        {'date': '2026-07-01', 'price_rupiah': 13000},
    ]


def test_same_day_resync_updates_latest_price_without_duplicating():
    existing = {
        'province': 'Prov. Aceh', 'province_slug': 'aceh',
        'products': {'PERTAMAX': [{'date': '2026-06-01', 'price_rupiah': 12600}]},
    }
    # Second sync on the same day with a corrected price
    merged = merge_history(existing, 'Prov. Aceh', 'aceh',
                           _products(('PERTAMAX', 12650)), '2026-06-01')
    assert merged['products']['PERTAMAX'] == [
        {'date': '2026-06-01', 'price_rupiah': 12650}
    ]


def test_unavailable_price_is_skipped():
    merged = merge_history(None, 'Prov. Aceh', 'aceh',
                           [{'product': 'PERTAMAX', 'price_rupiah': None}],
                           '2026-06-01')
    assert 'PERTAMAX' not in merged['products']


def test_does_not_mutate_existing_input():
    existing = {
        'province': 'Prov. Aceh', 'province_slug': 'aceh',
        'products': {'PERTAMAX': [{'date': '2026-06-01', 'price_rupiah': 12600}]},
    }
    merge_history(existing, 'Prov. Aceh', 'aceh',
                  _products(('PERTAMAX', 13000)), '2026-07-01')
    # Original untouched
    assert existing['products']['PERTAMAX'] == [
        {'date': '2026-06-01', 'price_rupiah': 12600}
    ]


def test_multiple_products_tracked_independently():
    merged = merge_history(None, 'Prov. Aceh', 'aceh',
                           _products(('PERTAMAX', 12600), ('PERTALITE', 10000)),
                           '2026-06-01')
    assert set(merged['products'].keys()) == {'PERTAMAX', 'PERTALITE'}


# ---------------------------------------------------------------------------
# load_history / write_history round-trip + validation gate
# ---------------------------------------------------------------------------

def test_load_history_returns_none_for_missing_file():
    with tempfile.TemporaryDirectory() as tmp:
        assert load_history(os.path.join(tmp, 'nope.json')) is None


def test_write_then_load_roundtrip():
    data = {
        'province': 'Prov. Aceh', 'province_slug': 'aceh',
        'products': {'PERTAMAX': [{'date': '2026-06-01', 'price_rupiah': 12600}]},
    }
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'aceh.json')
        write_history(path, data)
        loaded = load_history(path)
        assert loaded == data


def test_write_history_rejects_invalid_payload():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'aceh.json')
        with pytest.raises(ValidationError):
            write_history(path, {'province': '', 'province_slug': 'aceh', 'products': {}})
        assert not os.path.exists(path)


def test_load_history_raises_on_corrupt_file():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'aceh.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump({'province': 'X'}, f)  # missing required fields
        with pytest.raises(ValidationError):
            load_history(path)


# ---------------------------------------------------------------------------
# update_history — fault isolation + end-to-end accumulation across runs
# ---------------------------------------------------------------------------

def _payload(slug, name, synced_at, *pairs):
    return {
        'province': name, 'province_slug': slug, 'synced_at': synced_at,
        'products': _products(*pairs),
    }


def test_update_history_accumulates_across_runs(monkeypatch):
    import pipeline.history as hist
    with tempfile.TemporaryDirectory() as tmp:
        prov_dir = os.path.join(tmp, 'provinsi')
        monkeypatch.setattr(hist, 'HISTORY_DIR', tmp)
        monkeypatch.setattr(hist, 'HISTORY_PROV_DIR', prov_dir)

        # Run 1
        n = update_history([_payload('aceh', 'Prov. Aceh', '2026-06-01T10:00:00Z',
                                     ('PERTAMAX', 12600))])
        assert n == 1

        # Run 2: same price, later day → no new point
        update_history([_payload('aceh', 'Prov. Aceh', '2026-06-05T10:00:00Z',
                                 ('PERTAMAX', 12600))])

        # Run 3: price change → new point
        update_history([_payload('aceh', 'Prov. Aceh', '2026-07-01T10:00:00Z',
                                 ('PERTAMAX', 13000))])

        loaded = load_history(os.path.join(prov_dir, 'aceh.json'))
        assert loaded['products']['PERTAMAX'] == [
            {'date': '2026-06-01', 'price_rupiah': 12600},
            {'date': '2026-07-01', 'price_rupiah': 13000},
        ]


def test_update_history_writes_index(monkeypatch):
    import pipeline.history as hist
    with tempfile.TemporaryDirectory() as tmp:
        monkeypatch.setattr(hist, 'HISTORY_DIR', tmp)
        monkeypatch.setattr(hist, 'HISTORY_PROV_DIR', os.path.join(tmp, 'provinsi'))

        update_history([_payload('aceh', 'Prov. Aceh', '2026-06-01T10:00:00Z',
                                 ('PERTAMAX', 12600))])

        with open(os.path.join(tmp, 'index.json'), encoding='utf-8') as f:
            idx = json.load(f)
        assert idx['count'] == 1
        assert idx['provinsi'][0]['slug'] == 'aceh'
        assert idx['provinsi'][0]['point_count'] == 1


def test_update_history_skips_bad_payload_without_raising(monkeypatch):
    import pipeline.history as hist
    with tempfile.TemporaryDirectory() as tmp:
        monkeypatch.setattr(hist, 'HISTORY_DIR', tmp)
        monkeypatch.setattr(hist, 'HISTORY_PROV_DIR', os.path.join(tmp, 'provinsi'))

        # One good, one missing synced_at → good one still written, no raise
        n = update_history([
            _payload('aceh', 'Prov. Aceh', '2026-06-01T10:00:00Z', ('PERTAMAX', 12600)),
            {'province': 'Bad', 'province_slug': 'bad', 'products': _products(('X', 1))},
        ])
        assert n == 1
