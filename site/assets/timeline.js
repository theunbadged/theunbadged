/* Renders site/data/timeline.json into the #timeline container, and lets the
   reader export any entry (or all of them) as 1080x1080 PNG slides for
   sharing. Libraries are vendored locally (assets/vendor/), never loaded from
   a third party at runtime; nothing leaves the browser (slides are built
   client-side and saved via a local download). */
(async function () {
  const el = document.getElementById("timeline");

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function whenLabel(ev) {
    // Force IST display regardless of viewer's timezone.
    const day = ev.date
      ? new Intl.DateTimeFormat("en-IN", {
          weekday: "short", day: "numeric", month: "short",
          timeZone: "Asia/Kolkata"
        }).format(new Date(ev.date + "T12:00:00+05:30"))
      : "";
    if (ev.time) {
      const t = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
      }).format(new Date(ev.time));
      return `${day} · ${t} IST (as timestamped by the cited outlet)`;
    }
    return `${day} · ${ev.timeLabel || "time unconfirmed"}`;
  }

  // shorter label for the slide chip (no parenthetical)
  function slideWhen(ev) {
    const day = ev.date
      ? new Intl.DateTimeFormat("en-IN", {
          day: "numeric", month: "short", timeZone: "Asia/Kolkata"
        }).format(new Date(ev.date + "T12:00:00+05:30"))
      : "";
    if (ev.time) {
      const t = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
      }).format(new Date(ev.time));
      return `${day} · ${t} IST`;
    }
    return `${day} · ${ev.timeLabel || "time unconfirmed"}`;
  }

  /* vendored-only loader: refuses any non-local source */
  function loadLocalScript(src, globalName) {
    if (!src.startsWith("/assets/vendor/")) {
      return Promise.reject(new Error("refused non-vendored script: " + src));
    }
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(window[globalName]);
      s.onerror = () => reject(new Error("failed to load " + src));
      document.head.appendChild(s);
    });
  }

  /* one 1080x1080 slide, styled to the site's identity */
  async function slideBlob(ev) {
    const html2canvas = await loadLocalScript("/assets/vendor/html2canvas.min.js", "html2canvas");

    const isCorrob = ev.status === "corroborated";
    const statusStyle = isCorrob
      ? "background:rgba(159,196,222,.16);color:#9fc4de;border:1px solid rgba(159,196,222,.5);"
      : "background:rgba(196,154,69,.16);color:#c49a45;border:1px solid rgba(196,154,69,.55);";
    const sources = (ev.sources || []).map(s => esc(s.outlet)).join("  ·  ");
    const mediaCount = (ev.media || []).length;

    const box = document.createElement("div");
    box.style.cssText =
      "position:absolute;left:-9999px;top:-9999px;width:1080px;height:1080px;" +
      "box-sizing:border-box;padding:88px;background:radial-gradient(ellipse at 30% 0%,#0e1620 0%,#070a0e 70%);" +
      "color:#e8e3d8;font-family:Georgia,'Times New Roman',serif;";
    box.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:56px;">
            <span style="font:800 26px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#e8e3d8;">
              THE <span style="color:#c53b2c;">UN</span>BADGED
            </span>
            <span style="font:600 19px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:.5px;color:rgba(232,227,216,.6);">
              ${esc(slideWhen(ev))}
            </span>
          </div>
          <div style="margin-bottom:30px;">
            <span style="font:750 17px/1.3 'Helvetica Neue',Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;padding:8px 18px;border-radius:99px;${statusStyle}">
              ${esc(ev.status || "unconfirmed")}
            </span>
          </div>
          <h1 style="font-size:56px;font-weight:400;line-height:1.22;margin:0 0 34px 0;color:#f3ede2;">
            ${esc(ev.title)}
          </h1>
          <p style="font-size:29px;line-height:1.6;color:rgba(232,227,216,.72);margin:0;display:-webkit-box;-webkit-line-clamp:7;-webkit-box-orient:vertical;overflow:hidden;">
            ${esc(ev.description)}
          </p>
        </div>
        <div style="border-top:1px solid rgba(232,227,216,.14);padding-top:34px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;">
          <div style="min-width:0;">
            ${sources ? `<div style="font:600 18px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#7d8a97;margin-bottom:10px;">Sources</div>
              <div style="font-size:22px;color:rgba(232,227,216,.82);">${sources}</div>` : ""}
            ${mediaCount ? `<div style="font:500 18px/1 'Helvetica Neue',Arial,sans-serif;color:#9fc4de;margin-top:12px;">Includes ${mediaCount} media attachment(s), civilian faces blurred</div>` : ""}
          </div>
          <div style="font:600 21px/1 'Helvetica Neue',Arial,sans-serif;color:#c53b2c;white-space:nowrap;">theunbadged.com</div>
        </div>
      </div>`;
    document.body.appendChild(box);
    try {
      const canvas = await html2canvas(box, { width: 1080, height: 1080, scale: 1, backgroundColor: "#070a0e" });
      return await new Promise(r => canvas.toBlob(r, "image/png"));
    } finally {
      document.body.removeChild(box);
    }
  }

  function saveBlob(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // If the device supports the native share sheet with files, offer it;
  // otherwise fall back to a download. Either way the slide is built locally.
  async function shareOrSaveOne(ev, filename, btn) {
    btn.classList.add("busy"); btn.disabled = true;
    try {
      const blob = await slideBlob(ev);
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "The Unbadged" });
          return;
        } catch (e) {
          if (e && e.name === "AbortError") return; // user dismissed the sheet
        }
      }
      saveBlob(blob, filename);
    } catch (e) {
      console.error(e); alert("Could not create the image.");
    } finally {
      btn.classList.remove("busy"); btn.disabled = false;
    }
  }

  var SHARE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';

  try {
    const res = await fetch("/data/timeline.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // newest first; the data file stays chronological
    const events = (data.events || []).slice().reverse();

    if (!events.length) {
      el.innerHTML = '<p class="dim">No timeline entries published yet.</p>';
      return;
    }

    el.innerHTML = events.map((ev, idx) => `
      <article class="event${ev.action ? " has-action" : ""}">
        <div class="event-main">
          <div class="event-head">
            <div class="when">${esc(whenLabel(ev))}</div>
            <button class="tl-share" type="button" data-index="${idx}"
              aria-label="Share this entry as an image" title="Share as image">${SHARE_SVG}</button>
          </div>
          <h3>${esc(ev.title)}
            <span class="status ${esc(ev.status)}">${esc(ev.status)}</span>
          </h3>
          <p>${esc(ev.description)}</p>
          ${(ev.media || []).length ? `<div class="ev-media">
            ${ev.media.map(m => `
              <figure class="ev">
                <img loading="lazy" src="${esc(m.src)}" alt="${esc(m.caption)}"
                     onerror="this.closest('figure').style.display='none'">
                <figcaption>${esc(m.caption)}<span>${esc(m.credit || "")}</span></figcaption>
              </figure>`).join("")}
          </div>` : ""}
          <div class="sources">
            ${(ev.sources || []).map(s =>
              `<a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.outlet)}</a>`
            ).join("")}
          </div>
        </div>
        ${ev.action ? `<aside class="event-action">
          <p class="tag">Help the record</p>
          <p>${esc(ev.action)}</p>
          <a href="/submit.html">Submit anonymously →</a>
        </aside>` : ""}
      </article>
    `).join("");

    el.querySelectorAll(".tl-share").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-index"));
        shareOrSaveOne(events[i], `unbadged-slide-${String(i + 1).padStart(2, "0")}.png`, btn);
      });
    });
  } catch (err) {
    el.innerHTML = '<p class="dim">Could not load the timeline. Please refresh.</p>';
  }
})();
