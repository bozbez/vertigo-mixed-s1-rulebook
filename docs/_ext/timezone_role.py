"""Sphinx extension: ``:t:`` inline role for CEST datetimes.

Wraps a date + time in an HTML ``<time>`` element with a full ISO-8601
datetime attribute (including the CEST offset), so client-side JS can
re-render the time in the reader's local timezone.

Usage in RST::

    :t:`2026-06-14 17:30`

Renders as::

    <time datetime="2026-06-14T17:30:00+02:00" data-tz-show="time" class="tz-time">17:30</time>
"""
from __future__ import annotations

import re

from docutils import nodes

_PATTERN = re.compile(r"^\s*(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*$")


def time_role(name, rawtext, text, lineno, inliner, options=None, content=None):
    match = _PATTERN.match(text)
    if not match:
        msg = inliner.reporter.error(
            f":t: expects 'YYYY-MM-DD HH:MM', got {text!r}", line=lineno,
        )
        return [inliner.problematic(rawtext, rawtext, msg)], [msg]

    yyyy, mm, dd, hh, mi = match.groups()
    iso = f"{yyyy}-{mm}-{dd}T{int(hh):02d}:{mi}:00+02:00"
    display = f"{int(hh):02d}:{mi}"
    html = (
        f'<time datetime="{iso}" data-tz-show="time" class="tz-time">'
        f"{display}</time>"
    )
    return [nodes.raw("", html, format="html")], []


def setup(app):
    app.add_role("t", time_role)
    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
