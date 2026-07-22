# 0006 — Anti-spam on intake stays anonymous by construction

**Status:** Accepted (2026-07-22).

## Context

After launch (30k+ reel views in a day), the intake channel needs protection
against junk floods: fake "evidence" files, storage-cost attacks, and scripted
submission spam. The standard defenses — IP rate limits, device
fingerprinting, third-party CAPTCHAs — all identify visitors, and hard line 2
forbids exactly that on the submission channel. Whatever we deploy must not
know *who* is submitting.

## Decision

Three controls in the intake worker, none of which reads or stores anything
about a visitor:

1. **Content sniffing (magic bytes).** Files are classified by their first
   bytes. Executables and archive containers are refused outright. Recognized
   photo/video/audio/PDF formats are accepted regardless of declared type.
   Unrecognized bytes are accepted only when they at least claim to be media
   with a plausible extension, and are stored with a `sniff: "unknown"` flag
   that follows them into the vault ledger for operator triage.
   **Bias: never lose real evidence.** A stored spam file costs the operator
   a minute; a rejected witness video may be gone forever. Only definite junk
   is refused.
2. **Per-submission budgets.** 20 files / 4 GB per submission, enforced
   across requests (a submission `ref` can no longer be reused to grow
   without bound). Files smaller than 64 bytes are refused as empty.
3. **Global per-minute gates.** New-submission creation and presigned-upload
   grants are capped per minute *in total, for everyone* (30 and 90
   respectively), tracked in a single counter object in the mailbox bucket.
   No identifiers exist, so the gate cannot discriminate — it can only say
   "intake is busy, retry in a minute."

Validation runs **before** any submission state is created, so junk never
mints claim tokens.

## What we deliberately did NOT do

- No IP-based limiting, no cookies, no fingerprinting (hard line 2).
- No CAPTCHA, including Cloudflare Turnstile: it would add a challenge
  script to the one page whose cleanliness we publicly promise, and its
  privacy story ("Cloudflare processes but we never see") is a weaker claim
  than "there is nothing there," which is auditable in this repo.
- No content moderation beyond format: the worker never inspects imagery or
  text semantics. Judging evidence is the operator's job, in the vault.

## Consequences

- A determined attacker can exhaust the global per-minute gate and slow
  everyone down (anonymous rate limiting cannot distinguish attacker from
  witness). The caps are set high enough that this costs sustained effort,
  and the gate degrades to "retry in a minute," never to data loss.
- Storage-cost attacks are bounded per submission (4 GB) and per minute
  (gate), not eliminated. The mailbox is transient; the operator's pull
  cadence is the real backstop.
- If flood pressure ever exceeds these controls, the next escalation that
  preserves hard line 2 is proof-of-work on the client (compute cost, no
  identity) — a separate decision if needed.
