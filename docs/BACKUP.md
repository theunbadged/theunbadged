# Vault backup — encrypted off-site replica

The vault (`vault/`, local + write-once) is replicated **encrypted** to Google
Cloud Storage in the Netherlands (europe-west4 — off-India jurisdiction, per
the threat model). restic encrypts client-side: Google only ever holds
ciphertext.

## Layout
- GCP project: `unbadged-vault-38608` (dedicated). **Billing migration
  pending:** currently on the operator's personal Google account; move to the
  project (anon) identity as part of the deanonymization sweep so the backup
  is not linkable to the operator via billing records.
- Bucket: `gs://unbadged-vault-38608-evidence` (uniform access, public-access
  prevention ON)
- restic repo: `gs:unbadged-vault-38608-evidence:/restic`
- Service account: `vault-backup@unbadged-vault-38608.iam.gserviceaccount.com`
  (scoped to this bucket only)
- Credentials + password: `~/.config/unbadged/` (backup-env.sh, restic
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
