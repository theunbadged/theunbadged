/**
 * The Unbadged — anonymous evidence intake worker.
 *
 * HARD RULES (see CLAUDE.md / docs/threat-model.md):
 *  - Never read, log, store, or forward submitter IPs, user-agents, or any
 *    request headers beyond what routing strictly needs. There is no
 *    console.log of request data anywhere in this file, and observability is
 *    disabled in wrangler.toml. Keep it that way.
 *  - The R2 bucket is a transient mailbox, not the vault. tools/ingest.py
 *    pulls submissions into the offline vault and deletes them here.
 *
 * Claim tokens: each submission gets a random 128-bit token, returned to the
 * submitter ONCE and stored only as a SHA-256 hash. An anonymous submitter can
 * later prove sourcehood (e.g. to sign a BSA s.63 Part A certificate) by
 * presenting the token. See docs/research/chain-of-custody.md.
 */
import { AwsClient } from "aws4fetch";

const MAX_SMALL = 100 * 1024 * 1024;        // per-file cap through the worker
const MAX_LARGE = 2 * 1024 * 1024 * 1024;   // per-file cap via presigned PUT
const MAX_FILES = 20;
const MAX_FIELD = 4000;

const ALLOWED_ORIGINS = /^https:\/\/(www\.)?theunbadged\.com$|^https:\/\/[a-z0-9-]+\.theunbadged\.pages\.dev$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    try {
      if (request.method === "POST" && url.pathname === "/api/submit")
        return json(await handleSubmit(request, env), 200, cors);
      if (request.method === "POST" && url.pathname === "/api/init-upload")
        return json(await handleInitUpload(request, env), 200, cors);
      if (request.method === "POST" && url.pathname === "/api/finalize")
        return json(await handleFinalize(request, env), 200, cors);
      if (request.method === "GET" && url.pathname === "/api/health")
        return json({ ok: true }, 200, cors);
      return json({ error: "not found" }, 404, cors);
    } catch (err) {
      // Generic error only — no request details, ever.
      const status = err.status || 500;
      return json({ error: err.expose ? err.message : "intake error" }, status, cors);
    }
  }
};

/* ---------- helpers ---------- */

function corsHeaders(origin) {
  const h = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  };
  if (ALLOWED_ORIGINS.test(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  e.expose = true;
  return e;
}

/** IST (UTC+05:30) ISO-8601 timestamp — the archive's canonical timezone. */
function istNow() {
  const shifted = new Date(Date.now() + 5.5 * 3600 * 1000);
  return shifted.toISOString().replace(/\.\d{3}Z$/, "+05:30");
}

function randomHex(bytes) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function sha256hex(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join("");
}

/** Keep only a safe file extension; original names live in meta.json. */
function safeExt(name) {
  const m = String(name || "").match(/\.[A-Za-z0-9]{1,8}$/);
  return m ? m[0].toLowerCase() : ".bin";
}

function cleanFields(raw) {
  const pick = k => String(raw?.[k] ?? "").slice(0, MAX_FIELD).trim();
  return {
    description: pick("description"),
    location: pick("location"),
    when: pick("when"),
    contact: pick("contact")
  };
}

const REF_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Create a new submission (id + claim token) or load an existing one. */
async function submission(env, ref) {
  if (ref) {
    if (!REF_RE.test(ref)) throw fail(400, "bad ref");
    const tok = await env.INTAKE.get(`sub/${ref}/token.json`);
    if (!tok) throw fail(404, "unknown ref");
    return { id: ref, token: null };
  }
  const id = crypto.randomUUID();
  const token = randomHex(16);
  await env.INTAKE.put(`sub/${id}/token.json`, JSON.stringify({
    tokenHash: await sha256hex(token),
    createdAt: istNow(),
    schema: 1
  }));
  return { id, token };
}

async function mergeMeta(env, id, fields, newFiles, channel) {
  const key = `sub/${id}/meta.json`;
  const existing = await env.INTAKE.get(key);
  const meta = existing ? await existing.json() : {
    schema: 1,
    submission: id,
    channel,
    receivedAt: istNow(),
    fields: {},
    files: []
  };
  for (const [k, v] of Object.entries(fields)) {
    if (v && !meta.fields[k]) meta.fields[k] = v;
  }
  meta.files.push(...newFiles);
  meta.updatedAt = istNow();
  await env.INTAKE.put(key, JSON.stringify(meta));
}

/* ---------- routes ---------- */

/** Small files: multipart straight through the worker into R2. */
async function handleSubmit(request, env) {
  const fd = await request.formData().catch(() => { throw fail(400, "bad form data"); });
  const sub = await submission(env, fd.get("ref") || null);

  let rawFields = {};
  try { rawFields = JSON.parse(fd.get("fields") || "{}"); } catch { /* keep empty */ }
  const fields = cleanFields(rawFields);

  const files = fd.getAll("files").filter(f => typeof f === "object" && f.size > 0);
  if (!files.length && !fields.description && !fields.location) throw fail(400, "empty submission");
  if (files.length > MAX_FILES) throw fail(400, "too many files");

  const stored = [];
  for (const f of files) {
    if (f.size > MAX_SMALL) throw fail(413, "file too large for this channel");
    const key = `sub/${sub.id}/f-${randomHex(4)}${safeExt(f.name)}`;
    await env.INTAKE.put(key, f.stream(), {
      httpMetadata: { contentType: f.type || "application/octet-stream" }
    });
    stored.push({ key, originalName: String(f.name || "").slice(0, 300), size: f.size, type: f.type || "" });
  }

  await mergeMeta(env, sub.id, fields, stored, "webform");
  return { ok: true, ref: sub.id, token: sub.token || undefined };
}

/** Large files: presigned direct-to-R2 PUT (bypasses the 100 MB worker limit). */
async function handleInitUpload(request, env) {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || env.R2_ACCOUNT_ID === "SET_ME")
    throw fail(503, "large uploads not configured");

  const body = await request.json().catch(() => { throw fail(400, "bad json"); });
  const size = Number(body.size || 0);
  if (!size || size > MAX_LARGE) throw fail(413, "file exceeds 2 GB limit");

  const sub = await submission(env, body.ref || null);
  const key = `sub/${sub.id}/f-${randomHex(4)}${safeExt(body.name)}`;

  const r2 = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto"
  });
  const target = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`
  );
  target.searchParams.set("X-Amz-Expires", "3600");
  const signed = await r2.sign(new Request(target, { method: "PUT" }), {
    aws: { signQuery: true }
  });

  return { ok: true, url: signed.url, key, ref: sub.id, token: sub.token || undefined };
}

/** After presigned uploads finish: verify the objects and write metadata. */
async function handleFinalize(request, env) {
  const body = await request.json().catch(() => { throw fail(400, "bad json"); });
  const sub = await submission(env, body.ref);

  const keys = Array.isArray(body.keys) ? body.keys.slice(0, MAX_FILES) : [];
  const stored = [];
  for (const k of keys) {
    const key = String(k.key || "");
    if (!key.startsWith(`sub/${sub.id}/f-`)) throw fail(400, "key outside submission");
    const head = await env.INTAKE.head(key);
    if (!head) throw fail(400, "upload missing");
    stored.push({
      key,
      originalName: String(k.name || "").slice(0, 300),
      size: head.size,
      type: String(k.type || "")
    });
  }

  await mergeMeta(env, sub.id, cleanFields(body.fields), stored, "webform");
  return { ok: true, ref: sub.id };
}
