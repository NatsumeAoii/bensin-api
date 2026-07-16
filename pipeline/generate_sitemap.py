"""Generate sitemap.xml from v1/index.json for the Bensin-API static site."""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone

BASE_URL = "https://nasgunawann.github.io/bensin-api"
STATIC_ROUTES = [
    ("", "hourly"),
    ("nasional", "hourly"),
    ("perubahan", "daily"),
    ("peta", "daily"),
]


def generate_sitemap(index_path: Path, output_path: Path) -> None:
    with open(index_path, encoding="utf-8") as f:
        index = json.load(f)

    synced_at = index.get("synced_at", datetime.now(timezone.utc).isoformat())
    lastmod = synced_at[:10]  # YYYY-MM-DD

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for route, changefreq in STATIC_ROUTES:
        lines.append("  <url>")
        lines.append(f"    <loc>{BASE_URL}/{route}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append(f"    <changefreq>{changefreq}</changefreq>")
        lines.append("  </url>")

    for slug in index.get("provinsi", {}):
        lines.append("  <url>")
        lines.append(f"    <loc>{BASE_URL}/provinsi/{slug}</loc>")
        lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("    <changefreq>hourly</changefreq>")
        lines.append("  </url>")

    lines.append("</urlset>")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"✅ Generated {output_path} with {len(lines) - 3} URLs")


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    index_path = root / "v1" / "index.json"
    output_path = root / "public" / "sitemap.xml"

    if not index_path.exists():
        print(f"⚠️  {index_path} not found — skipping sitemap generation")
        sys.exit(0)

    generate_sitemap(index_path, output_path)


if __name__ == "__main__":
    main()
