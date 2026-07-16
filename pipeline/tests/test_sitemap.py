"""Tests for pipeline.generate_sitemap."""

import json
import tempfile
from pathlib import Path

from pipeline.generate_sitemap import generate_sitemap


def _make_index(slugs: list[str] | None = None, synced_at: str = "2026-07-14T00:00:00Z") -> dict:
    if slugs is None:
        slugs = ["aceh", "bali", "dki-jakarta"]
    return {
        "synced_at": synced_at,
        "provinsi": {slug: {"slug": slug, "name": slug} for slug in slugs},
    }


def test_generates_valid_xml():
    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.json"
        output_path = Path(tmp) / "sitemap.xml"
        index_path.write_text(json.dumps(_make_index()), encoding="utf-8")

        generate_sitemap(index_path, output_path)

        content = output_path.read_text(encoding="utf-8")
        assert '<?xml version="1.0"' in content
        assert '<urlset' in content
        assert "</urlset>" in content


def test_contains_all_province_urls():
    slugs = ["aceh", "bali", "papua"]
    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.json"
        output_path = Path(tmp) / "sitemap.xml"
        index_path.write_text(json.dumps(_make_index(slugs)), encoding="utf-8")

        generate_sitemap(index_path, output_path)

        content = output_path.read_text(encoding="utf-8")
        for slug in slugs:
            assert f"/provinsi/{slug}" in content


def test_contains_static_routes():
    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.json"
        output_path = Path(tmp) / "sitemap.xml"
        index_path.write_text(json.dumps(_make_index()), encoding="utf-8")

        generate_sitemap(index_path, output_path)

        content = output_path.read_text(encoding="utf-8")
        assert "/nasional" in content
        assert "/perubahan" in content
        assert "/peta" in content


def test_lastmod_matches_synced_at():
    synced_at = "2026-07-14T12:00:00Z"
    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.json"
        output_path = Path(tmp) / "sitemap.xml"
        index_path.write_text(json.dumps(_make_index(synced_at=synced_at)), encoding="utf-8")

        generate_sitemap(index_path, output_path)

        content = output_path.read_text(encoding="utf-8")
        assert "2026-07-14" in content


def test_handles_empty_provinces():
    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.json"
        output_path = Path(tmp) / "sitemap.xml"
        index_path.write_text(json.dumps(_make_index(slugs=[])), encoding="utf-8")

        generate_sitemap(index_path, output_path)

        content = output_path.read_text(encoding="utf-8")
        assert "</urlset>" in content
