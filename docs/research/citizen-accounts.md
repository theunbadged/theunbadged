# Citizen accounts — 20 July 2026 crackdown (Chalo Sansad march)

Compiled: 2026-07-21T21:30:00+05:30 (IST, operator clock).
Scope: first-person accounts, photos and video from citizens on X, Instagram,
YouTube, and via news articles that embed or quote citizen posts, 18–21 July
2026. Everything below is status **claimed** unless noted. Every URL was seen
in a search result or fetched page during this session — nothing is invented.
Post text quoted here is as rendered by the intermediary page (article embed,
archive listing, or search snippet), not read directly from the platform,
unless stated.

**Access constraints (read before trusting anything below):**

- **Reddit: unreachable.** The domain blocks our crawler entirely
  (`site:reddit.com` queries returned nothing on-topic; domain-restricted
  search errors out; old.reddit.com fetch refused). Zero Reddit items below —
  not because none exist, but because we could not look. Needs a
  logged-in/manual sweep of r/india, r/delhi, r/unitedstatesofindia,
  r/JEENEETards, r/Indian_Academia.
- **X/Twitter: not directly fetchable.** All X URLs below were obtained
  second-hand: from Wikipedia's citation list, from the
  delhi-police-violence.vercel.app public-record archive, or from article
  embeds. Content descriptions are the intermediary's, and handles/timestamps
  are as the intermediary rendered them. Verify before vault ingestion.
- **Instagram: fetch returns an empty shell.** Reel URLs below come from
  search-result titles only; account handles, dates, and view counts are
  unverified. All are capture candidates precisely because we cannot confirm
  they'll stay up.
- **web.archive.org: blocked** for our fetcher. Archival capture of every
  item below must happen from the operator's machine (tools/ingest.py flow).
- 403s hit: medianama.com, wionews.com, sakshipost.com, filmibeat.com (one
  siasat.com live blog did fetch).

**Aggregator of record found:**
[Jantar Mantar / Public Record](https://delhi-police-violence.vercel.app/) —
an independent site preserving citizen posts on the 20–21 July police action.
Claims **39 collected sources**; only 8 render without JS ("Load 8 more"
button is client-side, unreachable to our fetcher). The 8 visible items are
distributed into categories below. Worth contacting/scraping with a real
browser — it is doing adjacent work to this project. **CAPTURE CANDIDATE
(entire site + its 39 sources).**

---

## 1. Officers without name plates / badge concealment

- **News article (embeds X)** — TV9 Hindi, "सादे कपड़ों में लाठीबाज!" —
  https://www.tv9hindi.com/india/without-uniform-police-in-protest-lathicharge-rules-cjp-march-delhi-3856836.html
  — 20/21 Jul. Reports social-media videos showing plainclothes men beating
  protesters with lathis at Jantar Mantar on 20 July, and lays out the legal
  frame: Police Manual uniform requirement, D.K. Basu v. West Bengal (1997)
  name-tag mandate *even in plainclothes*, BNSS s.36 self-identification,
  and that only magistrates/SHOs may authorise a lathi charge (CrPC 129 /
  BNSS 148). Corroboration: aligns with Newslaundry's photo report (evt-007).
- **X post** — @UmmedaRamBaytu (Ummeda Ram Beniwal, Congress MP) —
  https://x.com/UmmedaRamBaytu/status/2079445672701649353 — seen via the TV9
  article. Asks "who were these people in civil clothes with lathis alongside
  Delhi Police?" and demands government clarification. Verified-politician
  amplification of the unbadged/plainclothes claim. Date per embed: 21 Jul.
  **CAPTURE CANDIDATE** (post + attached video if any).
- **Hindi-language reporting (claim seen in search results, article-level
  attribution unconfirmed)** — search results for "बिना नेम प्लेट दिल्ली
  पुलिस जंतर मंतर" surfaced claims that many lathi-charging personnel in
  blue uniforms had **no name plates**, and that supporters said personnel
  without name tags beat several people **including women protesters and
  called them "terrorists"**. Candidate carriers in that result set:
  https://desh.thefederal.com/nishpaksh/jantar-mantar-youth-protest-against-paper-leak-the-federal-250781 ,
  https://www.newsaroma.com/jantar-mantar-protest-abhijeet-deepke-apology-police-action-students-march/ .
  NEEDS VERIFICATION — we saw the claims in the search digest, not pinned to
  a fetched page.
- **Outlet anchor (already in timeline, evt-007)** — Newslaundry photo essay:
  personnel without name badges *before* the protest began; plainclothes men
  wielding lathis —
  https://www.newslaundry.com/2026/07/21/lathis-tear-gas-and-injured-protesters-the-chalo-sansad-crackdown-in-pictures

## 2. Plainclothes men with lathis / plainclothes operations

- **Wikipedia-aggregated claim (18 Jul)** — police entered the protest site
  **in civilian dress** and covered the stage with white curtains to remove
  Sonam Wangchuk; "images of the operation went viral on social media" —
  https://en.wikipedia.org/wiki/2026_Delhi_Jantar_Mantar_protests . The
  viral images themselves were not located this session — find and capture.
- **X post** — @Cockroachisback (CJP account) —
  https://x.com/Cockroachisback/status/2078778925585449150 — Dipke's
  statement on Wangchuk's removal (cited by Wikipedia for the 18 Jul
  removal). **CAPTURE CANDIDATE.**
- TV9 Hindi + @UmmedaRamBaytu (see category 1 — same evidence covers both
  claims).
- Filmibeat coverage (via search snippet; page 403'd on fetch) reported
  Wangchuk was taken to Safdarjung Hospital **by plainclothes police
  personnel** —
  https://www.filmibeat.com/television/news/2026/chalo-sandad-protest-uorfi-javed-calls-out-police-brutality-against-student-protestors-jab-gunde-525303.html

## 3. Minors / school-age students beaten or detained

- **X post (video)** — @SidKeVichaar — 20 Jul 2026, 11:36 pm IST —
  https://x.com/SidKeVichaar/status/2079266679763382719 — video of a **Class 7
  student from Odisha** criticising authorities at/about the protest. Seen
  via delhi-police-violence.vercel.app (editor-approved there, archive
  capture queued). **CAPTURE CANDIDATE.**
- **News article verifying footage of minors beaten** — IBTimes UK —
  https://www.ibtimes.co.uk/indian-police-crackdown-student-protests-neet-ug-paper-leak-1809764
  — states independent media on the ground "verified multiple videos with
  eyewitnesses where police were filmed assaulting protesters **as young as
  15 or 16**". Embeds @CJP_for_India post of 21 Jul (Hindi statement +
  video; media URL fragment pic.twitter.com/bXzssCbPBJ). **CAPTURE
  CANDIDATE (the embedded CJP video).**
- **Viral post claiming a 12-year-old girl injured** (+ alleged assault on
  Wangchuk's wife Geetanjali Angmo, 40–50 injured) — platform/handle not
  identified by the carrier; **Delhi Police publicly dismissed it as false**
  — seen via Siasat live blog:
  https://www.siasat.com/live-sonams-new-message-cjp-continues-sit-in-amid-heavy-police-pressence-3509588/
  — Treat as contested claim; locating the original post matters (either it
  is evidence or it is misinformation to be excluded).
- **Outlet corroboration of "minors present/hit"** — The Wire headline
  "Police lathicharges thousands, fires tear gas at protesters including
  minors" —
  https://thewire.in/government/police-lathicharges-thousands-fires-tear-gas-at-protesters-including-minors
  (URL seen in Wikipedia's citation list; page itself not fetchable this
  session — archive.org blocked).

## 4. Force without warning / peaceful crowd charged

- **X post (video)** — @Benarasiyaa (Piyush Rai, journalist) — 20 Jul 2026 —
  "And it has finally begun. Security personnel using lathicharge to disperse
  crowd at CJP protest in Delhi." (media fragment pic.twitter.com/JYTNKLq0Tj;
  status URL not shown by the carrier, IBTimes UK embed). The "finally
  begun" phrasing supports a sudden-onset charge. **CAPTURE CANDIDATE.**
- **X post (video)** — @ViralDecoder —
  https://x.com/ViralDecoder/status/2079227176055152886 — video of police
  beating protesters (Wikipedia citation). **CAPTURE CANDIDATE.**
- **X post (video)** — @diplomattimes —
  https://x.com/diplomattimes/status/2079258288798232635 — video of
  protesters being dragged (Wikipedia citation). **CAPTURE CANDIDATE.**
- **X posts (videos, no status URLs seen)** — via Bhadas4Media roundup
  https://www.bhadas4media.com/jantar-mantar-police-lathicharge/ :
  @brijshyam8 (20 Jul, protesters beaten by RAF), @Sachingupta (20 Jul, lathi
  charge on the Parliament-bound stretch), @AjitSinghRathi (20 Jul, foreign
  media arriving at Jantar Mantar), @ravish_journo (19 Jul, long observational
  thread on crowd conditions the night before). Handles as rendered by the
  article — resolve exact status URLs manually.
- **X post** — @Nher_who — 20 Jul 2026, 10:58 pm IST —
  https://x.com/Nher_who/status/2079257100279247190 — claims students beaten
  by **Rapid Action Force** (via vercel public record). **CAPTURE CANDIDATE.**
- **Instagram reels (handles/dates unverified — IG blocks our fetcher):**
  - https://www.instagram.com/reel/DbAh5TVA1A5/ — "भयंकर लाठीचार्ज का Live
    Video, Police से भिड़े लोग बोले 'तुम…'" — live lathi-charge video.
    **CAPTURE CANDIDATE.**
  - https://www.instagram.com/reel/DbANoHukTL2/ — Marathi caption, "Jantar
    Mantar student lathicharge". **CAPTURE CANDIDATE.**
  - https://www.instagram.com/reel/DbAy2IYD6Vo/ — "Police lathi charged,
    vacated Jantar Mantar protest site now…" (evening clearance, matches
    evt-016). **CAPTURE CANDIDATE.**
- **YouTube Short** — https://www.youtube.com/shorts/REJNLpGLkrE — "Jantar
  Mantar Protest | 'Tum Kutte Ho!'" — crowd confronting police; channel/view
  count not retrievable this session. **CAPTURE CANDIDATE.**
- **News video page** — Assam Tribune —
  https://assamtribune.com/video/delhi-police-lathi-charge-students-marching-towards-jantar-mantar-1614500
  — police lathi-charge on students marching from **Mandi House metro toward
  Jantar Mantar** (i.e., force used on people trying to *reach* the site, not
  only the Parliament-bound march). **CAPTURE CANDIDATE (hosted video).**
- **X post (amplification)** — @AUThackeray (Aaditya Thackeray) — 20 Jul —
  https://x.com/AUThackeray/status/2079080556671987881 — "What a cowardly
  regime! Using a brutal force against the students…" (embedded in Madhyamam
  article, category 7).

## 5. Injuries and hospital scenes

- **Viral video (platform of origin not identified by carrier)** — the
  13-second "मारो सर, मार डालो हमको" ("hit me sir, kill me") clip: a youth
  crying out under police lathis, 20 Jul — covered by Navbharat Live:
  https://navbharatlive.com/videos/delhi-youth-protest-paper-leak-lathicharge-viral-video-1876912.html
  — article says it is "खूब वायरल" (widely viral) but gives no handle/URL.
  Finding the original upload is a priority. **CAPTURE CANDIDATE (the clip,
  wherever it originates).**
- **YouTube video** — https://www.youtube.com/watch?v=D9kCEsVQq2E — "CJP
  Parliament March LATHICHARGE VIDEO: छात्रों पर लाठीचार्ज, कई लोगों के सिर
  फूटे, चीख पुकार" (heads split open, screaming) — cited by Wikipedia for
  police conduct; channel/views not retrievable. Likely a news channel's
  ground footage rather than raw citizen video. **CAPTURE CANDIDATE.**
- IBTimes UK (category 3 URL) describes video evidence of officers striking
  demonstrators **"including some who had fallen"** and injured protesters
  with **visible head and leg injuries**.
- **X roundup carried by State Mirror** ("इन 5 Videos से जानें वहां के हाल") —
  https://www.statemirror.com/state/delhi-ncr/jantar-mantar-protest-5-videos-cockroach-janata-party-protest-170489
  — embeds five X videos: @sanjayuvacha (pre-violence calm, "hope their cause
  is heard"), @ANI (RPF/police using lathis for crowd control — note ANI
  frames it as crowd control after clashes), @_YogendraYadav ("लोकतंत्र की
  पहली शर्त संवाद है"), @ANI again (Dipke ends hunger strike), @HumdardAlfaaz
  (students with flags, "ये डर अच्छा लगा अंग्रेजों का"). Status URLs not
  rendered — resolve manually. @HumdardAlfaaz and @sanjayuvacha are citizen
  accounts; **CAPTURE CANDIDATES.**
- Hospital-scene citizen footage: **none found this session.** RML/Lady
  Hardinge numbers are outlet-sourced (evt-014). A manual X/IG search for RML
  emergency-ward video from the evening of 20 Jul is the obvious gap.

## 6. Internet shutdown — effects on the ground

- **X post** — @vijaita (Vijaita Singh, The Hindu journalist) —
  https://x.com/vijaita/status/2079393447208009768 — 21 Jul: at least **two
  MHA suspension orders** issued 20 July for a **1.5 km radius of Jantar
  Mantar** — first effective 6 am–12 noon, then extended to 6 pm. "Did the
  government assume the protests would be over by 12 noon?" This is the
  closest thing to the unpublished orders' contents in the public record.
  **CAPTURE CANDIDATE** (post + any attached order images). Note: contradicts
  The South First's "5-km radius" (evt-009) — radius now disputed, 1.5 km has
  the stronger sourcing.
- **Medianama** (fetch 403'd; search snippet) —
  https://www.medianama.com/2026/07/223-internet-shutdown-delhi-jantar-mantar-protest-march/
  — shutdown hampered photo/video transmission from the site; journalists
  and demonstrators fell back on WiFi from nearby establishments; one person
  filed updates through a nearby **Jio hotspot with 34 MB of data**.
  First-person shutdown-workaround detail; identify whose account.
- **WION** (403'd; headline + search snippet) —
  https://www.wionews.com/india-news/lathi-charge-tear-gas-commuters-jumping-metro-gates-videos-show-what-s-happening-at-cjp-s-chalo-sansad-march-watch-1784529207478
  — video compilation including **commuters jumping metro gates** amid
  station closures. Videos not extracted — manual visit needed.
- **The Wire** — telecoms confirmed receiving suspension orders while no
  order was published —
  https://m.thewire.in/article/government/telecom-companies-confirm-delhi-internet-shutdown-order-government-yet-to-publish-it

## 7. Contradicting official statements

- **X post (official, preserve as the contradicted artifact)** —
  @DelhiPolice — https://x.com/DelhiPolice/status/2079072102691565811 —
  20 Jul denial that any force was used ("handled professionally"), posted
  while beating videos were already circulating; contradicted the same
  evening by police's own injury figures (evt-011). **CAPTURE CANDIDATE —
  this is the single most important screenshot for the contradiction file.**
- **News article built on the contradiction** — Madhyamam —
  https://madhyamamonline.com/india/delhi-police-deny-lathi-charge-on-cjp-protesters-despite-viral-videos-from-jantar-mantar-1538938
  — "Delhi Police deny lathi charge … despite viral videos"; embeds
  @AUThackeray.
- **X posts (detention record vs "detainees were not students")** —
  @TyrantOppressor —
  https://x.com/TyrantOppressor/status/2079092607502954810 (detainees loaded
  into police buses, video) and
  https://x.com/TyrantOppressor/status/2079143362511466590 (further
  detention video) — both via Wikipedia citations. Police claimed detainees
  "were not students" (evt-017); these videos are the checkable counter-
  record. **CAPTURE CANDIDATES.**
- **X post** — @Kumarjyoti49291 —
  https://x.com/Kumarjyoti49291/status/2079199366217453738 — video claimed to
  show **electrified barricades**. Extraordinary claim, single source, no
  outlet pickup found (targeted search returned nothing). Keep at claimed,
  lowest confidence; capture anyway before deletion. **CAPTURE CANDIDATE.**
- **X posts (accountability queries, evening 20 Jul, via vercel record):**
  - @zoo_bear (Mohammed Zubair, Alt News) — 11:37 pm —
    https://x.com/zoo_bear/status/2079266851092357382 — "Protesters are
    treated like terrorists by the Police."
  - @zoo_bear — 11:42 pm —
    https://x.com/zoo_bear/status/2079268139297276087 — query about injury to
    @raghav_chadha (AAP MP) — if an MP was hurt, that is independently
    checkable.
  - @SauravDassss (Saurav Das, CJP spokesperson) — 11:13 pm —
    https://x.com/SauravDassss/status/2079260994820546764 — query to the
    Police Commissioner.
  - @AshutoshRanka (CJP spokesperson) — 12:47 am 21 Jul —
    https://x.com/AshutoshRanka/status/2079284642583331114 — "Delhi police
    has crossed too many limits today."
  - @nakulssawhney (documentary filmmaker) — 11:43 pm —
    https://x.com/nakulssawhney/status/2079268541556293762 — relays an
    account "from Arun Arora" (content unclear from listing — fetch).
  - @parijatpragya — 10:59 pm —
    https://x.com/parijatpragya/status/2079257405725274341 — repost about
    algorithmic amplification of CJP content (context, not evidence).

## Counter-record: misinformation already in circulation (archive hygiene)

Do NOT ingest these as evidence; keep them to inoculate the vault.

- **The Quint fact-check** — old 2023 pro-Palestine-protest video recycled as
  CJP-protest footage (woman's flag snatched) —
  https://www.thequint.com/news/webqoof/old-unrelated-video-shared-as-a-visual-from-the-cjp-protest-at-jantar-mantar-false-claim-fact-check
- **Delhi Police debunk (19 Jul)** — viral video falsely linking actor Vijay
  to the protest —
  https://newskarnataka.com/india/delhi-police-debunks-viral-claim-linking-vijay-to-jantar-mantar-protest/20072026/
- **Student "threat" video** — viral clip of a student saying protesters
  would "उखाड़ फेंकेंगे" Parliament if the minister doesn't resign — used to
  justify the security posture —
  https://newstrack.com/india/student-threat-video-goes-viral-delhi-jantar-mantar-protest-parliament-security-tightened-video-616427
  — genuine citizen video, cuts the other way; capture it too (the archive's
  credibility depends on keeping unflattering material). **CAPTURE
  CANDIDATE.**
- The Geetanjali-Angmo/12-year-old viral post (category 3) sits on this
  boundary: police call it false; original not yet located.

## Amplification layer (context, not primary evidence)

Celebrity/politician posts that pushed citizen footage into the mainstream —
useful for takedown-pressure timeline, not for the evidence vault:
Sonu Sood, Diljit Dosanjh (Instagram, 21 Jul), Elvish Yadav, Riteish
Deshmukh & Genelia, Vir Das (post later **deleted** — deletion itself is a
data point) —
https://www.ibtimes.co.in/students-dont-deserve-lathi-sonu-sood-diljit-dosanjh-elvish-yadav-celebs-slam-delhi-police-904052 ;
Uorfi Javed (Filmibeat, 403'd); Hanumankind joining the protest —
https://www.outlookindia.com/art-entertainment/hanumankind-joins-chalo-sansad-protest-reacts-to-viral-post-targeting-diljit-dosanjh ;
mobilization-phase reels (pre-crackdown): "Chalo sansad! Let's march
together" https://www.instagram.com/reel/Da_oXNyvSDh/ , permission-denial
explainer https://www.instagram.com/reel/DZz2-Hlky_d/ , police-denial reel
https://www.instagram.com/reel/Da7BOakBH6c/ (all handles/dates unverified).

## What could not be reached (honest gaps)

1. Reddit — fully blocked to our tooling; zero coverage above.
2. Direct X post content — all descriptions second-hand; several handles
   (bhadas4media, statemirror embeds) lack status URLs.
3. Instagram handles/dates/view counts — search titles only.
4. Telegram-channel reposts — targeted search found nothing indexed.
5. Hospital-scene citizen footage — not found.
6. The remaining 31 of 39 sources on delhi-police-violence.vercel.app —
   behind client-side pagination.
7. Virality numbers (views/likes/shares) — not retrievable for any item;
   "viral" claims above are the carrying outlet's characterisation.
