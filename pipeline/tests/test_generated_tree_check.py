import json
from pathlib import Path

import pytest

from pipeline.fetch_normalize import generate_outputs
from pipeline.generated_tree_check import validate_generated_tree
from pipeline.history import update_history


def _province(name='Prov. Aceh', slug='aceh'):
    return {
        'province': name,
        'list_price': [{'product': 'PERTALITE', 'price': '10000'}],
    }


def _build_tree(tmp_path: Path):
    generate_outputs([_province()], output_root=str(tmp_path), source_status='fallback', source_snapshot_at='2026-08-13T00:00:00Z', source_hash='abc')
    update_history([{
        'province': 'Prov. Aceh',
        'province_slug': 'aceh',
        'synced_at': '2026-08-13T00:00:00Z',
        'products': [{'product': 'PERTALITE', 'price_rupiah': 10000}],
    }], output_dir=str(tmp_path / 'v1'))
    return tmp_path / 'v1'


def test_generated_tree_accepts_fallback_metadata_and_matching_files(tmp_path):
    tree = _build_tree(tmp_path)
    validate_generated_tree(str(tree))
    index = json.loads((tree / 'index.json').read_text(encoding='utf-8'))
    assert index['source_status'] == 'fallback'
    assert index['source_hash'] == 'abc'


def test_generated_tree_rejects_missing_index_file(tmp_path):
    tree = _build_tree(tmp_path)
    (tree / 'provinsi' / 'aceh.json').unlink()
    with pytest.raises(ValueError, match='province files do not match'):
        validate_generated_tree(str(tree))


def test_generated_tree_rejects_file_size_mismatch(tmp_path):
    tree = _build_tree(tmp_path)
    index_path = tree / 'index.json'
    index = json.loads(index_path.read_text(encoding='utf-8'))
    index['provinsi']['aceh']['file_size_bytes'] += 1
    index_path.write_text(json.dumps(index), encoding='utf-8')
    with pytest.raises(ValueError, match='file size mismatch'):
        validate_generated_tree(str(tree))
