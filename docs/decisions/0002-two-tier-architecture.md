# 0002 — Two-tier architecture: restricted vault + redacted public repo

**Status:** Accepted (2026-07-21).

## Context

Court admissibility needs originals with intact metadata; submitter and
bystander safety needs the opposite — stripped metadata and blurred faces.
One store cannot serve both.

## Decision

Two strictly separated tiers:

- **Tier 1 — evidence vault (restricted).** Originals with full metadata,
  SHA-256 hashed on intake, write-once, redundantly stored across
  jurisdictions, access limited to a legal team.
- **Tier 2 — public repository (redacted).** Derived copies only: metadata
  stripped, bystander/protester faces blurred by default, location/time
  generalized, status label (*claimed / corroborated / court-ready*) on every
  item. Map + timeline + gallery views.

Nothing moves from Tier 1 to Tier 2 except through the redaction pipeline.

## Consequences

- Redaction is a first-class pipeline component, not an afterthought.
- The public tier is fully rebuildable from the vault; takedowns of the
  public tier cost nothing evidentiary.
- Access control and hosting decisions differ per tier and are made
  separately (see open decisions O-2, O-4).
