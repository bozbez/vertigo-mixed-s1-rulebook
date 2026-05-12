"""Sphinx configuration for the Vertigo Mixed S1 rulebook."""
import os
import sys

sys.path.insert(0, os.path.abspath("_ext"))

project = "Vertigo Mixed S1 Rulebook"
author = "Vertigo Mixed Admins"
copyright = "2026, Vertigo Mixed Admins"
release = "1.0"

extensions = ["timezone_role"]
templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
html_js_files = ["timezone.js"]
