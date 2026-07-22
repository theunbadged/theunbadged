/* The Unbadged — analytics events (story + timeline pages ONLY).
   HARD RULE: this file must never be included on submit.html. The
   submission channel stays free of every third party; see
   docs/decisions/0005. */
(function () {
  "use strict";

  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  function label(el, sel, cap) {
    var n = el ? el.querySelector(sel) : null;
    var t = n ? n.textContent.replace(/\s+/g, " ").trim() : "";
    return t.slice(0, cap || 60);
  }

  /* ---- clicks, both pages: CTAs and outbound source links ---- */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a || !a.href) return;

    if (a.classList.contains("btn") || a.classList.contains("nav-submit")) {
      track("cta_click", {
        cta: a.classList.contains("fire") ? "submit_evidence"
          : a.classList.contains("steel") ? "read_timeline" : "nav_submit",
        page: location.pathname
      });
      return;
    }
    var action = a.closest(".event-action");
    if (action) {
      track("action_click", {
        entry: label(a.closest(".event"), "h3", 80),
        page: location.pathname
      });
      return;
    }
    if (a.host && a.host !== location.host) {
      track("outbound_click", {
        link_domain: a.host,
        context: label(a.closest(".route-caption, .evidence-scene, .event"), ".route-kicker, h3", 80) || "footer",
        page: location.pathname
      });
    }
  }, { passive: true });

  /* ---- story page: chapter + exhibit views along the scrub ---- */
  var rail = document.querySelector(".route-rail");
  if (rail) {
    var stops = Array.prototype.slice.call(
      rail.querySelectorAll(".route-caption, .evidence-scene")
    ).map(function (el, i) {
      return {
        s: parseFloat(el.getAttribute("data-s")),
        e: parseFloat(el.getAttribute("data-e")),
        name: label(el, ".route-kicker", 60) || (i === 0 ? "hero" : "chapter-" + i),
        kind: el.classList.contains("evidence-scene") ? "exhibit" : "chapter",
        index: i,
        seen: false
      };
    });
    var deepest = 0;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var rect = rail.getBoundingClientRect();
        var travel = rail.offsetHeight - window.innerHeight;
        var p = Math.min(1, Math.max(0, -rect.top / Math.max(1, travel)));
        if (p > deepest) deepest = p;
        stops.forEach(function (st) {
          if (!st.seen && p >= st.s && p <= st.e) {
            st.seen = true;
            track(st.kind === "exhibit" ? "exhibit_view" : "chapter_view", {
              chapter: st.name, chapter_index: st.index
            });
          }
        });
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // how far the visit got, reported once on leave
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden" && deepest > 0) {
        track("story_depth", { percent: Math.round(deepest * 100) });
        deepest = 0; // report once per reading session
      }
    });

    // the evidence clip
    var vid = rail.querySelector(".evidence-scene video");
    if (vid) {
      var played = false;
      vid.addEventListener("play", function () {
        if (played) return;
        played = true;
        track("video_play", { video: "park-hotel-lathi-charge" });
      });
    }
  }
})();
