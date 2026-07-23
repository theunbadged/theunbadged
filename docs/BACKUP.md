# Vault backup — encrypted off-site replica

The vault (`vault/`, local + write-once) is replicated **encrypted** to Google
Cloud Storage in the Netherlands (europe-west4 — off-India jurisdiction, per
the threat model). restic encrypts client-side: Google only ever holds
ciphertext.

## Architecture
- Provider: Google Cloud Storage, region europe-west4 (Netherlands),
  chosen for off-India jurisdiction per the threat model.
- A dedicated GCP project and a single private bucket (uniform access,
  public-access prevention ON) hold the restic repository.
- Access is via a service account scoped to that bucket only.
- Specific project / bucket / service-account identifiers are operational
  and are **not** published here; they live in the operator's local ops
  note, not in this repo.
- Credentials + restic password: `~/.config/unbadged/` (backup-env.sh, restic
  password file, SA key). **NEVER commit. Outside the repo by design.**

## CRITICAL — the restic password
`~/.config/unbadged/restic-password.txt`. Losing it means the backup is
**irrecoverably lost** (that is the point of client-side encryption). Copy it
to a password manager and one offline location today.

## Run a backup (after each ingest)
```bash
source ~/.config/unbadged/backup-env.sh
restic backup "$UNBADGED_REPO/vault/" --tag manual   # $UNBADGED_REPO = repo checkout
restic snapshots        # list
restic check            # verify integrity
```

## Restore (disaster)
```bash
source ~/.config/unbadged/backup-env.sh
restic restore latest --target /some/rebuild/path
```

## Status at Phase 1
Snapshot `feb81269` — 949.9 MiB (70 files), verified, 0 errors.
Retention to configure later: `restic forget --keep-daily 7 --keep-weekly 8 --prune`.
