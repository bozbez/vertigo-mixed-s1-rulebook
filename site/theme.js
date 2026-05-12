// Theme toggle + hash-link highlight + clickable headings.
(function () {
  "use strict";

  var THEME_KEY = "vertigo-theme";
  var root = document.documentElement;

  function applyTheme(t) { root.setAttribute("data-theme", t); }
  function getTheme() { return root.getAttribute("data-theme") || "dark"; }
  function saveTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }

  // The inline script in <head> already applied the saved/preferred theme
  // synchronously to avoid flash. Here we just wire up the toggle button.

  function flashHash() {
    var raw = location.hash.slice(1);
    if (!raw) return;
    var id;
    try { id = decodeURIComponent(raw); } catch (e) { id = raw; }
    var el = document.getElementById(id);
    if (!el) return;

    // If the target is inside a collapsed/closed panel, the panel still
    // contains it — just scroll and pulse.
    el.classList.remove("hash-flash");
    // force reflow so the animation restarts on consecutive hashchange events
    void el.offsetWidth;
    el.classList.add("hash-flash");
    setTimeout(function () { el.classList.remove("hash-flash"); }, 2400);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyHashToClipboard(id) {
    var url = location.origin + location.pathname + location.search + "#" + id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(function () {});
    }
  }

  function wireHeadingClicks() {
    // Top-level panel headers (set the hash to the panel id)
    document.querySelectorAll(".panel").forEach(function (panel) {
      var id = panel.id;
      if (!id) return;
      var heading = panel.querySelector(".panel-header h2");
      if (!heading) return;
      heading.title = "Click to copy link to this section";
      heading.addEventListener("click", function () {
        history.replaceState(null, "", "#" + id);
        copyHashToClipboard(id);
        flashHash();
      });
    });

    // Subsections inside the panel body
    document.querySelectorAll(".panel-body section[id]").forEach(function (section) {
      var id = section.id;
      var heading = section.querySelector(":scope > h2, :scope > h3, :scope > h4");
      if (!heading) return;
      heading.title = "Click to copy link to this subsection";
      heading.addEventListener("click", function () {
        history.replaceState(null, "", "#" + id);
        copyHashToClipboard(id);
        flashHash();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = getTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
        saveTheme(next);
      });
    }

    // Time-display toggle (Local / CEST). The timezone.js sister script
    // exposes window.vertigoApplyTimeMode() to re-render every <time>.
    var TIME_KEY = "vertigo-time-mode";
    var initialMode;
    try { initialMode = localStorage.getItem(TIME_KEY) || "local"; }
    catch (e) { initialMode = "local"; }

    function setTimeMode(mode) {
      try { localStorage.setItem(TIME_KEY, mode); } catch (e) {}
      document.querySelectorAll(".time-toggle button").forEach(function (b) {
        b.classList.toggle("active", b.dataset.mode === mode);
      });
      if (typeof window.vertigoApplyTimeMode === "function") {
        window.vertigoApplyTimeMode();
      }
    }
    setTimeMode(initialMode);
    document.querySelectorAll(".time-toggle button").forEach(function (b) {
      b.addEventListener("click", function () { setTimeMode(b.dataset.mode); });
    });

    wireHeadingClicks();
    window.addEventListener("hashchange", flashHash);
    // On initial load, flash any target that was linked in the URL
    if (location.hash) flashHash();
  });
})();
