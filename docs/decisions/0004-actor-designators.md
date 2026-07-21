# 0004 — Actor tracking uses neutral designators; no epithets in the archive

**Status:** Accepted (2026-07-21).

## Context

The most valuable Phase 2 capability is tracking individual (mostly unbadged)
police personnel across independent clips — actor continuity. The temptation
is to make tracked actors memorable by attaching derogatory nicknames
("naming and shaming"). The charter already splits identities: campaign heat
lives outside; the archive stays measured (principle 8).

## Decision

1. Every tracked actor gets a **neutral designator**: `U-NN` for personnel
   with no visible identification (the U is the point — *Unbadged*), `B-NN`
   for personnel identified by visible badge/name plate, `V-NN` for vehicles.
   Designators are permanent once assigned; never reused.
2. Actor linking across clips is **human editorial analysis** documented per
   link: uniform, kit, build, position, and timeline continuity — the method
   is recorded for every appearance. **No biometric matching, ever**
   (decision 0001), including "just to assist" the human reviewer.
3. Public actor cards state only: designator, marker observations (including
   `name plate: absent` — logged as evidence in itself), documented acts with
   status labels, and appearance list linking to timeline events. No epithets,
   no nicknames, no guilt language, no speculation about identity.
4. Names attach to an actor **only** as identity claims with their own
   corroboration status, and a claimed identity is never published — it moves
   through the verification ladder toward legal handoff, not toward the
   public site.
5. Derogatory naming is out of scope for this platform entirely — not on the
   site, not in the data, not in commit messages. What third parties do with
   published designators is their speech, not ours.

## Consequences

- The archive reads as a case file, not a campaign — un-dismissable in court
  and in press, and it denies the state the "vigilante mob" takedown pretext.
- Defamation exposure stays near zero while the factual record grows.
- The campaign layer keeps full freedom: public designators are stable
  reference points anyone can rally around without the archive holding the
  match.
