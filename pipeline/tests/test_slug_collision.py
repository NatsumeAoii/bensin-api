"""Tests for slug deduplication in generate_outputs.

Two mock provinces with identical names must produce different slugs.
Three identical names must produce slug, slug-2, slug-3.
"""
import json
import os
import tempfile

import pytest

from pipeline.fetch_normalize import generate_outputs


def _prov(name, products=None):
    if products is None:
        products = [{'product': 'PERTAMAX', 'price': '12600', 'updatedDate': '2026-06-01'}]
    return {
        'province': name,
        'list_price': [
            {'product': p['product'], 'price': p.get('price'), 'updatedDate': p.get('updatedDate')}
            for p in products
        ],
    }


def test_two_identical_names_get_different_slugs(monkeypatch):
    from pipeline.fetch_normalize import ROOT, PROV_DIR
    import pipeline.fetch_normalize as fn
    import pipeline.config

    with tempfile.TemporaryDirectory() as tmp:
        prov_dir = os.path.join(tmp, 'v1', 'provinsi')
        monkeypatch.setattr(fn, 'ROOT', tmp)
        monkeypatch.setattr(fn, 'PROV_DIR', prov_dir)
        monkeypatch.setattr(pipeline.config, 'ROOT', tmp)
        monkeypatch.setattr(pipeline.config, 'PROV_DIR', prov_dir)

        provinces = [_prov('Prov. Aceh'), _prov('Prov. Aceh')]
        result = generate_outputs(provinces)

        slugs = [p['province_slug'] for p in result]
        assert slugs[0] == 'aceh'
        assert slugs[1] == 'aceh-2'
        assert slugs[0] != slugs[1]


def test_three_identical_names_get_slug_slug2_slug3(monkeypatch):
    from pipeline.fetch_normalize import ROOT, PROV_DIR
    import pipeline.fetch_normalize as fn
    import pipeline.config

    with tempfile.TemporaryDirectory() as tmp:
        prov_dir = os.path.join(tmp, 'v1', 'provinsi')
        monkeypatch.setattr(fn, 'ROOT', tmp)
        monkeypatch.setattr(fn, 'PROV_DIR', prov_dir)
        monkeypatch.setattr(pipeline.config, 'ROOT', tmp)
        monkeypatch.setattr(pipeline.config, 'PROV_DIR', prov_dir)

        provinces = [_prov('Prov. Aceh'), _prov('Prov. Aceh'), _prov('Prov. Aceh')]
        result = generate_outputs(provinces)

        slugs = [p['province_slug'] for p in result]
        assert slugs[0] == 'aceh'
        assert slugs[1] == 'aceh-2'
        assert slugs[2] == 'aceh-3'
