# Threat Model — The Unbadged

*Working draft. Every design decision should be checkable against this file.*

## Assets, ranked

1. **Submitter identities.** People uploading from a protest site into a repo
   the state wants to seize. Exposure means arrest or worse. Nothing outranks
   this.
2. **Original evidence + chain of custody.** Hashes, intact metadata,
   untouched originals. Lose integrity and nothing we hold is admissible.
3. **Witness identities and statements.**
4. **Platform credibility.** One fake clip published as fact discredits
   everything true in the vault.
5. **Operator identity/safety.** The founder and any collaborators.

## Adversaries and attacks

### A1 — State takedown / seizure
- Domain seizure, host takedown notices, IT Act blocking orders, physical
  seizure of servers in Indian jurisdiction.
- **Mitigations:** vault hosted off-India; redundant jurisdiction-diverse
  mirrors; a full copy held independently by a rights org; public tier
  rebuildable from the vault at any time.

### A2 — Submitter deanonymization
- IP logging (subpoenaed or seized), upload metadata (EXIF author/device,
  filenames), traffic analysis during internet shutdowns, device seizure at
  the protest site.
- **Mitigations:** no IP logs, ever (not "logs we delete" — logs that are
  never written; worker observability disabled); no accounts, no analytics,
  no third-party scripts; metadata stripped from every public derivative;
  submit-page guidance steers at-risk submitters to Tor Browser.
- **Accepted residual risk:** the host (Cloudflare) terminates TLS and sees
  client IPs in transit like any host. We never write them; submitters who
  cannot trust any host are explicitly told to use Tor Browser, which closes
  this gap from their side.

### A3 — Evidence tampering claims
- "The footage is edited/AI-generated/re-encoded" — the default state defense.
- **Mitigations:** SHA-256 on intake before anything else touches the file;
  original never re-encoded; append-only intake log with timestamps; all
  redaction performed on derived copies only.

### A4 — Poisoned submissions / infiltration
- Deliberately fake or doctored clips submitted so their later debunking
  discredits the archive; infiltrators submitting traceable content.
- **Mitigations:** verification ladder — nothing public as fact until
  human-verified; status labels on everything; provenance checks
  (cross-corroboration across independent clips) before promotion.

### A5 — Legal attack on the platform
- Defamation suits over named officers; contempt/interference claims.
- **Mitigations:** no public naming-as-verdict; incident + markers + status
  label only; individual guilt routed to courts; measured legal-facing
  identity ("steel in the vault").

### A6 — Vigilante misuse of the archive
- Third parties using published footage to crowdsource face-matching and
  harass individuals.
- **Mitigations:** faces of bystanders/protesters blurred by default in all
  public derivatives; location/time generalized on the public tier; ToS and
  published editorial line explicitly against identification-by-crowd.

## Standing constraints (from the charter — non-negotiable)

- No biometric facial recognition, in any tier, for any purpose.
- No IP logging on any submission channel.
- Originals are write-once: hash → store → never touch.
- Public tier carries derived, redacted copies only.

## Open threat questions

- [ ] Hosting jurisdiction shortlist and their legal-assistance-treaty
      exposure to India.
- [ ] Onion-service operational security for the operator.
- [ ] Secure-erase / duress procedure for the intake machine.
- [ ] How to verify clips during an internet shutdown window (delayed
      corroboration protocol).
