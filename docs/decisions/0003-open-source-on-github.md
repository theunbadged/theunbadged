# 0003 — Code is open source, hosted on GitHub

**Status:** Accepted (2026-07-21).

## Context

Initial instinct was to keep even the repo location undecided pending the
hosting-jurisdiction question. But that question applies to the *evidence
data*, not the *code*.

## Decision

- The platform code (intake tooling, redaction pipeline, public site,
  export packager) is open source, developed on GitHub.
- Evidence — originals, derivatives, ledgers with submitter-adjacent
  metadata — never enters this or any git repository (enforced by
  .gitignore, restated in CLAUDE.md).
- The redacted public *dataset* may later get its own repo as a
  distribution/mirroring mechanism — separate decision when Phase 3 arrives.

## Consequences

- Process auditability becomes a credibility asset: anyone can verify how
  hashing, chain of custody, and redaction work.
- Forks are free mirrors of the platform; takedown of one repo costs nothing.
- Hosting jurisdiction (O-2) narrows to: vault storage + public-tier serving
  + onion service. Code hosting is settled.
- Timing of making the repo public (day one vs. at launch) is an operational
  choice, not an architectural one.
