# Vertigo Mixed S1 Rulebook

Two flavours of the same rulebook, built from a **single source file** (`docs/index.rst`):

| Target  | Output       | Style                           | Hosted on            |
| ------- | ------------ | ------------------------------- | -------------------- |
| `rtd`   | `build/rtd/` | Sphinx + sphinx-rtd-theme       | [Read the Docs][rtd] |
| `site`  | `build/site/`| Custom single-page panel layout | any static host      |

[rtd]: https://readthedocs.org

Both render the same content, share the same timezone-aware `<time>` elements, and update automatically when the RST is edited.

## Quick start

```bash
pip install -r requirements.txt
make all          # builds both sites
make serve        # preview the custom site at http://localhost:8000
make serve-rtd    # preview the Sphinx site
```

Other targets: `make rtd`, `make site`, `make clean`.

## Editing the rulebook

Every change goes in **`docs/index.rst`** — both builds re-read it.

For times, use the custom `:t:` role so the value is rendered in the reader's local timezone:

```rst
:t:`2026-06-14 17:30`
```

## Sites in detail

### Sphinx / Read the Docs

Standard Sphinx project. To deploy on Read the Docs, push to GitHub and import the repo at <https://readthedocs.org>; RTD finds `.readthedocs.yaml`, installs `requirements.txt`, and builds via Sphinx. PDF and ePub formats are produced alongside HTML.

### Custom panel site

`site/build.py` parses the same `docs/index.rst` with docutils, splits the rendered HTML into one panel per top-level section, and writes a single-page site to `build/site/`. Features:

- **Masonry grid** via CSS columns: panels reflow from one column on mobile up to four on wide desktops, filling available space.
- **Coloured panel headers** assigned in source order (amber, sky, emerald, violet, orange, rose, teal).
- **Dark / light themes** with a top-right toggle. The saved preference is applied synchronously in `<head>` to avoid a flash on load.
- **Hash deep-linking.** Every panel header and subheading is clickable — clicking sets the URL hash and copies the link to the clipboard. Visiting a `#anchor` URL scrolls there and flashes a yellow pulse around the target.
- **Timezone-aware times.** The same `docs/_static/timezone.js` used by the Sphinx build re-renders all CEST times in the reader's local timezone.
- **Vertigo logo** at top-centre with separate dark / light variants and the version line below.

The site is fully static and dependency-free at runtime: one HTML file, one stylesheet, two small JS files, and the logo assets.

## Layout

```
.
├── .readthedocs.yaml             # Read the Docs build config
├── Makefile                      # build targets
├── requirements.txt              # all Python deps
├── docs/                         # shared content + Sphinx config
│   ├── conf.py
│   ├── index.rst                 # ← single source of truth
│   ├── _ext/
│   │   └── timezone_role.py      # custom :t: role
│   └── _static/
│       └── timezone.js           # client-side timezone rewriter
└── site/                         # custom site builder
    ├── build.py                  # docutils → panels
    ├── template.html             # HTML shell
    ├── style.css
    ├── theme.js                  # theme toggle + hash highlights
    └── assets/                   # logos + favicon
```
