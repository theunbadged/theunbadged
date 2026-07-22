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
 *
 * Anti-spam (docs/decisions/0006): because we keep no per-visitor state, all
 * abuse controls are anonymous by construction —
 *  - content sniffing (magic bytes): evidence media in, executables out;
 *    unknown-but-plausible formats are stored and flagged, never dropped;
 *  - per-submission budgets (files, bytes) enforced across requests;
 *  - global per-minute rate gates, one counter for everyone, no identifiers.
 */
import { AwsClient } from "aws4fetch";

const MAX_SMALL = 100 * 1024 * 1024;        // per-file cap through the worker
const MAX_LARGE = 2 * 1024 * 1024 * 1024;   // per-file cap via presigned PUT
const MAX_FILES = 20;                       // per submission, across requests
const MAX_SUB_BYTES = 4 * 1024 * 1024 * 1024; // per submission, across requests
const MIN_FILE = 64;                        // floor: empty junk is not evidence
const MAX_FIELD = 4000;

/* global gates: one counter for all visitors — anonymity-preserving flood
   control. Generous: a protest-scale rush fits; a script flood does not. */
const RATE = { sub: 30, init: 90 };         // new submissions / presign grants per minute

const ALLOWED_ORIGINS = /^https:\/\/(www\.)?theunbadged\.com$|^https:\/\/[a-z0-9-]+\.theunbadged\.pages\.dev$/;

const ALLOWED_EXT = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".avif",
  ".tif", ".tiff", ".bmp", ".dng",
  ".mp4", ".mov", ".m4v", ".3gp", ".mkv", ".webm", ".avi", ".mts", ".m2ts", ".wmv",
  ".mp3", ".m4a", ".aac", ".wav", ".ogg", ".opus", ".flac", ".amr",
  ".pdf"
]);

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

/* ---------- content sniffing (magic bytes) ----------
   Bias: never lose real evidence. Definite junk (executables, archives) is
   refused; recognized media is accepted regardless of declared type; anything
   unrecognized is accepted only if it *claims* to be media with a plausible
   extension, and is flagged for operator triage at ingest. */

function sniffKind(b) {
  const at = (off, ...sig) => sig.every((v, i) => b[off + i] === v);
  // definite junk first
  if (at(0, 0x4D, 0x5A)) return "reject";                    // MZ: Windows executable
  if (at(0, 0x7F, 0x45, 0x4C, 0x46)) return "reject";        // ELF
  if (at(0, 0x50, 0x4B, 0x03, 0x04)) return "reject";        // ZIP/APK/docx containers
  // images
  if (at(0, 0xFF, 0xD8, 0xFF)) return "image";               // JPEG
  if (at(0, 0x89, 0x50, 0x4E, 0x47)) return "image";         // PNG
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image";         // GIF
  if (at(0, 0x49, 0x49, 0x2A, 0x00) || at(0, 0x4D, 0x4D, 0x00, 0x2A)) return "image"; // TIFF/DNG
  if (at(0, 0x42, 0x4D)) return "image";                     // BMP
  // ISO-BMFF family: mp4/mov/3gp/m4a/heic/avif all carry "ftyp" at offset 4
  if (at(4, 0x66, 0x74, 0x79, 0x70)) return "av";
  if (at(0, 0x1A, 0x45, 0xDF, 0xA3)) return "av";            // Matroska/WebM
  if (at(0, 0x52, 0x49, 0x46, 0x46)) {                       // RIFF: WebP/AVI/WAV
    return at(8, 0x57, 0x45, 0x42, 0x50) ? "image" : "av";
  }
  if (at(0, 0x4F, 0x67, 0x67, 0x53)) return "av";            // Ogg/Opus
  if (at(0, 0x66, 0x4C, 0x61, 0x43)) return "av";            // FLAC
  if (at(0, 0x49, 0x44, 0x33)) return "av";                  // MP3 (ID3)
  if (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) return "av";  // MP3 frame sync
  if (at(0, 0x23, 0x21, 0x41, 0x4D, 0x52)) return "av";      // AMR
  if (at(0, 0x25, 0x50, 0x44, 0x46)) return "pdf";           // %PDF
  return "unknown";
}

function looksLikeMedia(declaredType, ext) {
  const t = String(declaredType || "");
  const typed = t.startsWith("image/") || t.startsWith("video/") ||
                t.startsWith("audio/") || t === "application/pdf";
  return typed && ALLOWED_EXT.has(ext);
}

/** Decide a file's fate from its first bytes + declaration. */
function vet(firstBytes, declaredType, ext) {
  const kind = sniffKind(firstBytes);
  if (kind === "reject") throw fail(415, "file type not accepted");
  if (kind === "unknown" && !looksLikeMedia(declaredType, ext))
    throw fail(415, "file type not accepted");
  return kind; // "image" | "av" | "pdf" | "unknown" (flagged, still stored)
}

/* ---------- anonymous flood control ----------
   A single per-minute counter in the mailbox bucket, shared by everyone.
   No identifiers are read or stored; the only state is "how many, this
   minute". Counters from ten minutes ago are opportunistically deleted. */

async function rateGate(env, name, cap) {
  const minute = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  const key = `rate/${name}-${minute}`;
  const cur = await env.INTAKE.get(key);
  const n = cur ? parseInt(await cur.text(), 10) || 0 : 0;
  if (n >= cap) throw fail(429, "intake is busy right now; please retry in a minute");
  await env.INTAKE.put(key, String(n + 1));
  // best-effort cleanup of a stale counter (no await failure matters)
  const old = new Date(Date.now() - 10 * 60 * 1000).toISOString().slice(0, 16);
  env.INTAKE.delete(`rate/${name}-${old}`).catch?.(() => {});
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
  await rateGate(env, "sub", RATE.sub);
  const id = crypto.randomUUID();
  const token = randomHex(16);
  await env.INTAKE.put(`sub/${id}/token.json`, JSON.stringify({
    tokenHash: await sha256hex(token),
    createdAt: istNow(),
    schema: 1
  }));
  return { id, token };
}

async function loadMeta(env, id) {
  const existing = await env.INTAKE.get(`sub/${id}/meta.json`);
  return existing ? await existing.json() : null;
}

/** Budget check: files and bytes for one submission, across all requests. */
function checkBudget(meta, addFiles, addBytes) {
  const haveFiles = meta?.files?.length || 0;
  const haveBytes = (meta?.files || []).reduce((s, f) => s + (Number(f.size) || 0), 0);
  if (haveFiles + addFiles > MAX_FILES) throw fail(400, "too many files in this submission");
  if (haveBytes + addBytes > MAX_SUB_BYTES) throw fail(413, "submission size limit reached");
}

async function mergeMeta(env, id, fields, newFiles, channel) {
  const key = `sub/${id}/meta.json`;
  const meta = (await loadMeta(env, id)) || {
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

  let rawFields = {};
  try { rawFields = JSON.parse(fd.get("fields") || "{}"); } catch { /* keep empty */ }
  const fields = cleanFields(rawFields);

  const files = fd.getAll("files").filter(f => typeof f === "object" && f.size > 0);
  if (!files.length && !fields.description && !fields.location) throw fail(400, "empty submission");
  if (files.length > MAX_FILES) throw fail(400, "too many files");

  // vet everything BEFORE creating any state: junk never mints a submission
  const vetted = [];
  let addBytes = 0;
  for (const f of files) {
    if (f.size > MAX_SMALL) throw fail(413, "file too large for this channel");
    if (f.size < MIN_FILE) throw fail(400, "file is empty");
    const ext = safeExt(f.name);
    const head = new Uint8Array(await f.slice(0, 16).arrayBuffer());
    const sniff = vet(head, f.type, ext);
    vetted.push({ f, ext, sniff });
    addBytes += f.size;
  }

  const ref = fd.get("ref") || null;
  const sub = await submission(env, ref);
  checkBudget(ref ? await loadMeta(env, sub.id) : null, vetted.length, addBytes);

  const stored = [];
  for (const { f, ext, sniff } of vetted) {
    const key = `sub/${sub.id}/f-${randomHex(4)}${ext}`;
    await env.INTAKE.put(key, f.stream(), {
      httpMetadata: { contentType: f.type || "application/octet-stream" }
    });
    stored.push({
      key,
      originalName: String(f.name || "").slice(0, 300),
      size: f.size,
      type: f.type || "",
      sniff
    });
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
  if (size < MIN_FILE) throw fail(400, "file is empty");

  // large uploads bypass the worker, so bytes can't be sniffed here —
  // finalize() range-reads them from R2 instead. Extension gate now:
  const ext = safeExt(body.name);
  if (!ALLOWED_EXT.has(ext)) throw fail(415, "file type not accepted");

  await rateGate(env, "init", RATE.init);
  const sub = await submission(env, body.ref || null);
  checkBudget(body.ref ? await loadMeta(env, sub.id) : null, 1, size);

  const key = `sub/${sub.id}/f-${randomHex(4)}${ext}`;

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

    // sniff the uploaded bytes; delete definite junk from the mailbox
    const range = await env.INTAKE.get(key, { range: { offset: 0, length: 16 } });
    const first = new Uint8Array(range ? await range.arrayBuffer() : 0);
    let sniff;
    try {
      sniff = vet(first, k.type, safeExt(key));
    } catch (e) {
      await env.INTAKE.delete(key);
      throw e;
    }

    stored.push({
      key,
      originalName: String(k.name || "").slice(0, 300),
      size: head.size,
      type: String(k.type || ""),
      sniff
    });
  }

  await mergeMeta(env, sub.id, cleanFields(body.fields), stored, "webform");
  return { ok: true, ref: sub.id };
}
