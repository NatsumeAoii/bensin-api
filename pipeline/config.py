import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PRICE_FILE = os.path.join(ROOT, 'price.json')
RAW_DIR = os.path.join(ROOT, 'raw')
UPSTREAM_URL = 'https://api.web.mypertamina.id/price'
OUT_DIR = os.path.join(ROOT, 'v1')
PROV_DIR = os.path.join(OUT_DIR, 'provinsi')

PRODUCT_CANONICAL_MAP = {
    'PERTALITE': 'PERTALITE',
    'PERTAMAX': 'PERTAMAX',
    'PERTAMAX TURBO': 'PERTAMAX TURBO',
    'PERTAMAX GREEN 95': 'PERTAMAX GREEN 95',
    'PERTAMAX GREEN': 'PERTAMAX GREEN 95',
    'DEXLITE': 'DEXLITE',
    'PERTAMINA DEX': 'PERTAMINA DEX',
    'PERTADEX': 'PERTAMINA DEX',
    'SOLAR': 'BIOSOLAR',
    'BIO SOLAR': 'BIOSOLAR',
    'BIOSOLAR': 'BIOSOLAR',
    'PERTAMINA BIOSOLAR SUBSIDI': 'BIOSOLAR',
    'PERTAMINA BIOSOLAR NON SUBSIDI': 'BIOSOLAR NON SUBSIDI',
}
