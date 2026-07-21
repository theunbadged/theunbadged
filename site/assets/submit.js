/* Anonymous evidence submission.
   Small files (≤ 90 MB each) go through POST /api/submit in one multipart request.
   Larger files request a presigned direct-to-storage URL via /api/init-upload,
   then finalize with /api/finalize. No cookies, no analytics, no identifiers. */
(function () {
  const API = "/api";
  const SMALL_LIMIT = 90 * 1024 * 1024;      // through-worker limit
  const MAX_FILE = 2 * 1024 * 1024 * 1024;   // 2 GB per file

  const drop = document.getElementById("drop");
  const input = document.getElementById("files");
  const list = document.getElementById("filelist");
  const form = document.getElementById("f");
  const send = document.getElementById("send");
  const prog = document.getElementById("prog");
  const result = document.getElementById("result");

  let files = [];

  function fmtSize(n) {
    if (n > 1e9) return (n / 1e9).toFixed(2) + " GB";
    if (n > 1e6) return (n / 1e6).toFixed(1) + " MB";
    return Math.ceil(n / 1e3) + " KB";
  }

  function renderList() {
    list.innerHTML = files.map(f =>
      `<li><span class="fname">${f.name.replace(/[<>&]/g, "")}</span><span>${fmtSize(f.size)}</span></li>`
    ).join("");
  }

  function addFiles(fl) {
    for (const f of fl) {
      if (f.size > MAX_FILE) {
        show(false, `“${f.name}” is over 2 GB. Please split it (e.g. trim into parts) and submit again.`);
        continue;
      }
      files.push(f);
    }
    renderList();
  }

  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") input.click(); });
  input.addEventListener("change", () => addFiles(input.files));
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
  drop.addEventListener("drop", e => {
    e.preventDefault(); drop.classList.remove("drag");
    addFiles(e.dataTransfer.files);
  });

  function show(ok, msg) {
    result.className = "result " + (ok ? "ok" : "err");
    result.innerHTML = msg;
  }

  function fields() {
    return {
      description: document.getElementById("desc").value.trim(),
      location: document.getElementById("loc").value.trim(),
      when: document.getElementById("when").value,
      contact: document.getElementById("contact").value.trim()
    };
  }

  function putWithProgress(url, file, onPct) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = e => { if (e.lengthComputable) onPct(e.loaded / e.total); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("upload " + xhr.status));
      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(file);
    });
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!files.length) { show(false, "Please attach at least one file."); return; }

    send.disabled = true;
    prog.hidden = false;
    prog.value = 0;
    result.className = "result";

    const small = files.filter(f => f.size <= SMALL_LIMIT);
    const large = files.filter(f => f.size > SMALL_LIMIT);
    const totalBytes = files.reduce((a, f) => a + f.size, 0);
    let doneBytes = 0;
    const bump = (pct, size) => { prog.value = Math.round(((doneBytes + pct * size) / totalBytes) * 100); };

    try {
      let ref = null;
      let token = null;
      const largeKeys = [];

      // Large files: presigned direct upload.
      for (const f of large) {
        const init = await fetch(API + "/init-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: f.name, size: f.size, type: f.type, ref })
        });
        if (init.status === 503) {
          throw new Error("Large-file uploads are temporarily unavailable. Files over 90 MB: please trim into shorter parts and try again — or submit the smaller files now.");
        }
        if (!init.ok) throw new Error("could not start upload");
        const { url, key, ref: r, token: t } = await init.json();
        ref = ref || r;
        token = token || t;
        await putWithProgress(url, f, pct => bump(pct, f.size));
        doneBytes += f.size;
        largeKeys.push({ key, name: f.name, size: f.size, type: f.type });
      }

      // Small files: one multipart request through the worker.
      if (small.length) {
        const fd = new FormData();
        fd.append("fields", JSON.stringify(fields()));
        if (ref) fd.append("ref", ref);
        for (const f of small) fd.append("files", f, f.name);
        const res = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", API + "/submit");
          xhr.upload.onprogress = ev => {
            if (ev.lengthComputable) bump(ev.loaded / ev.total, small.reduce((a, f) => a + f.size, 0));
          };
          xhr.onload = () => resolve(xhr);
          xhr.onerror = () => reject(new Error("network error"));
          xhr.send(fd);
        });
        if (res.status < 200 || res.status >= 300) throw new Error("submit failed (" + res.status + ")");
        const out = JSON.parse(res.responseText);
        ref = ref || out.ref;
        token = token || out.token;
        doneBytes += small.reduce((a, f) => a + f.size, 0);
      }

      // Finalize metadata for presigned uploads.
      if (largeKeys.length) {
        const fin = await fetch(API + "/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref, keys: largeKeys, fields: fields() })
        });
        if (!fin.ok) throw new Error("finalize failed");
      }

      prog.value = 100;
      show(true,
        `<strong>Received. Thank you — this matters.</strong><br><br>
         Your claim code: <code>${token || "—"}</code><br>
         <span class="small">This code is shown only once and only you have it —
         we keep just a fingerprint of it. If you filmed this footage and ever
         choose to come forward (for example, so it can be certified as evidence
         in court), this code proves the submission is yours. Write it somewhere
         safe that isn't your phone. If you never want any link to this
         submission, simply don't keep it — nothing else connects you to it.</span>`);
      form.reset(); files = []; renderList();
    } catch (err) {
      show(false, "Submission failed: " + err.message +
        "<br>Nothing was logged. You can safely try again.");
    } finally {
      send.disabled = false;
      setTimeout(() => { prog.hidden = true; }, 1500);
    }
  });
})();
