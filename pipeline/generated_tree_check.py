"""Validate the complete generated v1 tree before publication."""
from __future__ import annotations

import json
import os
from pathlib import Path

from pipeline.schemas import HistoryIndexModel, HistoryModel, IndexModel, NationalModel, ProvinceModel


def _read(path: Path) -> dict:
    with path.open(encoding='utf-8') as handle:
        return json.load(handle)


def validate_generated_tree(root: str) -> None:
    base = Path(root)
    index = IndexModel.model_validate(_read(base / 'index.json'))
    national = NationalModel.model_validate(_read(base / 'nasional.json'))
    history_index = HistoryIndexModel.model_validate(_read(base / 'history' / 'index.json'))

    province_dir = base / 'provinsi'
    indexed_slugs = set(index.provinsi)
    actual_slugs = {path.stem for path in province_dir.glob('*.json')}
    if indexed_slugs != actual_slugs:
        raise ValueError('province files do not match index entries')
    if index.provinsi_count != len(indexed_slugs):
        raise ValueError('province count does not match index entries')

    national_by_slug = {province.province_slug: province for province in national.provinces}
    if set(national_by_slug) != indexed_slugs:
        raise ValueError('national provinces do not match index entries')

    for slug, entry in index.provinsi.items():
        if entry.slug != slug or entry.path != f'/v1/provinsi/{slug}.json':
            raise ValueError(f'invalid index path for {slug}')
        province_path = province_dir / f'{slug}.json'
        province = ProvinceModel.model_validate(_read(province_path))
        if province.province_slug != slug or len(province.products) != entry.products_count:
            raise ValueError(f'province metadata mismatch for {slug}')
        if province.model_dump() != national_by_slug[slug].model_dump():
            raise ValueError(f'national/province mismatch for {slug}')
        if province_path.stat().st_size != entry.file_size_bytes:
            raise ValueError(f'file size mismatch for {slug}')

    history_dir = base / 'history' / 'provinsi'
    history_slugs = {path.stem for path in history_dir.glob('*.json')}
    indexed_history_slugs = {entry.slug for entry in history_index.provinsi}
    if history_slugs != indexed_history_slugs:
        raise ValueError('history files do not match history index entries')
    if history_index.count != len(indexed_history_slugs):
        raise ValueError('history count does not match history index entries')
    for entry in history_index.provinsi:
        if entry.path != f'/v1/history/provinsi/{entry.slug}.json':
            raise ValueError(f'invalid history path for {entry.slug}')
        history = HistoryModel.model_validate(_read(history_dir / f'{entry.slug}.json'))
        point_count = sum(len(points) for points in history.products.values())
        if point_count != entry.point_count:
            raise ValueError(f'history point count mismatch for {entry.slug}')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('root', nargs='?', default='v1')
    args = parser.parse_args()
    validate_generated_tree(args.root)
    print('Generated tree is valid')
