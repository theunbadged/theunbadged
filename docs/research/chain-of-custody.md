# Chain of custody for citizen-submitted digital evidence — research

*Researched 2026-07-21 (day of intake-system design). Everything here needs
verification by an actual lawyer before it's relied on in a filing. Claims are
cited; anything not directly confirmed against a primary or reliable secondary
source is marked **UNVERIFIED**. Statute text quoted from secondary sources
should be re-checked against the official India Code text before the s.63
export template is finalized.*

Scope: what makes citizen-submitted video/photo evidence hold up in (a) Indian
criminal/civil courts under the Bharatiya Sakshya Adhiniyam, 2023 ("BSA",
replaced the Indian Evidence Act, 1872 on 1 July 2024), and (b) the NHRC and
other human-rights processes — and what that means for tonight's intake design.

---

## 1. What Indian law requires

### 1.1 The BSA framework in plain language

Electronic records are admissible as documents, but the law is deeply
suspicious of copies. The whole game is: **either produce the original
device/record, or produce a copy accompanied by a statutory certificate that
vouches for the system that produced the copy — now including a hash value.**

- **s.61 BSA** — an electronic record shall not be denied admissibility solely
  because it is electronic. ([indiankanoon s.63 page context](https://indiankanoon.org/doc/125020475/))
- **s.63 BSA** is the successor to IEA s.65B. s.63(1) deems information in an
  electronic record which is "printed on paper, stored, recorded or copied in
  optical or magnetic media or semiconductor memory" to be a *document*,
  admissible without production of the original, **if** the s.63(2) conditions
  are met ([indiankanoon](https://indiankanoon.org/doc/125020475/),
  [KS&K analysis](https://ksandk.com/litigation/section-63-bharatiya-sakshya-adhiniyam-2023/)):
  - (a) the computer/communication device was **regularly used** to create,
    store or process information by a person having **lawful control** over it;
  - (b) the information was **regularly fed** into it in the **ordinary course
    of those activities**;
  - (c) the device was **operating properly** throughout the material period
    (or any malfunction did not affect the record's accuracy);
  - (d) the output **accurately reproduces** the information fed in.
- **s.63(3)** — multiple devices used for the purpose are treated as one
  device (covers pipelines: capture device → upload → server → storage).
- **s.63(4)** — the certificate. It must: identify the electronic record and
  describe the manner in which it was produced; give particulars of the
  device(s) involved; address the s.63(2) conditions; and be signed by **both**
  (i) a person in charge of the computer/communication device or the
  management of the relevant activities, **and** (ii) an **expert**. Matters
  may be stated "to the best of the knowledge and belief" of the signer.
  Secondary sources state the certificate must be submitted **along with the
  electronic record at each instance where it is tendered for admission**
  ([Corpotech Legal](https://corpotechlegal.com/admissibility-electronic-evidence-sec-63-bsa/),
  [LiveLaw explainer](https://www.livelaw.in/articles/electronic-evidence-admissibility-section-63-bhartiya-saksha-adhiniyam-2023-261511),
  [KS&K](https://ksandk.com/litigation/section-63-bharatiya-sakshya-adhiniyam-2023/)).
  The dual signature (party + expert) is the biggest change from IEA s.65B,
  which needed only the responsible person.

### 1.2 The Schedule certificate — Part A and Part B

Unlike the IEA, the BSA prescribes a **format** in a Schedule to the Act
([LiveLaw](https://www.livelaw.in/articles/electronic-evidence-admissibility-section-63-bhartiya-saksha-adhiniyam-2023-261511)).
Per practitioner reproductions of the Schedule
([Shonee Kapoor certificate guide](https://www.shoneekapoor.com/section-65b-section-63-bsa-certificate-pdf/)) —
**re-verify against India Code before templating (marked UNVERIFIED as to
exact statutory wording, field list is consistent across sources):**

**Part A — filled by the party producing the record:**
- Description of the electronic record(s) and file names.
- Source category (computer / mobile phone / DVR / server / cloud account /
  storage device).
- Device particulars: make, model, serial number, IMEI/UIN/UID/MAC, cloud ID.
- Statement that the device was under the signer's **lawful control** and
  **regularly used**; that information was created/received in the **ordinary
  course of activities**; that the device was **functioning properly** during
  the relevant period.
- Extraction/copying process details: date, time, software used, method,
  destination storage medium, person who performed it.
- **Hash value of the record, the file name, and the hashing algorithm**
  (formats in circulation list SHA-1/SHA-256/MD5 or "other legally acceptable
  standard"), with an enclosed hash report.
- Signature block: name, date, time, place.

**Part B — filled by an expert:**
- Expert's name, qualifications, organization/laboratory, designation,
  experience in computer science / digital forensics / cyber forensics.
- Device/source examined (make, model, serial, identifiers); files examined.
- Tool/software used for examination.
- **Hash algorithm and the hash value generated/verified**, with hash report.
- Signature block.

### 1.3 Pune Bar Association v. Union of India (SC, 2026) — s.63 upheld

The Supreme Court (CJI Surya Kant, Bagchi and Pancholi JJ; order of 22 May
2026, reported July 2026; cited as 2026 LiveLaw (SC) 551) **upheld the
constitutional validity of s.63(4) and the Schedule** against a challenge that
the hash-value and expert requirements were impractical
([LiveLaw report](https://www.livelaw.in/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950),
[SCC OnLine blog](https://www.scconline.com/blog/post/2026/07/08/sc-upholds-admissibility-of-electronic-evidence-under-section-63-4-bsa/)).
Key points:

- Hash value "acts like an **electronic fingerprint**", verifying authenticity
  and integrity — the Court tied this to deepfake/AI-manipulation risk
  ([SCC OnLine](https://www.scconline.com/blog/post/2026/07/13/sc-explains-electronic-evidence-rules-under-bsa-2023-clarifies-hash-value/),
  [Law Web summary](https://www.lawweb.in/2026/05/section-634-bsa-supreme-court-clarifies.html)).
- **Part B experts are not confined to Examiners notified under s.79A IT
  Act.** "Apart from notified examiners, another person having special skill
  and expertise in computer science or cyber forensics may also be treated as
  an expert if the court is satisfied"
  ([Law Web](https://www.lawweb.in/2026/05/section-634-bsa-supreme-court-clarifies.html)).
  Practical consequence: our legal recipient can retain an independent
  forensic examiner; we are not hostage to a government-notified list.

### 1.4 Case law carried forward from the IEA era

The IEA cases remain the interpretive backbone (BSA s.63 substantially
re-enacts s.65B):

- **Anvar P.V. v. P.K. Basheer (2014)** — s.65B is "a complete code unto
  itself": for any *secondary* electronic evidence (a copy), the certificate
  is **mandatory**, and oral evidence cannot substitute for it
  ([SCC OnLine analysis](https://www.scconline.com/blog/post/2021/06/07/electronic-evidence-2/)).
- **Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020, 3-judge
  bench)** — reaffirmed Anvar, overruled the relaxation in *Shafhi Mohammad*.
  Holdings that matter to us
  ([judgment](https://indiankanoon.org/doc/172105947/),
  [Cyril Amarchand analysis](https://corporate.cyrilamarchandblogs.com/2021/01/supreme-court-on-the-admissibility-of-electronic-evidence-under-section-65b-of-the-evidence-act/),
  [SCC OnLine](https://www.scconline.com/blog/post/2021/06/07/electronic-evidence-2/)):
  1. **No certificate is needed if the ORIGINAL is produced** — e.g. the owner
     of the phone that shot the video steps into the witness box and produces
     the device/original record itself. The certificate regime applies to
     *copies*.
  2. **The certificate can be produced later** — "at any stage prior to the
     completion of the trial" (subject to fairness/prejudice). Contemporaneous
     certification is not a legal precondition — but a certificate is easier
     to give honestly when records were kept contemporaneously. **Design
     accordingly: keep the records now, generate the certificate later.**
  3. **Courts can compel third parties** to furnish certificates (Evidence
     Act s.165, CPC Order XVI, CrPC s.91): a party who cannot obtain a
     certificate may apply to the court to order the person in control of the
     device/system to produce it.
- **Shwetabh Singhal v. J.K. And Sons (Rajasthan HC, 9 Sept 2025)** — the
  certificate "has to be personally signed by the person who was occupying
  the relevant device": a s.65B certificate for a video is valid only from
  the person who **originally recorded** it, **not** from someone whose
  device merely holds a **transferred copy**
  ([SCC OnLine](https://www.scconline.com/blog/post/2025/09/26/rajasthan-high-court-section-65-b-certificate-evidence-act-original-device-holder/)).
  This is a High Court decision, not SC, and practitioner commentary
  (e.g. [Naavi](https://www.naavi.org/wp/clarification-section-65b-sign-certificate/))
  reads the requirement more functionally ("person who had lawful access in
  the normal course"), but it is the **conservative planning assumption**:
  - Our custodian's certificate can authenticate **our system's copies from
    the moment of intake onward** (our server is the device we control and
    regularly use).
  - Our certificate **cannot** authenticate the *creation* of the footage on
    the submitter's phone. That gap is closed only by (a) the recorder coming
    forward, (b) production of the original device, or (c) corroboration
    (below).

### 1.5 Plain-language synthesis

1. Courts want an unbroken, documented line from **capture → intake → storage
   → export**, with a hash proving nothing changed, and a human who can sign
   for each system in that line.
2. **We can only ever certify our own segment of the chain.** The design goal
   is to make our segment unimpeachable and to make the *submitter's* segment
   attachable later without touching the original.
3. Certificates are generated **per tendering** ("at each instance"), so the
   vault must be able to regenerate a dated certificate + hash report on
   demand, forever — not produce one certificate at intake and be done.
4. Nothing in the law requires the original to be re-processed — the opposite:
   every transformation is a new record needing its own accounting. The
   charter's write-once rule is exactly what the law rewards.

---

## 2. What this means for anonymous submissions

Honest assessment first: **anonymity has a real evidentiary price in Indian
practice.** Design must absorb that price, not pretend it away.

### What anonymity costs

1. **No Part A from the originator.** Under the conservative Rajasthan HC
   reading (§1.4), nobody can sign the certificate for the *original
   recording device*. Our certificate covers intake-onward only. Standing
   alone, an anonymous clip is a *lead*, not proof.
2. **No witness to depose.** A video is almost always led alongside the
   person who shot it or saw the event. Anonymous footage has no sponsoring
   witness, so its weight (even if admitted) is low until corroborated.
3. **NHRC will not act on an anonymous complaint.** NHRC FAQs: complaints
   that are "vague, anonymous, or pseudonymous" are ordinarily not
   entertained ([NHRC FAQ](https://nhrc.nic.in/faq)). Also: events older
   than **one year** are ordinarily not entertained — for 21 July 2026, the
   practical complaint deadline is **21 July 2027**.
4. **Tampering allegations bite harder.** With no originator, the state's
   default "edited/AI-generated" defense (threat model A3) must be answered
   entirely by technical integrity + corroboration.

### What mitigates it

1. **A complaint need not come from the victim or the recorder.** NHRC can
   inquire "on a petition by a victim **or any person on his behalf**" — an
   identified NGO/lawyer/the archive's legal recipient can file, attaching
   archive material with *our* custody certification
   ([NHRC FAQ](https://nhrc.nic.in/faq)).
2. **NHRC suo motu practice.** The Commission routinely takes suo motu
   cognizance of police-violence incidents based on media reports and viral
   video (e.g. journalist assault cases in Punjab, MP, UP), issuing notices to
   DGPs and demanding reports
   ([NHRC press releases](https://nhrc.nic.in/media/press-release/nhrc-india-takes-suo-motu-cognizance-reported-assault-journalist-two-police),
   [ANI, Feb 2026](https://aninews.in/news/national/general-news/nhrc-takes-suo-motu-cognizance-of-assault-on-journalist-covering-du-students-protest-in-north-campus20260220193842/)).
   Anonymous footage that is *published responsibly* (Tier 2) can trigger
   state accountability machinery even before it is court-evidence.
3. **The recorder can come forward later — if we preserved correctly.** This
   is the single most important design consequence. Arjun Panditrao allows
   the certificate **at any stage before trial ends**. A submitter who later
   surfaces (or is located by the legal team) can produce their device/
   original file and sign Part A. The bridge between "their original" and
   "our vault copy" is the **matching SHA-256**. If we hashed on intake and
   never touched the file, the match is mathematically demonstrable; if we
   re-encoded anything, the bridge is gone forever.
4. **Authorship is not the only route to authentication.** Berkeley Protocol,
   para. 177: "While identifying authorship is helpful, **a lack of it is not
   generally critical for establishing an online item's authenticity**, as
   there are other ways to authenticate open source information"
   ([Berkeley Protocol PDF](https://www.ohchr.org/sites/default/files/2024-01/OHCHR_BerkeleyProtocol.pdf)).
   Routes: geolocation, chronolocation, internal consistency, and **external
   corroboration** across independent clips of the same incident (paras.
   188–194). Indian courts have likewise convicted on circumstantial video
   corroborated by other evidence
   ([sukhi.in overview](https://sukhi.in/articles/cctv-evidence-legal-admissibility-india/)).
   Cross-corroborated clusters of independent clips are how "claimed"
   becomes "corroborated" in our ladder.
5. **Third-party footage has been acted on before.** In *R.K. Anand v.
   Registrar, Delhi HC* (2009), NDTV sting footage grounded contempt
   convictions — though the Court there did not engage s.65B, and the case
   pre-dates Anvar, so treat it as illustrating institutional willingness,
   not as an admissibility precedent
   ([case comment](https://www.ijllr.com/post/case-comment-r-k-anand-v-registrar-delhi-high-court-2009-8-scc-106)).

### Design consequences (tonight)

- **Issue every anonymous submitter a claim token** (random secret shown once
  at upload; we store only its hash). A submitter who later comes forward
  proves "I am the source of submission X" by presenting the token — without
  us ever having stored their identity. This converts "anonymous forever"
  into "anonymous until they choose otherwise," which is where the legal
  value is.
- **Intake guidance should tell submitters:** keep your original file and
  your phone; do not delete; your footage becomes court-grade the day you (or
  your device) can be produced. (Consistent with charter: their safety, their
  choice, their timeline.)
- **Record the submitter's own context statement verbatim** and label it a
  claim. It is hearsay for now; it becomes a witness-statement skeleton the
  day they come forward.

---

## 3. Intake record: required fields

Derived from BSA s.63 + Schedule (§1.2), Arjun Panditrao (later
certification needs contemporaneous records), and Berkeley Protocol paras.
155 (collection data), 159–175 (preservation), 167 (chain of custody). This
is the **per-submission ledger schema the intake system MUST capture.** The
ledger itself must be **append-only** — corrections are new entries that
reference the erroneous one, never edits.

### A. Identity of the record

| # | Field | Why |
|---|-------|-----|
| A1 | **Submission ID** (unique, non-sequential) | Berkeley para. 162: a digital item must be independently referenceable. Non-sequential so public IDs don't leak intake volume/order. |
| A2 | **SHA-256 of the original, exactly as received** — computed before any other action, before any human views it | The hinge of everything: BSA Schedule hash field; Pune Bar Assn "electronic fingerprint"; threat model A3; the future bridge to a recorder's original (§2). |
| A3 | **Hash algorithm name + hashing tool and version** | Schedule requires algorithm to be stated; the certificate signer must say how the hash was produced. |
| A4 | **Original filename as received** (verbatim, even if junk) | Filename is part of the received artifact; Schedule Part A lists file names; renaming-on-intake without recording the original invites "which file is this?" cross-examination. Store our canonical name *alongside*, never instead. |
| A5 | **File size in bytes** | Cheap independent integrity check; appears in standard hash reports. |
| A6 | **Container/MIME type, and for video: duration, resolution, codec** | Schedule Part A "description of the electronic record"; also detects silent transcoding anywhere downstream (codec change = red flag). |

### B. The intake event (first link of our chain)

| # | Field | Why |
|---|-------|-----|
| B1 | **Intake timestamp, ISO 8601 with explicit timezone offset** (store UTC + IST rendering) | Berkeley para. 155(g): timestamp at collection; certificates and cross-clip correlation die on ambiguous times. |
| B2 | **Clock source statement** (NTP-synchronized, which server, or "manual — unsynced") | Berkeley para. 155(g) explicitly: sync system clock with NTP so time metadata is accurate. An unsynced clock, honestly recorded, is survivable; a wrong clock silently trusted is not. |
| B3 | **Receipt channel** (onion upload / Signal drop / physical media / in-person) — *and nothing that identifies the submitter* | First link of custody: "how did this come into your possession" is the first cross-examination question. NB: Berkeley para. 155(g) suggests recording the collector's IP — that refers to the investigator's own machine; we record our intake machine ID (B4) and **never any submitter network data** (charter hard line 2). |
| B4 | **Intake system identifier** (machine/hostname of the intake box) + **intake software name/version** | Schedule Part A wants device particulars and the extraction/copying process (software, method, medium); s.63(2) conditions are sworn about *this* device. |
| B5 | **Custodian** — the human operator responsible for this intake | s.63(4): certificate is signed by "a person in charge of the… device or the management of the relevant activities." Someone must be able to swear to this event. Every ledger event names a human. |
| B6 | **Vault write location(s) + storage medium + confirmation hash re-read after write** | Berkeley paras. 168, 170: evidentiary copy stored in original form; storage is an active process. Re-reading and re-hashing after the vault write proves the stored bytes = received bytes. |

### C. Embedded metadata snapshot (read-only extraction)

| # | Field | Why |
|---|-------|-----|
| C1 | **Full embedded metadata dump** (EXIF/XMP/container atoms: capture datetime, GPS, device make/model, software tags) — extracted with a read-only tool from a *working copy*, stored verbatim in the ledger | Berkeley paras. 184–185: metadata are reviewed to establish authenticity; capture-device particulars feed the eventual Part A of a recorder who comes forward, and geodata feeds corroboration. Extracting it into the ledger means analysts never need to open the vault original. |
| C2 | **Extraction tool + version + timestamp + operator** | Every touch, even read-only, is a handling event (D1). |

### D. Handling history (the chain itself — one entry per event, forever)

| # | Field | Why |
|---|-------|-----|
| D1 | **Access/handling event log**: timestamp (tz), human actor, action (read / copy / derive / export / fixity-check / transfer), which copy (vault original vs. derivative ID), purpose, resulting artifact IDs | Berkeley para. 167: chain of custody = chronological documentation of custodians, control, transfer, analysis, disposition. WITNESS: "who acquired, accessed, handled; what was done; when" ([WITNESS Archive Guide](https://archiving.witness.org/archive-guide/resources/video-as-evidence/)). This log *is* the chain of custody annex of any future court package. |
| D2 | **Derivative registry**: for every derived copy — parent ID, derivative SHA-256, tool + version, exact operations (e.g. "faces blurred regions x,y; metadata stripped; transcoded H.264→H.264 CRF20"), operator, timestamp | Berkeley para. 169: work only on copies; "any and all changes… including the making of copies, should be documented." Publicly-posted derivatives will be compared against our records by hostile actors; the registry lets us prove exactly what was changed and that the original wasn't. |
| D3 | **Fixity check log**: date, file(s), expected vs. computed hash, result, operator | Berkeley para. 172: regularly re-check hashes to detect storage degradation. Also produces a running, dated record that the original has been intact continuously — devastating against tampering claims. |
| D4 | **Transfer log**: recipient (legal team / rights org / mirror), date/time, method, manifest of hashes, recipient's confirmation of hash match | Custody doesn't end at our wall; the Phase 4 handoff package must show an unbroken chain into the recipient's hands. |

### E. Submitter-side (all optional, all volunteer-only)

| # | Field | Why |
|---|-------|-----|
| E1 | **Anonymity status** (anonymous / pseudonymous-with-token / identified-to-legal-team-only) | Determines the evidentiary path (§2) and what the export can claim. |
| E2 | **Claim-token hash** (never the token itself) | Lets an anonymous submitter later prove sourcehood and sign Part A (§2) — the anonymity-mitigation hinge. |
| E3 | **Submitter's context statement, verbatim** (claimed place, time, what is depicted) + language | Berkeley para. 155(f): contextual data. It's a claim now, a witness statement skeleton later. Verbatim because paraphrase = alteration. |
| E4 | **Submitter's own capture claims** (device type, whether this is the camera-original file or a re-share/WhatsApp copy) | WhatsApp/Telegram re-encode media; knowing the file is *not* camera-original changes its verification path and the honest status label. |

### F. Case-building linkage

| # | Field | Why |
|---|-------|-----|
| F1 | **Incident ID link(s)** + corroboration links to other submissions | Berkeley paras. 148, 194: record why an item is relevant; external corroboration across independent items is what promotes claimed → corroborated. |
| F2 | **Status label** (claimed / corroborated / court-ready) + who changed it, when, why | Charter hard line 4; also the verification ladder must itself be auditable. |
| F3 | **Duplicate linkage** (identical SHA-256 arriving via different channels) | Two independent submissions of bit-identical files is itself corroborating provenance evidence — log both events, store once, link them. |

---

## 4. Handling rules (operator do/don't)

**DO**

1. **Hash first.** SHA-256 on the exact received bytes before anything else —
   before viewing, before virus-scanning-that-writes, before renaming.
2. **Write the original to the vault, re-read it, re-hash it, log the match.**
   Then treat that copy as radioactive: read-only forever.
3. **Make a working copy immediately** and do *everything* else (viewing,
   metadata extraction, redaction, clipping) on working copies (Berkeley
   paras. 168–169).
4. **Log every event, at the time it happens, naming a human.** If something
   was done before it was logged, log it retroactively and *mark it
   retroactive* — an honest gap documented beats a silent gap discovered.
5. **Keep clocks NTP-synced** on every machine that writes ledger entries;
   record the sync source.
6. **Keep at least 3 copies, on 2 media types, 1+ geographically separate**
   (Berkeley para. 171) — charter already requires jurisdiction diversity.
7. **Run scheduled fixity checks** (full sweep or random sample) and log
   results (Berkeley para. 172).
8. **Mount evidence media read-only** on analysis machines (many OSes and
   players write thumbnails, indexes, or "last played" sidecars into the
   directory or even the file).
9. **Record honestly when a submission is already a re-encode** (WhatsApp
   copy etc.) — its label and verification path differ; pretending it's
   camera-original poisons credibility (threat model A4/A7).
10. **Issue and explain the claim token** at every anonymous intake.

**DON'T**

1. **Never re-encode, transcode, re-tag, trim, "fix", or re-container the
   vault original.** Not to save space, not to normalize formats, not to
   strip metadata. All of that happens on derivatives only (charter hard
   line 3; the s.63 hash bridge dies otherwise).
2. **Never edit or delete a ledger entry.** Append corrections.
3. **Never strip metadata from the vault copy** — strip it from public
   derivatives (charter two-tier design).
4. **Never rename in place without recording the received filename** (A4).
5. **Never record submitter network data** — no IPs, no user agents, no
   upload session identifiers that could be correlated (charter hard line 2).
   The chain of custody starts at *receipt*, and the law does not require us
   to know who sent it — it requires us to prove what we did after.
6. **Never let anyone (including the founder) touch vault originals without a
   logged event** with purpose stated. No exceptions for "quick checks" —
   that's what working copies are for.
7. **Never publish anything except a registered derivative** with a status
   label (charter hard lines 4–5).
8. **Never discard a submission as "duplicate" or "useless" silently** — log
   receipt and disposition; today's junk is tomorrow's corroboration.
9. **Never open the original on an internet-connected editor/player that
   phones home** — treat cloud-syncing folders (OneDrive/Drive) as forbidden
   locations for vault or working paths.

---

## 5. s.63 certificate template needs (what the export must generate later)

The Phase 4 export must be able to produce, **on demand, dated fresh at each
tendering** (§1.1 point 3), per file or per incident package:

1. **Part A, pre-filled from the ledger, for our custodian to sign:**
   - Description + file name(s) of the record(s) tendered (A1, A4, A6).
   - Source category: "server / storage device" — our vault system.
   - Device particulars of the vault + intake systems (B4, storage media,
     identifiers).
   - The s.63(2) statements as applied to *our* system: lawful control,
     regular use in the ordinary course of the archive's activities, proper
     functioning during the period (supported by fixity logs D3), accurate
     reproduction.
   - Copying/extraction details for the specific export: date, time, software
     + version, method, destination medium, person (auto-logged as a D1/D4
     event when the export runs).
   - **Hash value + algorithm + attached hash report** (A2, A3), including
     intake hash, current re-computed hash, and every fixity check between —
     demonstrating continuity, not just two point-in-time matches.
   - Signature block for the named custodian (B5).
2. **Part B support pack for an independent expert** (not signed by us): the
   exported media + hash manifest + tool documentation, so any qualified
   examiner (post-*Pune Bar Assn*, not limited to s.79A notified examiners)
   can independently re-hash, examine, and sign Part B.
3. **Chain-of-custody annex:** the complete chronological D1–D4 event history
   for the item, rendered human-readable, with timezone-explicit timestamps.
4. **Optional "originator Part A"** — a blank-but-prefilled certificate for a
   recorder who comes forward: their device particulars slot, their original
   file's hash (which should equal our intake hash A2 if they kept the
   camera-original), and the claim-token verification record (E2) tying them
   to the submission.
5. **Metadata report** (C1) and **derivative disclosure** (D2) — what exists
   publicly, how it differs from the original, and why (pre-empts the "you
   published an edited video" attack).
6. **Format targets:** printable PDF reproducing the statutory Schedule
   faithfully (practitioner guidance: "the statutory Schedule should be
   reproduced faithfully in the final court filing" —
   [Shonee Kapoor](https://www.shoneekapoor.com/section-65b-section-63-bsa-certificate-pdf/)),
   plus machine-readable JSON of the same data. **Action item: obtain the
   official Schedule text from India Code and encode it verbatim** — the
   field list in §1.2 is from practitioner sources (UNVERIFIED against the
   Gazette text).
7. **NHRC package variant:** self-contained complaint annex (NHRC FAQ:
   complaints "expected to be self-contained") — incident narrative, media +
   hashes + custody annex, filed by an identified complainant on victims'
   behalf; deadline logic flagging the **one-year limit (21 July 2027)**.

---

## 6. Open questions / UNVERIFIED items

- [ ] **Exact statutory text of BSA s.63(4) and the Schedule** — obtain from
      India Code / Gazette; all field lists above are from secondary sources.
- [ ] **BSA s.57 Explanations** reportedly treat certain electronic records
      (e.g. simultaneous multi-file storage) as *primary* evidence — could
      matter for whether our vault copy is itself "primary". **UNVERIFIED**;
      could not confirm text this session; check before relying.
- [ ] Whether *Pune Bar Assn* addressed the **stage/timing** of certificate
      production under the BSA (the Arjun Panditrao "any stage before trial
      completes" rule is IEA-era; assumed carried forward — UNVERIFIED).
- [ ] Whether the "at each instance" certificate requirement demands
      re-certification on appeal — ask the legal recipient.
- [ ] The precise weight NHRC gives to video annexed to a complaint vs.
      demanding state reports — its FAQs describe process, not evidentiary
      standards; practice appears report-driven (suo motu notices demand DGP
      reports). Needs input from a practitioner who has filed NHRC
      police-violence complaints (links to docs/research/legal-mechanics.md).
- [ ] *Shwetabh Singhal* (Raj HC) vs. functional readings of "person in
      charge" — is there SC-level clarity post-BSA on who signs for
      transferred copies? Track.
- [ ] Berkeley Protocol imposes no legal obligations in Indian courts — it is
      persuasive methodology (UN/OHCHR-published). Its value is credibility
      and international-forum readiness, not domestic admissibility per se.

---

## Sources

**Statute and cases**
- BSA s.63 text: https://indiankanoon.org/doc/125020475/
- LiveLaw, "How To Fulfill Requirements Of Admissibility Of Electronic Evidence Under BSA 2023": https://www.livelaw.in/articles/electronic-evidence-admissibility-section-63-bhartiya-saksha-adhiniyam-2023-261511
- Corpotech Legal, "Admissibility of Electronic Evidence, Certificate and Hash Value, S 63 BSA": https://corpotechlegal.com/admissibility-electronic-evidence-sec-63-bsa/
- K&S/KSK, "Section 63 BSA 2023: Admissibility of Electronic Evidence": https://ksandk.com/litigation/section-63-bharatiya-sakshya-adhiniyam-2023/
- Shonee Kapoor, "Section 65B & Section 63 BSA Certificate Guide" (Schedule Part A/B fields): https://www.shoneekapoor.com/section-65b-section-63-bsa-certificate-pdf/
- Pune Bar Assn. v. Union of India (2026): LiveLaw https://www.livelaw.in/top-stories/supreme-court-rejects-challenge-to-s634-bsa-mandating-hash-value-disclosure-for-electronic-evidence-535950 ; 2026 LiveLaw (SC) 551 https://www.livelaw.in/sc-judgments/2026-livelaw-sc-551-pune-bar-association-v-union-of-india-535951 ; SCC OnLine blog https://www.scconline.com/blog/post/2026/07/08/sc-upholds-admissibility-of-electronic-evidence-under-section-63-4-bsa/ and https://www.scconline.com/blog/post/2026/07/13/sc-explains-electronic-evidence-rules-under-bsa-2023-clarifies-hash-value/ ; Law Web (Part B experts) https://www.lawweb.in/2026/05/section-634-bsa-supreme-court-clarifies.html
- Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020): https://indiankanoon.org/doc/172105947/ ; Cyril Amarchand analysis https://corporate.cyrilamarchandblogs.com/2021/01/supreme-court-on-the-admissibility-of-electronic-evidence-under-section-65b-of-the-evidence-act/ ; SCC OnLine https://www.scconline.com/blog/post/2021/06/07/electronic-evidence-2/
- Shwetabh Singhal v. J.K. And Sons (Raj HC 2025): https://www.scconline.com/blog/post/2025/09/26/rajasthan-high-court-section-65-b-certificate-evidence-act-original-device-holder/
- Naavi, "Who should sign the 65B Certificate?": https://www.naavi.org/wp/clarification-section-65b-sign-certificate/
- R.K. Anand v. Registrar, Delhi HC (2009) comment: https://www.ijllr.com/post/case-comment-r-k-anand-v-registrar-delhi-high-court-2009-8-scc-106
- CCTV/video admissibility overview: https://sukhi.in/articles/cctv-evidence-legal-admissibility-india/

**Human-rights bodies**
- NHRC FAQs (anonymous/pseudonymous bar, one-year rule, self-contained complaints, filing on behalf, suo motu): https://nhrc.nic.in/faq
- NHRC suo motu practice on police-violence video/media reports: https://nhrc.nic.in/media/press-release/nhrc-india-takes-suo-motu-cognizance-reported-assault-journalist-two-police ; https://nhrc.nic.in/media/press-release/nhrc-india-takes-suo-motu-cognizance-reported-assault-two-journalists-police ; https://aninews.in/news/national/general-news/nhrc-takes-suo-motu-cognizance-of-assault-on-journalist-covering-du-students-protest-in-north-campus20260220193842/

**International methodology**
- Berkeley Protocol on Digital Open Source Investigations (OHCHR/HRC Berkeley, full PDF; paras. 141–198 for the investigation process; 155 collection data; 159–175 preservation; 167 chain of custody; 168–169 evidentiary vs. working copies; 171 backups; 172 fixity; 177 authorship; 184–194 verification): https://www.ohchr.org/sites/default/files/2024-01/OHCHR_BerkeleyProtocol.pdf ; landing page https://www.ohchr.org/en/publications/policy-and-methodological-publications/berkeley-protocol-digital-open-source
- WITNESS Archive Guide, "Video as Evidence" (original-file preservation, early hashing, chain-of-custody documentation): https://archiving.witness.org/archive-guide/resources/video-as-evidence/
- The Engine Room / WITNESS, "Resources: Chain of Custody": https://documentation-tools.theengineroom.org/resources-chain-of-custody/
