"""Integration test for the pipeline main() function.

Exercises the full end-to-end data flow: reading price.json, normalizing,
validating via Pydantic schemas, and writing output files to a temporary
directory — all without network access.

Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
"""
import json
import os
import shutil
import sys

import pytest

from pipeline.schemas import IndexModel, ProvinceModel


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FIXTURE_PRICE_JSON = os.path.join(REPO_ROOT, 'price.json')


def test_main_produces_valid_output(tmp_path, monkeypatch):
    """Integration test: main() with real price.json produces valid v1/ output."""
    # Set up temp directory structure
    price_file = tmp_path / 'price.json'
    shutil.copy(FIXTURE_PRICE_JSON, str(price_file))

    out_dir = tmp_path / 'v1'
    prov_dir = out_dir / 'provinsi'

    # Monkeypatch pipeline.config module-level constants
    import pipeline.config
    monkeypatch.setattr(pipeline.config, 'ROOT', str(tmp_path))
    monkeypatch.setattr(pipeline.config, 'PRICE_FILE', str(price_file))
    monkeypatch.setattr(pipeline.config, 'OUT_DIR', str(out_dir))
    monkeypatch.setattr(pipeline.config, 'PROV_DIR', str(prov_dir))

    # Monkeypatch the already-imported references in fetch_normalize
    import pipeline.fetch_normalize
    monkeypatch.setattr(pipeline.fetch_normalize, 'ROOT', str(tmp_path))
    monkeypatch.setattr(pipeline.fetch_normalize, 'PRICE_FILE', str(price_file))
    monkeypatch.setattr(pipeline.fetch_normalize, 'OUT_DIR', str(out_dir))
    monkeypatch.setattr(pipeline.fetch_normalize, 'PROV_DIR', str(prov_dir))

    # Patch sys.argv to prevent --fetch flag
    monkeypatch.setattr(sys, 'argv', ['fetch_normalize.py'])

    # Run the pipeline
    from pipeline.fetch_normalize import main
    main()

    # --- Assertions ---

    # 1. v1/index.json exists and validates against IndexModel
    index_path = out_dir / 'index.json'
    assert index_path.exists(), 'v1/index.json was not created'
    with open(index_path, 'r', encoding='utf-8') as f:
        index_data = json.load(f)
    IndexModel.model_validate(index_data)

    # 2. v1/nasional.json exists and is parseable JSON with a provinces list
    nasional_path = out_dir / 'nasional.json'
    assert nasional_path.exists(), 'v1/nasional.json was not created'
    with open(nasional_path, 'r', encoding='utf-8') as f:
        nasional_data = json.load(f)
    assert 'provinces' in nasional_data, 'nasional.json missing provinces key'
    assert isinstance(nasional_data['provinces'], list)

    # 3. v1/provinsi/ contains the expected number of .json files
    assert prov_dir.exists(), 'v1/provinsi/ directory was not created'
    prov_files = [f for f in os.listdir(prov_dir) if f.endswith('.json')]
    expected_province_count = 40
    assert len(prov_files) == expected_province_count, (
        f'Expected {expected_province_count} province files, got {len(prov_files)}'
    )

    # 4. index.json's provinsi_count equals the file count
    assert index_data['provinsi_count'] == len(prov_files), (
        f"provinsi_count ({index_data['provinsi_count']}) != file count ({len(prov_files)})"
    )

    # 5. nasional.json provinces list length equals province file count
    assert len(nasional_data['provinces']) == len(prov_files), (
        f"nasional provinces count ({len(nasional_data['provinces'])}) != file count ({len(prov_files)})"
    )

    # 6. Each provinsi entry's path matches an existing file in temp output
    for slug, entry in index_data['provinsi'].items():
        entry_path = entry['path']
        # path is like /v1/provinsi/aceh.json — resolve relative to tmp_path
        relative_path = entry_path.lstrip('/')
        full_path = tmp_path / relative_path
        assert full_path.exists(), (
            f"Province entry path '{entry_path}' does not exist at {full_path}"
        )

    # 7. Each province file validates against ProvinceModel
    for prov_file in prov_files:
        prov_file_path = prov_dir / prov_file
        with open(prov_file_path, 'r', encoding='utf-8') as f:
            prov_data = json.load(f)
        ProvinceModel.model_validate(prov_data)
