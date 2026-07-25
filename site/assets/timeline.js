/* Renders site/data/timeline.json into the #timeline container, and lets the
   reader share any entry as a 1080x1080 PNG slide. The slide is drawn directly
   on a <canvas> with no third-party library, so it renders identically and
   reliably on every device (mobile included) and nothing leaves the browser. */
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

  /* wrap `text` into lines no wider than maxW at the canvas's current font */
  function wrapLines(ctx, text, maxW) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const trial = line ? line + " " + w : w;
      if (ctx.measureText(trial).width > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = trial;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  /* one 1080x1080 slide, drawn natively — no external renderer */
  function slideBlob(ev) {
    const S = 1080, PAD = 88, INNER = S - PAD * 2;
    const dpr = 2; // crisp on retina without depending on device
    const canvas = document.createElement("canvas");
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.textBaseline = "alphabetic";

    // background: dark radial, matching the site
    const g = ctx.createRadialGradient(S * 0.3, 0, 0, S * 0.3, 0, S * 1.05);
    g.addColorStop(0, "#0e1620");
    g.addColorStop(0.7, "#070a0e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    const SANS = "'Helvetica Neue',Arial,sans-serif";
    const SERIF = "Georgia,'Times New Roman',serif";

    // --- header: wordmark (left) + date (right) ---
    let y = PAD + 20;
    ctx.textAlign = "left";
    ctx.font = "800 26px " + SANS;
    const the = "THE ", un = "UN", badged = "BADGED";
    ctx.save();
    ctx.letterSpacing = "3px";
    let x = PAD;
    ctx.fillStyle = "#e8e3d8"; ctx.fillText(the, x, y); x += ctx.measureText(the).width + 3;
    ctx.fillStyle = "#c53b2c"; ctx.fillText(un, x, y); x += ctx.measureText(un).width + 3;
    ctx.fillStyle = "#e8e3d8"; ctx.fillText(badged, x, y);
    ctx.restore();

    ctx.save();
    ctx.letterSpacing = "0.5px";
    ctx.font = "600 19px " + SANS;
    ctx.fillStyle = "rgba(232,227,216,.6)";
    ctx.textAlign = "right";
    ctx.fillText(slideWhen(ev), S - PAD, y);
    ctx.restore();

    // --- status pill ---
    y += 62;
    const isCorrob = ev.status === "corroborated";
    const pillCol = isCorrob ? "#9fc4de" : "#c49a45";
    const pillBg = isCorrob ? "rgba(159,196,222,.16)" : "rgba(196,154,69,.16)";
    const label = String(ev.status || "unconfirmed").toUpperCase();
    ctx.save();
    ctx.font = "750 17px " + SANS;
    ctx.letterSpacing = "2px";
    const tw = ctx.measureText(label).width;
    const px = 18, ph = 34;
    ctx.fillStyle = pillBg;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(PAD, y - 24, tw + px * 2 + 2, ph, 99); ctx.fill(); }
    ctx.strokeStyle = pillCol; ctx.globalAlpha = 0.55;
    if (ctx.roundRect) { ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = pillCol; ctx.textAlign = "left";
    ctx.fillText(label, PAD + px, y);
    ctx.restore();

    // --- title (serif, wrapped) ---
    y += 60;
    ctx.fillStyle = "#f3ede2";
    ctx.font = "400 56px " + SERIF;
    ctx.textAlign = "left";
    const titleLines = wrapLines(ctx, ev.title, INNER);
    const titleLH = 68;
    for (const ln of titleLines) { ctx.fillText(ln, PAD, y); y += titleLH; }

    // --- description (wrapped, clamped to fit above the footer) ---
    y += 12;
    ctx.fillStyle = "rgba(232,227,216,.72)";
    ctx.font = "400 29px " + SANS;
    const descLH = 46;
    const footerTop = S - PAD - 150;
    const descLines = wrapLines(ctx, ev.description, INNER);
    const maxLines = Math.max(1, Math.floor((footerTop - y) / descLH));
    for (let i = 0; i < descLines.length && i < maxLines; i++) {
      let ln = descLines[i];
      if (i === maxLines - 1 && descLines.length > maxLines) {
        while (ctx.measureText(ln + "…").width > INNER && ln.length) ln = ln.slice(0, -1);
        ln += "…";
      }
      ctx.fillText(ln, PAD, y);
      y += descLH;
    }

    // --- footer: hairline + sources (left) + wordmark (right) ---
    const fy = S - PAD - 96;
    ctx.strokeStyle = "rgba(232,227,216,.14)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, fy); ctx.lineTo(S - PAD, fy); ctx.stroke();

    const sources = (ev.sources || []).map(s => s.outlet).join("   ·   ");
    let sy = fy + 34;
    if (sources) {
      ctx.fillStyle = "#7d8a97";
      ctx.font = "600 18px " + SANS;
      ctx.save(); ctx.letterSpacing = "1px";
      ctx.fillText("SOURCES", PAD, sy); ctx.restore();
      sy += 30;
      ctx.fillStyle = "rgba(232,227,216,.82)";
      ctx.font = "400 21px " + SANS;
      let sline = wrapLines(ctx, sources, INNER - 260)[0] || sources;
      while (ctx.measureText(sline).width > INNER - 260 && sline.length) sline = sline.slice(0, -1);
      ctx.fillText(sline === sources ? sources : sline + "…", PAD, sy);
    }

    ctx.fillStyle = "#c53b2c";
    ctx.font = "600 21px " + SANS;
    ctx.textAlign = "right";
    ctx.fillText("theunbadged.com", S - PAD, S - PAD - 4);

    return new Promise(r => canvas.toBlob(r, "image/png"));
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
