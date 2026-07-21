# The Unbadged

A citizen evidence archive documenting the 21 July 2026 Delhi Police crackdown
on student protesters — built to preserve court-grade evidence where it cannot
be taken down, make the pattern publicly visible without endangering anyone,
and route accountability through the legal process.

They removed the badges. We keep the record.

## What this is

- A **secure evidence vault**: originals hashed on intake (SHA-256), metadata
  intact, never re-touched, redundantly stored — restricted to a legal team.
- A **public redacted repository**: derived copies only, faces blurred by
  default, every item carrying a status label — *claimed → corroborated →
  court-ready*.
- A **legal handoff pipeline**: chain-of-custody export packages in PIL /
  NHRC-complaint format.

## What this is not

- **Not facial recognition.** We never extract faces and search them against
  databases. Officers are identified only by markers visible in footage —
  badge number, name plate, unit markings, vehicle plate — or by corroborated
  witness testimony. Badge concealment is itself logged as evidence.
- **Not a public trial.** We document incidents; courts declare guilt. Nothing
  is published as fact before verification, and no individual is publicly
  named as guilty before adjudication.
- **Not a rumor mill.** Footage is verified before amplification — including
  footage that favors our side.

## Repository layout

- [site/](site/) — the public website (static: about, timeline, submit form)
- [intake-worker/](intake-worker/) — Cloudflare Worker receiving anonymous
  submissions into a transient R2 mailbox. Built to never log IPs.
- [tools/ingest.py](tools/ingest.py) — vault ingestion: SHA-256 on intake,
  write-once content-addressed storage, append-only hash-chained custody
  ledger, fixity checks. All timestamps IST.
- [CONTEXT.md](CONTEXT.md) — full charter: principles, architecture, build plan
- [docs/threat-model.md](docs/threat-model.md) — adversaries, assets, mitigations
- [docs/research/chain-of-custody.md](docs/research/chain-of-custody.md) —
  what Indian law (BSA s.63, case law) and the Berkeley Protocol require, and
  how this system implements it
- [docs/decisions/](docs/decisions/) — decision log (settled and open)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deploy runbook + privacy invariants

## Why open source

An evidence archive's credibility rests on its process being auditable. The
code shows exactly how submissions are received (no IP logging), how originals
are preserved (hash-chained custody ledger), and how public copies are
redacted. Verify it yourself.

## Status

Phase 1 live: anonymous intake + vault + public timeline. Verification
workflow and redacted evidence gallery are next — see the build plan in
[CONTEXT.md](CONTEXT.md).
