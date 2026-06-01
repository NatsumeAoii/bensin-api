import json
import os
from src.fetch_normalize import parse_price, slugify, build_province_file


def test_parse_numeric_string():
    val, status = parse_price('12600')
    assert val == 12600
    assert status == 'available'


def test_parse_rupiah_format():
    val, status = parse_price('Rp 10.000')
    assert val == 10000
    assert status == 'available'


def test_parse_decimal_thousand():
    val, status = parse_price('Rp 6.800')
    assert val == 6800
    assert status == 'available'


def test_parse_zero_unavailable():
    val, status = parse_price('0')
    assert val is None
    assert status == 'unavailable'


def test_parse_none_unavailable():
    val, status = parse_price(None)
    assert val is None
    assert status == 'unavailable'


def test_parse_decimals():
    val, status = parse_price('Rp 12.500,00')
    assert val == 12500
    assert status == 'available'

    val, status = parse_price('12,500.50')
    assert val == 12501
    assert status == 'available'

    val, status = parse_price('12500.00')
    assert val == 12500
    assert status == 'available'


def test_slugify_examples():
    assert slugify('Prov. Aceh') == 'aceh'
    assert slugify('Prov. DI Yogyakarta') == 'di-yogyakarta'
    assert slugify('Free Trade Zone (FTZ) Sabang') == 'free-trade-zone-ftz-sabang'


def test_product_canonical_mapping():
    prov_obj = {
        'province': 'Aceh',
        'list_price': [
            {'product': 'BIO SOLAR', 'price': '6800', 'updatedDate': '2026-06-01'},
            {'product': 'Pertamax', 'price': '12500', 'updatedDate': '2026-06-01'},
            {'product': 'PERTADEX', 'price': '13000', 'updatedDate': '2026-06-01'},
            {'product': 'NewFuel 99', 'price': '15000', 'updatedDate': '2026-06-01'},
        ]
    }
    payload = build_province_file(prov_obj)
    products = [p['product'] for p in payload['products']]
    
    assert 'BIOSOLAR' in products
    assert 'PERTAMAX' in products
    assert 'PERTAMINA DEX' in products
    assert 'NEWFUEL 99' in products


def test_write_json_function(tmp_path):
    test_file = tmp_path / "index.json"
    valid_data = {
        'api_name': 'Indonesia Fuel Price API',
        'version': 'v1',
        'author': 'Nasrullah Gunawan',
        'github_repository': 'https://github.com/nasgunawann/bensin-api',
        'synced_at': '2026-06-01T11:11:11Z',
        'pertamina_updated_at': '2026-06-01T15:59:37.000Z',
        'provinsi_count': 0,
        'provinsi': {},
        'endpoints': {
            'all_provinces': '/v1/nasional.json'
        }
    }
    from src.fetch_normalize import write_json
    write_json(str(test_file), valid_data)
    
    assert test_file.exists()
    with open(test_file, 'r', encoding='utf-8') as f:
        written_data = json.load(f)
    assert written_data['api_name'] == 'Indonesia Fuel Price API'
