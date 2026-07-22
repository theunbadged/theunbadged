#!/usr/bin/env python3
"""
The Unbadged — vault ingestion.

Pulls submissions from the R2 intake mailbox (or takes local files received
via Signal/etc.) into the write-once evidence vault with an append-only,
hash-chained custody ledger.

Chain-of-custody rules enforced here (see docs/research/chain-of-custody.md):
  * SHA-256 is computed on the byte stream BEFORE the file is placed in the
    vault; the vault filename IS the hash (content-addressed).
  * Originals are write-once: an existing vault object is never overwritten;
    files are marked read-only after placement.
  * Every action (intake, duplicate, fixity check) is a ledger line. Ledger
    lines are never edited; each line carries the SHA-256 of the previous
    line, so any tampering breaks the chain.
  * All timestamps are IST (Asia/Kolkata), ISO-8601 with explicit offset,
    taken from this machine's clock.

Usage:
  python tools/ingest.py pull                     # drain R2 mailbox into vault
  python tools/ingest.py file <path> [--via signal] [--note "..."]
  python tools/ingest.py verify                   # fixity re-check of vault

R2 credentials (pull mode) come from environment or a .env file next to the
repo root: R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
Use a token scoped to read+delete on the intake bucket only.
"""

import argparse
import hashlib
import json
import os
import stat
import sys
import tempfile
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TOOL = "ingest.py/0.1.0"
IST = ZoneInfo("Asia/Kolkata")
REPO = Path(__file__).resolve().parent.parent
VAULT = Path(os.environ.get("UNBADGED_VAULT", REPO / "vault"))
ORIGINALS = VAULT / "originals"
SUBMISSIONS = VAULT / "submissions"
LEDGER = VAULT / "ledger.jsonl"
# Custodian recorded in each ledger line. Default is the project identity so
# no operator name is baked into new entries or the public tooling. For a
# court-grade chain of custody a real, testifiable custodian may be required:
# set UNBADGED_CUSTODIAN in the local environment to that sealed identity;
# it never lives in the repo. (Past ledger lines are immutable by design and
# are not rewritten — that would break the hash chain.)
CUSTODIAN = os.environ.get("UNBADGED_CUSTODIAN", "The Unbadged (custodian on file)")
CHUNK = 4 * 1024 * 1024


def now_ist() -> str:
    return datetime.now(IST).isoformat(timespec="seconds")


def load_dotenv() -> None:
    env = REPO / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


# ---------- ledger ----------

def _last_line_hash() -> str:
    if not LEDGER.exists():
        return "GENESIS"
    last = None
    with LEDGER.open("rb") as fh:
        for raw in fh:
            if raw.strip():
                last = raw.strip()
    return hashlib.sha256(last).hexdigest() if last else "GENESIS"


def ledger_append(entry: dict) -> dict:
    """Append one immutable line; chains to the previous line's hash."""
    VAULT.mkdir(parents=True, exist_ok=True)
    seq = 0
    if LEDGER.exists():
        with LEDGER.open("rb") as fh:
            seq = sum(1 for raw in fh if raw.strip())
    entry = {
        "seq": seq + 1,
        "ts": now_ist(),
        "custodian": CUSTODIAN,
        "tool": TOOL,
        "prev": _last_line_hash(),
        **entry,
    }
    with LEDGER.open("a", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")
    return entry


# ---------- hashing / placement ----------

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while chunk := fh.read(CHUNK):
            h.update(chunk)
    return h.hexdigest()


def make_read_only(path: Path) -> None:
    os.chmod(path, stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)


def place_original(tmp: Path, digest: str, ext: str, meta: dict) -> dict:
    """Move a fully-hashed temp file into the content-addressed vault."""
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    dest = ORIGINALS / f"{digest}{ext}"
    if dest.exists():
        tmp.unlink(missing_ok=True)
        return ledger_append({"type": "duplicate", "sha256": digest, **meta,
                              "note": f"already in vault as {dest.name}; new copy discarded"})
    os.replace(tmp, dest)
    make_read_only(dest)
    return ledger_append({"type": "intake", "sha256": digest,
                          "vault_name": dest.name, **meta})


def safe_ext(name: str) -> str:
    suffix = Path(name or "").suffix.lower()
    return suffix if suffix and len(suffix) <= 9 and suffix[1:].isalnum() else ".bin"


# ---------- local file intake ----------

def temp_in_vault() -> Path:
    fd, p = tempfile.mkstemp(dir=str(VAULT_TMP()))
    os.close(fd)  # Windows: an open fd blocks the later os.replace
    return Path(p)


def ingest_local(path: Path, via: str, note: str) -> None:
    if not path.is_file():
        sys.exit(f"not a file: {path}")
    size = path.stat().st_size
    digest = sha256_file(path)  # hash FIRST, before any copy
    tmp = temp_in_vault()
    # copy stream + re-hash to guarantee vault bytes == hashed bytes
    h = hashlib.sha256()
    with path.open("rb") as src, tmp.open("wb") as dst:
        while chunk := src.read(CHUNK):
            h.update(chunk)
            dst.write(chunk)
    if h.hexdigest() != digest:
        tmp.unlink(missing_ok=True)
        sys.exit("file changed while copying; aborted, nothing vaulted")
    entry = place_original(tmp, digest, safe_ext(path.name), {
        "size": size,
        "original_name": path.name,
        "channel": via,
        "source_path": str(path),
        "note": note,
    })
    print(f"[{entry['type']}] {digest[:12]}…  seq={entry['seq']}  {path.name}")


def VAULT_TMP() -> Path:
    p = VAULT / ".incoming"
    p.mkdir(parents=True, exist_ok=True)
    return p


# ---------- R2 mailbox drain ----------

def r2_client():
    try:
        import boto3
    except ImportError:
        sys.exit("pull mode needs boto3:  pip install boto3")
    for key in ("R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"):
        if not os.environ.get(key):
            sys.exit(f"missing env var {key} (set it in .env)")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def pull(keep: bool = False) -> None:
    s3 = r2_client()
    bucket = os.environ["R2_BUCKET"]

    keys = []
    token = None
    while True:
        kw = {"Bucket": bucket, "Prefix": "sub/"}
        if token:
            kw["ContinuationToken"] = token
        resp = s3.list_objects_v2(**kw)
        keys += [o["Key"] for o in resp.get("Contents", [])]
        if not resp.get("IsTruncated"):
            break
        token = resp["NextContinuationToken"]

    subs = {}
    for k in keys:
        parts = k.split("/")
        if len(parts) >= 3:
            subs.setdefault(parts[1], []).append(k)

    if not subs:
        print("mailbox empty")
        return

    for sub_id, sub_keys in sorted(subs.items()):
        meta_key = f"sub/{sub_id}/meta.json"
        if meta_key not in sub_keys:
            print(f"skip {sub_id}: no meta.json yet (upload may be in progress)")
            continue

        meta = json.loads(s3.get_object(Bucket=bucket, Key=meta_key)["Body"].read())
        token_doc = {}
        token_key = f"sub/{sub_id}/token.json"
        if token_key in sub_keys:
            token_doc = json.loads(s3.get_object(Bucket=bucket, Key=token_key)["Body"].read())

        # vault the submission record itself (contains contact info — restricted tier)
        sub_dir = SUBMISSIONS / sub_id
        sub_dir.mkdir(parents=True, exist_ok=True)
        record = {**meta, "tokenHash": token_doc.get("tokenHash"),
                  "vaulted_at": now_ist()}

        ingested = []
        for k in sub_keys:
            leaf = k.split("/")[-1]
            if not leaf.startswith("f-"):
                continue
            tmp = temp_in_vault()
            h = hashlib.sha256()
            size = 0
            body = s3.get_object(Bucket=bucket, Key=k)["Body"]
            with tmp.open("wb") as dst:
                for chunk in iter(lambda: body.read(CHUNK), b""):
                    h.update(chunk)
                    size += len(chunk)
                    dst.write(chunk)
            digest = h.hexdigest()
            declared = next((f for f in meta.get("files", []) if f.get("key") == k), {})
            entry = place_original(tmp, digest, safe_ext(declared.get("originalName") or leaf), {
                "size": size,
                "original_name": declared.get("originalName"),
                "declared_type": declared.get("type"),
                "sniff": declared.get("sniff"),  # worker's magic-byte verdict; "unknown" = triage
                "channel": meta.get("channel", "webform"),
                "submission": sub_id,
                "uploaded_at": meta.get("receivedAt"),
                "token_hash": token_doc.get("tokenHash"),
                "r2_key": k,
            })
            ingested.append({"r2_key": k, "sha256": digest, "ledger_seq": entry["seq"]})
            print(f"[{entry['type']}] {digest[:12]}…  seq={entry['seq']}  sub={sub_id[:8]}")

        record["ingested"] = ingested
        rec_path = sub_dir / "record.json"
        if rec_path.exists():
            # write-once: a record vaulted by an earlier (possibly interrupted)
            # run is never rewritten; the ledger carries any re-pull as duplicates
            print(f"submission {sub_id[:8]}… record already vaulted; keeping original")
        else:
            rec_path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
            make_read_only(rec_path)

        # only after everything is safely vaulted: empty the mailbox
        # (--keep skips this, for tokens without delete permission; safe to
        # re-run later — duplicates are detected by hash and discarded)
        if keep:
            print(f"submission {sub_id[:8]}… vaulted ({len(ingested)} file(s)), left in mailbox (--keep)")
        else:
            for k in sub_keys:
                s3.delete_object(Bucket=bucket, Key=k)
            print(f"submission {sub_id[:8]}… vaulted ({len(ingested)} file(s)), mailbox cleared")


# ---------- fixity ----------

def verify() -> None:
    if not ORIGINALS.exists():
        print("vault empty")
        return
    bad = 0
    checked = 0
    for f in sorted(ORIGINALS.iterdir()):
        if not f.is_file():
            continue
        checked += 1
        expected = f.name.split(".")[0]
        actual = sha256_file(f)
        ok = actual == expected
        bad += 0 if ok else 1
        ledger_append({"type": "fixity", "sha256": expected, "vault_name": f.name,
                       "result": "ok" if ok else f"MISMATCH:{actual}"})
        if not ok:
            print(f"!! FIXITY FAILURE: {f.name} now hashes to {actual}")
    print(f"fixity: {checked} checked, {bad} failures")
    if bad:
        sys.exit(1)


# ---------- main ----------

def main() -> None:
    load_dotenv()
    ap = argparse.ArgumentParser(description="The Unbadged vault ingestion")
    sub = ap.add_subparsers(dest="cmd", required=True)
    pp = sub.add_parser("pull", help="drain the R2 intake mailbox into the vault")
    pp.add_argument("--keep", action="store_true",
                    help="vault everything but leave the mailbox untouched "
                         "(for read-only tokens; re-runs dedupe by hash)")
    pf = sub.add_parser("file", help="ingest a locally received file")
    pf.add_argument("path", type=Path)
    pf.add_argument("--via", default="local", help="channel (signal/local/...)")
    pf.add_argument("--note", default="", help="custody note, e.g. who handed it over")
    sub.add_parser("verify", help="re-hash every vault original (fixity check)")
    args = ap.parse_args()

    if args.cmd == "pull":
        pull(keep=args.keep)
    elif args.cmd == "file":
        ingest_local(args.path, args.via, args.note)
    elif args.cmd == "verify":
        verify()


if __name__ == "__main__":
    main()
