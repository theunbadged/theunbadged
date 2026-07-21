# The Unbadged — Project Context

**Domain:** theunbadged.com (owned)
**Started:** 2026-07-21

---

## Why this exists

On 21 July 2026, during the CJP "Sansad Chalo" march from Jantar Mantar toward
Parliament — a protest over NEET-UG paper leaks and demands for the Education
Minister's resignation — Delhi Police lathi-charged protesters. Many in the crowd
were 16–17 year old exam aspirants. Reports: 60+ protesters injured, 118+ police
personnel injured, two dozen+ students detained, internet shutdowns in parts of
Delhi. Contested triggers, counter-narratives, and — critically — **many officers
were deployed without visible badges/identifiers**, a deliberate accountability-
evasion tactic.

The name **The Unbadged** turns that tactic into the brand: they removed the
badges; we keep the record.

This is a citizen accountability archive. Its purpose is to preserve evidence of
police brutality against students in a form that survives takedowns and holds up
in court — not to be a rumor mill, not to be a hate-site, not to run a public trial.

The founder is a teacher from a family of teachers, spent 7 years preparing for
JEE, and has taught students toward these exams. This is lived experience, not a
news topic.

---

## The mission in one line

Preserve court-grade evidence of the crackdown where it can't be taken down, make
the pattern publicly visible without endangering anyone, and route named
accountability through the legal process — at every level, especially command.

---

## Non-negotiable principles (the whole design flows from these)

1. **No biometric facial recognition.** We do NOT extract faces and search them
   against public/scraped databases to de-anonymize people. It misidentifies,
   taints evidence, hands the state a "vigilante mob" narrative, and is the exact
   tool that gets turned on protesters. This line is fixed.

2. **Identify through markers and testimony, never biometrics.**
   - Official identifiers *visible in the footage*: badge number, name plate,
     rank insignia, unit/company markings, vehicle plate. These exist for
     accountability — reading them is legitimate and is the gold standard.
   - **Badge concealment is itself logged as evidence** — it's misconduct and
     consciousness of guilt, and it pushes liability upward to command.
   - Witness identification is testimony: a name is attached ONLY if a witness
     corroborates, and it's labeled as a claim pending corroboration.

3. **Command responsibility is the primary target.** When individual officers
   can't be identified (badges removed), accountability moves up: deployment
   rosters, duty logs, sector assignments, unit markings → the named commander
   who ordered that unit into that place owns what it did. This is obtained via
   court order / RTI, not by us.

4. **We document incidents, courts declare guilt.** The public side shows the
   act + location + time + visible markers + status label. The *conclusion* of
   individual guilt comes from a process with subpoena power and legal
   protection. No public "Officer X is a criminal" before adjudication —
   defamation exposure and trial-by-internet kill the platform.

5. **Submitter safety is non-negotiable.** People uploading from the protest
   site, during internet shutdowns, into a repo the state wants to seize, must
   never be exposed. Strip identifying metadata from the public-facing copy,
   accept uploads over Tor/onion + a Signal drop, never log IPs.

6. **Chain of custody is sacred.** Hash every original on intake, never touch it
   again, preserve its metadata in the restricted vault. Re-encoding or stripping
   the vault original destroys admissibility.

7. **Credibility is the weapon — protect it.** Verify before amplifying,
   including footage that favors our side. One fake clip discredits everything
   true we hold. Status labels on everything.

8. **Fire on the banner, steel in the vault.** Chant-style names
   ("Delhi Police haye haye") are for the campaign/hashtag. The archive's
   legal-facing identity stays measured and un-dismissable.

---

## Architecture — two tiers

**Tier 1 — Secure evidence vault (for courts, not the public)**
- Originals preserved with metadata intact (EXIF, timestamps, geodata).
- SHA-256 hash of every file on intake, recorded, original never re-touched.
- Redundant, jurisdiction-diverse storage (mirrored + off-India cold storage +
  a copy already held by a rights org). No single takedown/seizure kills it.
- Access restricted to a legal team.

**Tier 2 — Public repository (redacted, for visibility + submission)**
- Every public item is a derived, redacted copy: bystander/protester faces
  blurred by default, location/time generalized.
- "claimed / corroborated / court-ready" status labels — an evidence platform,
  not a rumor mill.
- Map + timeline + gallery of claimed incidents.

---

## Build plan (phased)

**Phase 1 — Secure intake + vault** *(START HERE)*
- Anonymous upload channel (Tor/onion + Signal drop), no IP logging.
- On intake: SHA-256 hash → timestamp → write original to vault untouched.
- Two copies: metadata-intact (restricted vault) + metadata-stripped derivative
  (for anything public).
- Anti-takedown redundancy from day one.

**Phase 2 — Verification workflow**
- Ladder: claimed → corroborated → court-ready. Nothing published as fact until
  human-verified.
- Per incident, log: act, location, time, unit/vehicle markers, badge-concealment
  flag, witness ID (only if corroborated), Actor-continuity links across clips
  (tracking one actor across footage by appearance/position — NOT biometrics).

**Phase 3 — Public redacted repository**
- Map + timeline + gallery. Faces blurred by default. Status label on everything.

**Phase 4 — Legal handoff**
- One-click export of an incident's full chain-of-custody package (originals,
  hashes, timeline, witness statements) in PIL / NHRC-complaint format.

---

## Open decisions

- **Legal home for the vault evidence** — no confirmed recipient yet. Build to be
  handoff-ready to any rights org / legal team (PUCL, HRLN, Amnesty India) or
  journalist. Research NHRC-complaint + PIL filing mechanics in parallel.
- **Hosting jurisdiction** — vault wants to be hosted outside Indian jurisdiction
  for takedown resistance. Defaults TBD.
- **Tech stack** — TBD at Phase 1 scaffolding.
