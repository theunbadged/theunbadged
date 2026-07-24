#!/usr/bin/env python3
"""
The Unbadged — local vault browser (operator only).

Generates a single static HTML page (vault/browse.html) for browsing what has
been submitted: one section per submission with its declared description,
location, time and files, plus every non-webform intake from the ledger.

Read-only by design:
  * originals are never opened for writing, moved, or re-encoded; the page
    references them by relative path so the browser streams them in place;
  * the output lives INSIDE the vault directory, which is gitignored, so
    neither the page nor anything it embeds can enter the public repo;
  * all submitter-provided text is HTML-escaped before rendering.

Usage:  python tools/vault_browser.py          # writes vault/browse.html
"""

import html
import json
import os
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
VAULT = Path(os.environ.get("UNBADGED_VAULT", REPO / "vault"))
ORIGINALS = VAULT / "originals"
SUBMISSIONS = VAULT / "submissions"
LEDGER = VAULT / "ledger.jsonl"
OUT = VAULT / "browse.html"

IMG = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}
VID = {".mp4", ".mov", ".webm", ".mkv", ".avi"}
AUD = {".m4a", ".mp3", ".ogg", ".wav", ".aac", ".opus"}


def e(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


def load_ledger():
    """sha256 -> latest intake entry; list of non-webform intakes."""
    by_sha, local = {}, []
    if not LEDGER.exists():
        return by_sha, local
    with LEDGER.open(encoding="utf-8") as fh:
        for raw in fh:
            raw = raw.strip()
            if not raw:
                continue
            try:
                entry = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if entry.get("type") != "intake":
                continue
            by_sha[entry.get("sha256")] = entry
            if not entry.get("submission"):
                local.append(entry)
    return by_sha, local


def vault_file(sha: str, by_sha: dict) -> Path | None:
    entry = by_sha.get(sha)
    if entry and entry.get("vault_name"):
        p = ORIGINALS / entry["vault_name"]
        if p.exists():
            return p
    hits = list(ORIGINALS.glob(f"{sha}.*")) if ORIGINALS.exists() else []
    return hits[0] if hits else None


def media_tag(path: Path, alt: str) -> str:
    rel = e(f"originals/{path.name}")
    ext = path.suffix.lower()
    if ext in IMG:
        return f'<a href="{rel}" target="_blank"><img loading="lazy" src="{rel}" alt="{e(alt)}"></a>'
    if ext in VID:
        return f'<video controls preload="none" src="{rel}"></video>'
    if ext in AUD:
        return f'<audio controls preload="none" src="{rel}"></audio>'
    return f'<a class="file" href="{rel}" target="_blank">open {e(path.name[:24])}…</a>'


def fmt_size(n) -> str:
    try:
        n = int(n)
    except (TypeError, ValueError):
        return ""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n/1.0:.1f} {unit}"
        n /= 1024
    return ""


def meta_row(label: str, value: str, cls: str = "") -> str:
    if not value:
        return ""
    return f'<div class="row {cls}"><span class="k">{e(label)}</span><span class="v">{e(value)}</span></div>'


def render_submission(sub_dir: Path, by_sha: dict) -> tuple[str, int]:
    rec_path = sub_dir / "record.json"
    if not rec_path.exists():
        return "", 0
    rec = json.loads(rec_path.read_text(encoding="utf-8"))
    sid = sub_dir.name
    files = rec.get("ingested", [])
    cards = []
    for f in files:
        sha = f.get("sha256", "")
        p = vault_file(sha, by_sha)
        led = by_sha.get(sha, {})
        if p:
            tag = media_tag(p, led.get("original_name") or sha[:12])
        else:
            tag = '<span class="missing">file missing from originals/</span>'
        sniff = led.get("sniff") or ""
        sniff_html = f'<span class="sniff {"warn" if sniff == "unknown" else ""}">{e(sniff)}</span>' if sniff else ""
        cards.append(
            f'<figure>{tag}<figcaption>{e(led.get("original_name") or "(unnamed)")} '
            f'· {fmt_size(led.get("size"))} {sniff_html}'
            f'<span class="sha">{e(sha[:16])}…</span></figcaption></figure>'
        )
    body = (
        f'<details class="sub" id="{e(sid)}"><summary>'
        f'<b>{e(rec.get("receivedAt") or rec.get("vaulted_at") or "?")}</b>'
        f' · {len(files)} file(s)'
        f' · <span class="sid">{e(sid[:12])}…</span>'
        f'{" · <span class=contact>has contact</span>" if rec.get("contact") else ""}'
        f"</summary>"
        + meta_row("What it shows", rec.get("description") or rec.get("desc"))
        + meta_row("Where", rec.get("location") or rec.get("loc"))
        + meta_row("When (declared)", rec.get("when"))
        + meta_row("Contact (restricted)", rec.get("contact"), "restricted")
        + meta_row("Channel", rec.get("channel"))
        + meta_row("Vaulted", rec.get("vaulted_at"))
        + f'<div class="media">{"".join(cards)}</div></details>'
    )
    return body, len(files)


def main() -> None:
    by_sha, local = load_ledger()
    subs_html, sub_count, file_count = [], 0, 0
    if SUBMISSIONS.exists():
        for sub_dir in sorted(SUBMISSIONS.iterdir(), reverse=True):
            if not sub_dir.is_dir():
                continue
            block, n = render_submission(sub_dir, by_sha)
            if block:
                subs_html.append(block)
                sub_count += 1
                file_count += n

    local_html = []
    for entry in reversed(local):
        p = ORIGINALS / entry.get("vault_name", "")
        tag = media_tag(p, entry.get("original_name") or "") if p.exists() else \
            '<span class="missing">file missing</span>'
        note = f' · {e(entry["note"])}' if entry.get("note") else ""
        local_html.append(
            f'<figure>{tag}<figcaption>{e(entry.get("original_name") or "(unnamed)")}'
            f' · {e(entry.get("channel") or "")} · {fmt_size(entry.get("size"))}{note}'
            f'<span class="sha">{e((entry.get("sha256") or "")[:16])}…</span></figcaption></figure>'
        )

    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vault browser (local only) · The Unbadged</title>
<style>
  body {{ margin:0; background:#0a0d11; color:#e8e3d8; font:15px/1.6 "Segoe UI",Arial,sans-serif; padding:2rem clamp(1rem,4vw,3rem); }}
  h1 {{ font:400 1.7rem Georgia,serif; }} h1 b {{ color:#c53b2c; }}
  .note {{ color:#9aa3ad; font-size:.85rem; max-width:44rem; }}
  h2 {{ font:400 1.2rem Georgia,serif; margin-top:2.5rem; border-top:1px solid rgba(232,227,216,.15); padding-top:1.5rem; }}
  details.sub {{ border:1px solid rgba(232,227,216,.15); background:rgba(15,20,26,.7); margin:.7rem 0; padding:.2rem .9rem; }}
  summary {{ cursor:pointer; padding:.55rem 0; }}
  .sid {{ color:#7e9bb2; font-family:monospace; }}
  .contact {{ color:#c49a45; font-weight:600; }}
  .row {{ display:flex; gap:1rem; margin:.3rem 0; }} .row .k {{ flex:0 0 9.5rem; color:#7d8a97; font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; padding-top:.15rem; }}
  .row.restricted .v {{ color:#c49a45; }}
  .media {{ display:flex; flex-wrap:wrap; gap:.9rem; margin:.9rem 0 .7rem; }}
  figure {{ margin:0; max-width:270px; }}
  img, video {{ max-width:270px; max-height:210px; display:block; border:1px solid rgba(232,227,216,.2); background:#000; }}
  audio {{ width:270px; }}
  figcaption {{ font-size:.72rem; color:#9aa3ad; margin-top:.3rem; word-break:break-all; }}
  .sha {{ display:block; font-family:monospace; opacity:.65; }}
  .sniff {{ color:#6fae7c; }} .sniff.warn {{ color:#c49a45; }}
  .missing {{ color:#c0564f; }}
  .file {{ color:#9fc4de; }}
  a {{ color:#9fc4de; }}
</style></head><body>
<h1>THE <b>UN</b>BADGED · vault browser</h1>
<p class="note">Local, operator-only view. This file lives inside the gitignored
vault and must never be published or copied out of it. Previews stream the
write-once originals in place; nothing here modifies the vault. Contact fields
are restricted-tier: handle accordingly.</p>
<h2>Web submissions ({sub_count}, {file_count} files)</h2>
{"".join(subs_html) or '<p class="note">none</p>'}
<h2>Direct intakes: captures, Signal, local ({len(local_html)})</h2>
<div class="media">{"".join(local_html) or '<p class="note">none</p>'}</div>
</body></html>"""

    OUT.write_text(page, encoding="utf-8")
    print(f"wrote {OUT}")
    print(f"  submissions: {sub_count} ({file_count} files) · direct intakes: {len(local_html)}")


if __name__ == "__main__":
    main()
