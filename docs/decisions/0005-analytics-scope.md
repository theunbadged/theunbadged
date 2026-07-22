# 0005 — Analytics on story pages only; the submission channel stays clean

**Status:** Accepted (2026-07-22).

## Context

The launch post took off (30k+ views on Instagram within a day) and the
operator needs to see what visitors read, where they drop off, and which
calls to action convert. Google Analytics (GA4, tag `G-J5KC5SE6GF`) was
requested "across all pages".

But hard line 2 (CLAUDE.md, threat model) is: **no IP logging on any
submission channel** — and the submit page publicly promises "No account.
No name. No IP logs. Verify the code yourself." Loading a Google tag on
submit.html would send every prospective submitter's IP address, user
agent, and visit timing to a third party at the exact moment they are most
exposed. Google's records are subject to legal process; that is precisely
the risk our submitters are trusting us to exclude. "We don't log, but
Google does" would make the promise false.

## Decision

- GA4 loads on **index.html and timeline.html only**, with custom events
  (chapter/exhibit views, story depth, video plays, CTA clicks, outbound
  source clicks) via `site/assets/analytics.js`.
- **submit.html never carries any analytics, tag manager, or other
  third-party resource.** No exceptions, no "lightweight" alternatives.
  This is enforceable by inspection because the site is open source.
- Traffic counts for the submit page, if ever needed, may come only from
  server-side aggregates that don't touch identifiers (e.g. Cloudflare's
  dashboard totals), never from client-side tags.
- Navigation clicks *toward* the submit page are counted on the pages the
  visitor left (the `cta_click` event), which gives conversion visibility
  without touching the submit page itself.

## Consequences

- Funnel visibility ends at the submit page's door: we can count how many
  went in, not what they did inside. That is the point.
- Story-page visitors do share standard GA4 telemetry with Google; reading
  the public story is a materially lower-risk act than submitting, and the
  page carries no submitter-identifying state.
- If a future review decides even story pages should drop Google (e.g. for
  a cookieless, self-hosted, or Cloudflare Web Analytics setup), that
  supersedes this decision with a new numbered file.
