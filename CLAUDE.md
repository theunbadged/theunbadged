# The Unbadged — session rules

Read [CONTEXT.md](CONTEXT.md) (full charter) before substantive work. Check
design choices against [docs/threat-model.md](docs/threat-model.md).

## Hard lines — never violate, never "helpfully" work around

1. **No biometric facial recognition or face-search, ever, in any tier.**
   Officers are identified only via markers visible in footage (badge, name
   plate, unit, vehicle) or corroborated witness testimony. See
   docs/decisions/0001.
2. **No IP logging on any submission channel.** Not logs-we-delete — logs
   that are never written.
3. **Originals are write-once.** SHA-256 on intake, then never re-encode,
   re-tag, or touch. All redaction happens on derived copies.
4. **Nothing public without a status label** (claimed / corroborated /
   court-ready). No public naming of individuals as guilty.
5. **Evidence media never enters git.** This repo is code + docs only;
   .gitignore enforces it — don't weaken those rules.

## Working notes

- This repo is standalone; the parent Projects repo ignores it. It is public
  at github.com/theunbadged/theunbadged (decision 0003) — never commit secrets,
  vault contents, or submitter-identifying anything.
- All timestamps are IST (Asia/Kolkata), ISO-8601 with explicit +05:30,
  taken from the operator's system clock.
- Decisions get numbered files in docs/decisions/; superseded, never edited.
- Stack (decided at Phase 1): static site on Cloudflare Pages, intake via
  Cloudflare Worker + transient R2 mailbox, Python vault tooling
  (tools/ingest.py) on the operator's machine. Deploy: docs/DEPLOYMENT.md.
- Tone: public-facing text stays measured and un-dismissable ("fire on the
  banner, steel in the vault"). Campaign heat lives elsewhere.
