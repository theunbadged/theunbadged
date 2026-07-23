# 0007 — Submitted evidence is never published

**Status:** Accepted (2026-07-23). Supersedes, for submitted material, the
"Tier 2 public redacted gallery of submitted incidents" model in
[0002](0002-two-tier-architecture.md).

## Context

The original two-tier model imagined a public, redacted gallery of submitted
incidents. After the 20 July crackdown, the doxxing and detention of the
operator, and the courts so far declining to act, the risk calculus for
submitters changed decisively:

- Publishing even a redacted submitted clip risks re-identifying the submitter
  or the people in the frame (gait, clothing, surroundings, and cross-matching
  against other footage defeat face-blurring), inviting retaliation.
- A clip put on the public web before it is court-tested can be attacked,
  mirrored out of context, or used to pre-empt its own evidentiary value.
- The people sending material are frightened; the simplest thing that earns
  their trust is a promise with no asterisks.

## Decision

- Material received through the intake channel is **never published** on the
  site or anywhere else, in any form, not even redacted.
- It is stored in the encrypted, write-once vault (Tier 1) and disclosed only
  to legal aid, the courts, the NHRC, or established rights organisations, if
  and when proceedings begin.
- The public site's exhibits are drawn **only** from material already public
  elsewhere (e.g. posts on X/Instagram), as redacted derivatives with civilian
  faces blurred.
- A submission may change a public timeline entry's status label
  (claimed → corroborated) as corroboration, **without the submitted clip ever
  being shown**.

## Consequences

- The promise to submitters becomes simple and absolute: "we will never post
  your video." The submit page states this plainly.
- The site's public, persuasive role rests entirely on the sourced timeline and
  already-public exhibits; the submitted evidence's role is strictly
  evidentiary (for courts), not display.
- The redaction pipeline still applies, but only to public exhibits drawn from
  already-public sources, never as a gate for publishing submissions (there is
  no such gate).
- Verification work (raising a claim to corroborated) happens privately against
  vaulted material; only the resulting status label is public.
