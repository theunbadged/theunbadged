/* Renders site/data/timeline.json into the #timeline container. */
(async function () {
  const el = document.getElementById("timeline");

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function whenLabel(ev) {
    if (ev.time) {
      const d = new Date(ev.time);
      // Force IST display regardless of viewer's timezone.
      const t = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
      }).format(d);
      return `${t} IST` + (ev.timeApprox ? " (approx.)" : "");
    }
    return ev.timeLabel || "Time unconfirmed";
  }

  try {
    const res = await fetch("/data/timeline.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const events = (data.events || []);

    if (!events.length) {
      el.innerHTML = '<p class="dim">No timeline entries published yet.</p>';
      return;
    }

    el.innerHTML = events.map(ev => `
      <article class="event">
        <div class="when">${esc(whenLabel(ev))}</div>
        <h3>${esc(ev.title)}
          <span class="status ${esc(ev.status)}">${esc(ev.status)}</span>
        </h3>
        <p>${esc(ev.description)}</p>
        <div class="sources">
          ${(ev.sources || []).map(s =>
            `<a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.outlet)}</a>`
          ).join("")}
        </div>
      </article>
    `).join("");
  } catch (err) {
    el.innerHTML = '<p class="dim">Could not load the timeline. Please refresh.</p>';
  }
})();
