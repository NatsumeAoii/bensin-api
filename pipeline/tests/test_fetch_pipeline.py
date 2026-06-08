"""Tests for the fetch/normalize orchestration that lacked coverage.

Covers:
 - Province-level timestamp derivation (max updatedDate, order-independent).
 - Upstream payload validation gate before overwriting price.json.
 - fetch_upstream retry/backoff behavior with a mocked httpx client.
"""
import json
import sys
import types

import pytest

from pipeline.fetch_normalize import (
    build_province_file,
    extract_provinces,
    is_valid_upstream_payload,
    fetch_upstream,
)


# ---------------------------------------------------------------------------
# build_province_file — province-level timestamp (#10)
# ---------------------------------------------------------------------------

def test_province_timestamp_is_latest_regardless_of_order():
    prov = {
        'province': 'Prov. Aceh',
        'list_price': [
            {'product': 'PERTAMAX', 'price': '12600', 'updatedDate': '2026-06-01'},
            {'product': 'PERTALITE', 'price': '10000', 'updatedDate': '2026-07-15'},
            {'product': 'BIOSOLAR', 'price': '6800', 'updatedDate': '2026-05-20'},
        ],
    }
    payload = build_province_file(prov)
    # The newest date wins, not the first encountered.
    assert payload['pertamina_updated_at'] == '2026-07-15'


def test_province_timestamp_not_lost_when_first_product_has_no_date():
    prov = {
        'province': 'Prov. Aceh',
        'list_price': [
            {'product': 'PERTAMAX', 'price': '12600'},  # no updatedDate
            {'product': 'PERTALITE', 'price': '10000', 'updatedDate': '2026-06-10'},
        ],
    }
    payload = build_province_file(prov)
    assert payload['pertamina_updated_at'] == '2026-06-10'


def test_province_timestamp_none_when_no_dates():
    prov = {
        'province': 'Prov. Aceh',
        'list_price': [{'product': 'PERTAMAX', 'price': '12600'}],
    }
    payload = build_province_file(prov)
    assert payload['pertamina_updated_at'] is None


# ---------------------------------------------------------------------------
# extract_provinces — supported input shapes
# ---------------------------------------------------------------------------

def test_extract_provinces_flat_data_list():
    assert extract_provinces({'data': [{'province': 'X'}]}) == [{'province': 'X'}]


def test_extract_provinces_nested_data():
    src = {'data': {'data': [{'province': 'X'}], 'total': 1}}
    assert extract_provinces(src) == [{'province': 'X'}]


def test_extract_provinces_bare_list():
    assert extract_provinces([{'province': 'X'}]) == [{'province': 'X'}]


def test_extract_provinces_unknown_shape():
    assert extract_provinces(42) == []
    assert extract_provinces({'nope': True}) == []


# ---------------------------------------------------------------------------
# is_valid_upstream_payload — validation gate (#22)
# ---------------------------------------------------------------------------

def test_valid_upstream_payload_accepted():
    raw = json.dumps({'data': {'data': [
        {'province': 'Prov. Aceh', 'list_price': [{'product': 'PERTAMAX', 'price': '12600'}]}
    ]}})
    assert is_valid_upstream_payload(raw) is True


def test_invalid_json_rejected():
    assert is_valid_upstream_payload('not json {') is False


def test_empty_provinces_rejected():
    assert is_valid_upstream_payload(json.dumps({'data': []})) is False


def test_provinces_without_list_price_rejected():
    raw = json.dumps({'data': [{'province': 'Prov. Aceh'}]})
    assert is_valid_upstream_payload(raw) is False


# ---------------------------------------------------------------------------
# fetch_upstream — retry/backoff (#61)
# ---------------------------------------------------------------------------

class _FakeResponse:
    def __init__(self, text, raise_exc=None):
        self.text = text
        self._raise_exc = raise_exc

    def raise_for_status(self):
        if self._raise_exc:
            raise self._raise_exc


class _FakeClient:
    """Context-manager httpx.Client stand-in driven by a shared behavior list.

    fetch_upstream opens a fresh client per attempt, so the scripted behaviors
    are consumed from a shared mutable list rather than per-instance state.
    """

    def __init__(self, behaviors):
        self._behaviors = behaviors

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def get(self, url):
        behavior = self._behaviors.pop(0)
        if isinstance(behavior, Exception):
            raise behavior
        return behavior


def _install_fake_httpx(monkeypatch, behaviors):
    created = {}

    def client_factory(timeout):
        created['timeout'] = timeout
        # Same behaviors list across every per-attempt client instance.
        return _FakeClient(behaviors)

    fake_httpx = types.ModuleType('httpx')
    fake_httpx.Client = client_factory
    monkeypatch.setitem(sys.modules, 'httpx', fake_httpx)
    # Avoid real sleeping between retries.
    monkeypatch.setattr('time.sleep', lambda *_: None)
    return created


def test_fetch_upstream_succeeds_first_try(monkeypatch):
    created = _install_fake_httpx(monkeypatch, [_FakeResponse('{"ok": true}')])
    result = fetch_upstream()
    assert result == '{"ok": true}'
    assert created['timeout'] == 15.0


def test_fetch_upstream_retries_then_succeeds(monkeypatch):
    behaviors = [RuntimeError('boom'), _FakeResponse('{"ok": true}')]
    _install_fake_httpx(monkeypatch, behaviors)
    result = fetch_upstream()
    assert result == '{"ok": true}'


def test_fetch_upstream_returns_none_after_exhausting_retries(monkeypatch):
    behaviors = [RuntimeError('boom')] * 3
    _install_fake_httpx(monkeypatch, behaviors)
    result = fetch_upstream()
    assert result is None
