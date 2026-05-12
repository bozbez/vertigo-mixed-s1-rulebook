// Convert <time class="tz-time"> elements (with a CEST datetime attribute)
// into the reader's local timezone, using the browser's Intl.DateTimeFormat.
//
// Each element stores both the CEST and the local rendering as data
// attributes, so the display can be toggled later by setting
// localStorage["vertigo-time-mode"] to "cest" or "local" and calling
// window.vertigoApplyTimeMode().
//
// Clicking a time copies a Discord-style timestamp token to the clipboard.
(function () {
  "use strict";

  var STORAGE_KEY = "vertigo-time-mode";

  // Discord timestamp format suffix used for click-to-copy.
  //   F = Long date/time   e.g. "Sunday, 21 June 2026 17:30"  (default)
  //   f = Short date/time  e.g. "21 June 2026 17:30"
  //   D = Long date        e.g. "21 June 2026"
  //   d = Short date       e.g. "21/06/2026"
  //   T = Long time        e.g. "17:30:00"
  //   t = Short time       e.g. "17:30"
  //   R = Relative         e.g. "in 5 weeks"
  var DISCORD_FORMAT = "F";

  function getMode() {
    try { return localStorage.getItem(STORAGE_KEY) || "local"; }
    catch (e) { return "local"; }
  }

  function shortTZ(date) {
    try {
      var parts = new Intl.DateTimeFormat(undefined, {
        timeZoneName: "short",
      }).formatToParts(date);
      var tz = parts.find(function (p) { return p.type === "timeZoneName"; });
      return tz ? tz.value : "";
    } catch (e) { return ""; }
  }

  function fmt(date, opts) {
    return new Intl.DateTimeFormat(undefined, opts).format(date);
  }

  function ymd(date, timeZone) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(date);
  }

  function prepare(el) {
    var iso = el.getAttribute("datetime");
    if (!iso) return;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return;

    var original = el.textContent.trim();
    el.setAttribute("data-cest-time", original + " CEST");

    var cestDate = fmt(d, {
      timeZone: "Europe/Berlin",
      day: "numeric", month: "short", year: "numeric",
    });
    el.setAttribute("data-cest-date", cestDate);

    // Day-shift detection: compare YYYY-MM-DD in CEST vs reader's local zone.
    var cestYmd = ymd(d, "Europe/Berlin");
    var localYmd = ymd(d, Intl.DateTimeFormat().resolvedOptions().timeZone);
    var dayShift = "";
    if (cestYmd !== localYmd) {
      var msPerDay = 24 * 60 * 60 * 1000;
      var diff = Math.round(
        (Date.parse(localYmd) - Date.parse(cestYmd)) / msPerDay
      );
      dayShift = " (" + (diff > 0 ? "+" : "") + diff + "d)";
    }

    var local = fmt(d, { hour: "2-digit", minute: "2-digit", hour12: false });
    var tz = shortTZ(d);
    el.setAttribute("data-local-time",
      (tz ? local + " " + tz : local) + dayShift);

    apply(el);
  }

  function apply(el) {
    var mode = getMode();
    var clickHint = "Click to copy Discord timestamp";
    if (mode === "cest") {
      var cest = el.getAttribute("data-cest-time");
      if (cest) el.textContent = cest;
      el.setAttribute("title", clickHint);
    } else {
      var loc = el.getAttribute("data-local-time");
      if (loc) el.textContent = loc;
      el.setAttribute("title",
        "Original: " + el.getAttribute("data-cest-time") +
        " on " + el.getAttribute("data-cest-date") +
        " · " + clickHint);
    }
  }

  // ---------- Toast ----------
  function ensureToast() {
    var t = document.getElementById("vertigo-toast");
    if (t) return t;
    t = document.createElement("div");
    t.id = "vertigo-toast";
    t.setAttribute("role", "status");
    var s = t.style;
    s.position = "fixed";
    s.bottom = "1.5rem";
    s.left = "50%";
    s.transform = "translateX(-50%) translateY(8px)";
    s.background = "#1c1c20";
    s.color = "#ececf0";
    s.border = "1px solid #fbbf24";
    s.padding = "0.55rem 0.95rem";
    s.borderRadius = "6px";
    s.fontSize = "0.9rem";
    s.fontFamily = "system-ui, -apple-system, sans-serif";
    s.zIndex = "9999";
    s.opacity = "0";
    s.transition = "opacity 0.2s, transform 0.2s";
    s.pointerEvents = "none";
    s.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    s.maxWidth = "90vw";
    document.body.appendChild(t);
    return t;
  }

  function showToast(html) {
    var t = ensureToast();
    t.innerHTML = html;
    t.style.opacity = "1";
    t.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      t.style.opacity = "0";
      t.style.transform = "translateX(-50%) translateY(8px)";
    }, 2400);
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ---------- Click to copy Discord timestamp ----------
  function copyDiscord(el) {
    var iso = el.getAttribute("datetime");
    if (!iso) return;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return;
    var unix = Math.floor(d.getTime() / 1000);
    var token = "<t:" + unix + ":" + DISCORD_FORMAT + ">";

    var code =
      '<code style="background:rgba(0,0,0,0.35);padding:2px 6px;border-radius:4px;' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.92em">' +
      esc(token) + "</code>";

    function ok()   { showToast("Copied " + code); }
    function fail() { showToast("Failed to copy"); }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(token).then(ok).catch(fail);
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = token;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok();
      } catch (e) { fail(); }
    }
  }

  function attachClicks() {
    document.querySelectorAll("time.tz-time").forEach(function (el) {
      el.style.cursor = "pointer";
      el.style.borderBottom = "1px dotted currentColor";
      el.addEventListener("click", function () { copyDiscord(el); });
    });
  }

  // Expose for the custom site's time-mode toggle.
  window.vertigoApplyTimeMode = function () {
    document.querySelectorAll("time.tz-time").forEach(apply);
  };

  function run() {
    document.querySelectorAll("time.tz-time").forEach(prepare);
    attachClicks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
