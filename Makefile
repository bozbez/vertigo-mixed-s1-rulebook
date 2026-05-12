# Vertigo Mixed S1 Rulebook build targets

.PHONY: all rtd site clean serve serve-rtd

# Default: build both the Sphinx (RTD) site and the custom panel site.
all: rtd site

# Sphinx + sphinx-rtd-theme HTML, identical to what Read the Docs builds.
rtd:
	sphinx-build -b html docs build/rtd

# Custom single-page panel site.
site:
	python site/build.py

# Remove all build output.
clean:
	rm -rf build/ docs/_build/

# Local preview of the custom site.
serve: site
	@echo "Serving http://localhost:8000/ (Ctrl-C to stop)"
	@cd build/site && python -m http.server 8000

# Local preview of the Sphinx site.
serve-rtd: rtd
	@echo "Serving http://localhost:8000/ (Ctrl-C to stop)"
	@cd build/rtd && python -m http.server 8000
