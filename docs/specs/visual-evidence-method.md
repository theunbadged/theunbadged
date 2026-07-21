# Visual-evidence method (from founder direction, 21 Jul 2026)

How the public story is told. Investigative-journalism register: findings and
their sources, never our reasoning process, never meta copy about
verification ("this is why we corroborate…" does not appear in the UI).

## Rules

1. **Multi-account public video is public evidence.** A scene posted
   independently by multiple unrelated accounts is treated as having
   happened; what is *visible in the frame* is presumed true (Berkeley
   Protocol basis). What is *claimed about* the frame (time, place, who)
   still needs corroboration before it's stated as fact.
2. **Loopholes are findings.** Where an official statement conflicts with
   the visual record, other official statements, or logic, we present the
   juxtaposition plainly and precisely. Absence arguments are stated as
   counts, not conclusions: "Of N clips timestamped before 10:04 reviewed,
   none shows X; police have released no footage of X" — never "so they're
   lying."
3. **Red dots = personal attacks on video.** The map's incident layer marks
   where an identifiable act of violence against a person is visible in
   public footage, at the time it was reported/filmed. Each dot links its
   clip (and archive copy once vaulted). Red is reserved for this.
4. **Sources travel with the claim.** Every chapter, caption, and dot links
   its video/article inline, right where the claim is made.
5. **Status pills stay; explanations go.** "claimed / corroborated" labels
   appear on claims as professional annotation. Sentences explaining our
   process are cut from the story UI (they live in /about.html and the repo).
6. **Presence dots (crowd/police) are indicative reconstruction** from
   sourced reports, visually distinct from red incident dots, and labeled
   "indicative" once — no implied surveillance precision.

## Pipeline

citizen sweep (Reddit/IG/X/YT) → capture candidates → vault (ingest.py)
→ visual-fact entries (what's visible, when, where, multi-account list)
→ timeline additions + red dots on map + loophole findings vs official
statements (docs/research/contradictions.md).
