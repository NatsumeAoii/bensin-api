import pytest
from pydantic import ValidationError
from src.schemas import IndexModel, ProvinceModel


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
