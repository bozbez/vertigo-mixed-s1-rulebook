#!/usr/bin/env python3
"""Build the standalone Vertigo Mixed S1 rulebook site.

Reads ``docs/index.rst`` — the same RST file Sphinx uses for the Read the Docs
build — renders it with docutils, then splits the result into one panel per
top-level section to produce a single-page static site.

Usage::

    python site/build.py

Output is written to ``build/site/``.
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

from bs4 import BeautifulSoup
from docutils.core import publish_parts
from docutils.parsers.rst import roles

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
RST_FILE = ROOT / "docs" / "index.rst"
TIMEZONE_JS = ROOT / "docs" / "_static" / "timezone.js"
OUTPUT_DIR = ROOT / "build" / "site"

# Register the custom :t: role with docutils (mirrors the Sphinx extension).
sys.path.insert(0, str(ROOT / "docs" / "_ext"))
from timezone_role import time_role  # noqa: E402

roles.register_local_role("t", time_role)

# Panels cycle through this color list in source order.
PANEL_COLORS = ["amber", "sky", "emerald", "violet", "orange", "rose", "teal"]


def render_rst() -> tuple[str, str]:
    """Render the RST file. Returns (doctitle, body_fragment_html)."""
    source = RST_FILE.read_text(encoding="utf-8")
    parts = publish_parts(
        source=source,
        writer_name="html5",
        settings_overrides={
            "doctitle_xform": True,
            "report_level": 5,  # suppress info/warning output
            "embed_stylesheet": False,
            "input_encoding": "utf-8",
            "output_encoding": "unicode",
        },
    )
    return parts["title"], parts["fragment"]


def extract_metadata(body_html: str) -> tuple[str, str, str]:
    """Pull 'Season 1 - Rulebook 1.0 - last updated 2026-05-12' from the leading note."""
    match = re.search(
        r"Season\s+<strong>([^<]+)</strong>\s*-\s*"
        r"Rulebook\s+<strong>([^<]+)</strong>\s*-\s*"
        r"last updated\s+<strong>([^<]+)</strong>",
        body_html,
    )
    if match:
        return tuple(g.strip() for g in match.groups())
    return "-", "-", "-"


def split_into_panels(body_html: str) -> tuple[list[dict], str]:
    """Split rendered HTML into panels + a pre-grid notice (from leading tip)."""
    soup = BeautifulSoup(body_html, "html.parser")

    # Strip the auto-generated TOC from the contents directive
    for toc in soup.select(".contents.topic, nav.contents"):
        toc.decompose()

    # Strip fixed col widths so tables size to content within their panel
    for col in soup.find_all("col"):
        col.decompose()
    for cg in soup.find_all("colgroup"):
        cg.decompose()

    # Pull out the leading .. tip:: (document-level, before any section) for
    # display as a notice bar above the grid. Skip the leading .. note:: which
    # contains the version/date we already extracted.
    notice_html = ""
    for adm in soup.find_all("aside", class_="admonition", recursive=False):
        classes = adm.get("class", [])
        if "tip" in classes:
            notice_html = str(adm)
            adm.decompose()
            break

    panels = []
    for i, section in enumerate(soup.find_all("section", recursive=False)):
        section_id = section.get("id", f"section-{i}")
        heading = section.find(["h1", "h2"], recursive=False)
        title = heading.get_text(strip=True) if heading else section_id
        if heading:
            heading.decompose()
        body = section.decode_contents().strip()
        panels.append({
            "id": section_id,
            "title": title,
            "body": body,
            "color": PANEL_COLORS[i % len(PANEL_COLORS)],
        })
    return panels, notice_html


def render_panel(panel: dict) -> str:
    return (
        f'<section class="panel panel-{panel["color"]}" id="{panel["id"]}">'
        f'<header class="panel-header">'
        f'<h2 data-anchor="{panel["id"]}">{panel["title"]}</h2>'
        f"</header>"
        f'<div class="panel-body">{panel["body"]}</div>'
        f"</section>"
    )


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    title, body_html = render_rst()
    season, version, last_updated = extract_metadata(body_html)
    panels, notice_html = split_into_panels(body_html)

    template = (HERE / "template.html").read_text(encoding="utf-8")
    html = template.format(
        title=title or "Vertigo Mixed S1 - Rulebook",
        season=season,
        version=version,
        last_updated=last_updated,
        notice=notice_html,
        panels="\n".join(render_panel(p) for p in panels),
    )
    (OUTPUT_DIR / "index.html").write_text(html, encoding="utf-8")

    # Copy static assets
    shutil.copy(HERE / "style.css", OUTPUT_DIR / "style.css")
    shutil.copy(HERE / "theme.js", OUTPUT_DIR / "theme.js")
    shutil.copy(TIMEZONE_JS, OUTPUT_DIR / "timezone.js")

    assets_dst = OUTPUT_DIR / "assets"
    if assets_dst.exists():
        shutil.rmtree(assets_dst)
    shutil.copytree(HERE / "assets", assets_dst)

    print(f"Built site at {OUTPUT_DIR.relative_to(ROOT)}")
    print(f"  Title: {title}")
    print(f"  Season {season}, Rulebook {version} ({last_updated})")
    print(f"  Panels ({len(panels)}):")
    for p in panels:
        print(f"    {p['color']:8s}  #{p['id']:20s}  {p['title']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
