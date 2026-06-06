import json
import os
import tempfile

import pytest
from pydantic import ValidationError
from hypothesis import given, settings, assume
from hypothesis import strategies as st

from pipeline.schemas import IndexModel, ProvinceModel, NationalModel
from pipeline.fetch_normalize import write_json


def test_index_schema_validates():
    # Valid mock data for IndexModel
    valid_data = {
        'api_name': 'Indonesia Fuel Price API',
        'version': 'v1',
        'author': 'Nasrullah Gunawan',
        'github_repository': 'https://github.com/nasgunawann/bensin-api',
        'synced_at': '2026-06-01T11:11:11Z',
        'pertamina_updated_at': '2026-06-01T15:59:37.000Z',
        'provinsi_count': 1,
        'provinsi': {
            'aceh': {
                'name': 'Prov. Aceh',
                'slug': 'aceh',
                'path': '/v1/provinsi/aceh.json',
                'pertamina_updated_at': '2026-06-01T15:59:37.000Z',
                'synced_at': '2026-06-01T11:11:11Z',
                'products_count': 1,
                'file_size_bytes': 1200
            }
        },
        'endpoints': {
            'all_provinces': '/v1/nasional.json'
        }
    }
    
    # Positive case: should validate successfully
    IndexModel.model_validate(valid_data)
    
    # Negative case: missing required field 'version'
    invalid_data = valid_data.copy()
    del invalid_data['version']
    with pytest.raises(ValidationError):
        IndexModel.model_validate(invalid_data)


def test_province_schema_validates():
    # Valid mock data for ProvinceModel
    valid_data = {
        'province': 'Prov. Aceh',
        'province_slug': 'aceh',
        'pertamina_updated_at': '2026-06-01T15:59:37.000Z',
        'synced_at': '2026-06-01T11:11:11Z',
        'products': [
            {
                'product': 'PERTAMAX',
                'price_rupiah': 12600,
                'availability': 'available'
            },
            {
                'product': 'PERTALITE',
                'price_rupiah': None,
                'availability': 'unavailable',
                'pertamina_updated_at': '2026-06-01T16:00:00.000Z'
            }
        ]
    }
    
    # Positive case: should validate successfully
    ProvinceModel.model_validate(valid_data)
    
    # Negative case: invalid availability state
    invalid_data = valid_data.copy()
    invalid_data['products'] = [
        {
            'product': 'PERTAMAX',
            'price_rupiah': 12600,
            'availability': 'invalid_availability'
        }
    ]
    with pytest.raises(ValidationError):
        ProvinceModel.model_validate(invalid_data)


# ---------------------------------------------------------------------------
# Hypothesis Strategies
# ---------------------------------------------------------------------------

availability_strategy = st.sampled_from(['available', 'unavailable', 'unknown'])

product_strategy = st.fixed_dictionaries({
    'product': st.text(min_size=1, max_size=50),
    'price_rupiah': st.one_of(st.none(), st.integers(min_value=1, max_value=100_000_000)),
    'availability': availability_strategy,
    'pertamina_updated_at': st.one_of(st.none(), st.text(min_size=1, max_size=30)),
})

province_strategy = st.fixed_dictionaries({
    'province': st.text(min_size=1, max_size=100),
    'province_slug': st.text(min_size=1, max_size=100),
    'pertamina_updated_at': st.one_of(st.none(), st.text(min_size=1, max_size=30)),
    'synced_at': st.text(min_size=1, max_size=30),
    'products': st.lists(product_strategy, min_size=1, max_size=5),
})

valid_national_strategy = st.fixed_dictionaries({
    'version': st.text(min_size=1, max_size=20),
    'synced_at': st.text(min_size=1, max_size=30),
    'pertamina_updated_at': st.one_of(st.none(), st.text(min_size=1, max_size=30)),
    'provinces': st.lists(province_strategy, min_size=1, max_size=5),
})


# ---------------------------------------------------------------------------
# Property 3: NationalModel schema rejects invalid payloads
# Validates: Requirements 2.1, 2.3
# ---------------------------------------------------------------------------

@st.composite
def invalid_national_payload(draw):
    """Generate payloads missing required fields or with empty provinces list."""
    strategy_choice = draw(st.sampled_from([
        'missing_version',
        'missing_synced_at',
        'missing_provinces',
        'empty_provinces',
    ]))

    base = draw(valid_national_strategy)

    if strategy_choice == 'missing_version':
        del base['version']
    elif strategy_choice == 'missing_synced_at':
        del base['synced_at']
    elif strategy_choice == 'missing_provinces':
        del base['provinces']
    elif strategy_choice == 'empty_provinces':
        base['provinces'] = []

    return base, strategy_choice


@given(data=invalid_national_payload())
@settings(max_examples=100)
def test_property3_national_model_rejects_invalid_payloads(data):
    """Property 3: NationalModel schema rejects invalid payloads.

    **Validates: Requirements 2.1, 2.3**

    For any payload missing a required field (version, synced_at, provinces) or
    with provinces as an empty list, NationalModel.model_validate SHALL raise a
    ValidationError containing the path of the invalid field.
    """
    payload, strategy_choice = data

    with pytest.raises(ValidationError) as exc_info:
        NationalModel.model_validate(payload)

    error_fields = [err['loc'][0] for err in exc_info.value.errors()]

    if strategy_choice == 'missing_version':
        assert 'version' in error_fields
    elif strategy_choice == 'missing_synced_at':
        assert 'synced_at' in error_fields
    elif strategy_choice == 'missing_provinces':
        assert 'provinces' in error_fields
    elif strategy_choice == 'empty_provinces':
        assert 'provinces' in error_fields


# ---------------------------------------------------------------------------
# Property 4: Validation gates file write
# Validates: Requirements 2.2, 2.3
# ---------------------------------------------------------------------------

@given(data=invalid_national_payload())
@settings(max_examples=100)
def test_property4_validation_gates_file_write(data):
    """Property 4: Validation gates file write.

    **Validates: Requirements 2.2, 2.3**

    For any invalid nasional payload, calling write_json with a path ending in
    nasional.json SHALL raise a ValidationError AND the target file SHALL NOT
    exist on disk after the call.
    """
    payload, _ = data

    with tempfile.TemporaryDirectory() as tmp_dir:
        target_file = os.path.join(tmp_dir, "nasional.json")

        with pytest.raises(ValidationError):
            write_json(target_file, payload)

        assert not os.path.exists(target_file)


# ---------------------------------------------------------------------------
# Property 5: Valid nasional data round-trips through write_json
# Validates: Requirements 2.5
# ---------------------------------------------------------------------------

@given(payload=valid_national_strategy)
@settings(max_examples=100)
def test_property5_valid_nasional_roundtrip(payload):
    """Property 5: Valid nasional data round-trips through write_json.

    **Validates: Requirements 2.5**

    For any valid nasional payload (conforming to NationalModel), calling
    write_json SHALL produce a UTF-8 file whose content, when parsed as JSON,
    is equal to the original payload.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        target_file = os.path.join(tmp_dir, "nasional.json")

        write_json(target_file, payload)

        assert os.path.exists(target_file)
        with open(target_file, 'r', encoding='utf-8') as f:
            written_data = json.load(f)

        assert written_data == payload