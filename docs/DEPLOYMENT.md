# Deployment runbook — theunbadged.com (Cloudflare)

Stack: Cloudflare Pages (static site) + Worker (intake API on `/api/*`) +
R2 bucket (transient submission mailbox). The vault is **local/offline** —
`tools/ingest.py pull` drains the mailbox into it.

## One-time setup

```powershell
# 1. Authenticate wrangler (browser OAuth)
cd intake-worker
npx wrangler login

# 2. Create the intake mailbox bucket
npx wrangler r2 bucket create unbadged-intake

# 3. Put your Cloudflare account ID into intake-worker/wrangler.toml
#    (replace R2_ACCOUNT_ID = "SET_ME"; find it: npx wrangler whoami)

# 4. Deploy the worker
#    NOTE: the /api/* routes need the theunbadged.com zone ACTIVE on this
#    account (nameservers flipped). Until then, deploy will fail on routes —
#    wait for the zone, or comment the routes out temporarily.
npm run deploy

# 5. Create + deploy the Pages site (from repo root)
cd ..
npx wrangler pages project create theunbadged --production-branch main
npx wrangler pages deploy site --project-name theunbadged

# 6. Dashboard (one-time): Pages project → Custom domains →
#    add theunbadged.com and www.theunbadged.com
```

## Redeploying after changes

```powershell
npx wrangler pages deploy site --project-name theunbadged   # site
cd intake-worker && npm run deploy                          # worker
```

## Large-file uploads (>90 MB) — optional second step

Without this, the form still works; files over 90 MB get a clear
"trim and retry" message. To enable up to 2 GB:

1. Dashboard → R2 → Manage API tokens → create token scoped to
   **object read & write on `unbadged-intake` only**.
2. `npx wrangler secret put R2_ACCESS_KEY_ID` and
   `npx wrangler secret put R2_SECRET_ACCESS_KEY` (in intake-worker/).
3. Allow browser PUTs on the bucket:
   `npx wrangler r2 bucket cors set unbadged-intake --file cors.json`
   (cors.json is in intake-worker/).

## Draining the mailbox (run at least daily while submissions flow)

```powershell
# .env at repo root: R2_ACCOUNT_ID, R2_BUCKET=unbadged-intake,
# R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (read+delete token)
py -3.12 tools/ingest.py pull      # R2 → vault, then clears R2
py -3.12 tools/ingest.py verify    # periodic fixity check
```

Then back the vault up (offline copy + off-India encrypted copy) — the
mailbox is empty after pull; the vault is the only holder.

## Privacy invariants — read before touching the dashboard

- **Never enable** Workers Logs, Logpush, or live tail on `unbadged-intake`.
  `[observability] enabled = false` stays false.
- No Web Analytics / RUM on the Pages project. No third-party scripts on the
  site, ever.
- Honest residual risk: Cloudflare terminates TLS and technically sees client
  IPs in transit, like any host. We never write them anywhere, but submitters
  who must not trust any host are told on the submit page to use Tor Browser —
  keep that guidance prominent.
