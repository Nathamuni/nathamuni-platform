var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/auth.mjs
var PBKDF2_ITERATIONS = 1e5;
var SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
var AUTH_PER_IP_HOURLY_LIMIT = 12;
var MIN_PASSWORD_LEN = 8;
var MAX_PASSWORD_LEN = 200;
var MAX_PROGRESS_BYTES = 1e5;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var COOKIE_NAME = "nm_session";
var enc = new TextEncoder();
var dec = new TextDecoder();
function toB64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(toB64url, "toB64url");
function fromB64url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
__name(fromB64url, "fromB64url");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
async function hashPassword(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}
__name(hashPassword, "hashPassword");
async function getAuthSecret(kv) {
  let secret = await kv.get("_auth_secret");
  if (!secret) {
    secret = toB64url(crypto.getRandomValues(new Uint8Array(32)));
    await kv.put("_auth_secret", secret);
  }
  return secret;
}
__name(getAuthSecret, "getAuthSecret");
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toB64url(new Uint8Array(sig));
}
__name(hmac, "hmac");
async function signSession(kv, email) {
  const secret = await getAuthSecret(kv);
  const payload = { email, exp: Math.floor(Date.now() / 1e3) + SESSION_TTL_SECONDS };
  const payloadB64 = toB64url(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}
__name(signSession, "signSession");
async function verifySession(kv, token) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const secret = await getAuthSecret(kv);
  const expected = await hmac(secret, payloadB64);
  if (!timingSafeEqual(enc.encode(sig), enc.encode(expected))) return null;
  let payload;
  try {
    payload = JSON.parse(dec.decode(fromB64url(payloadB64)));
  } catch {
    return null;
  }
  if (!payload?.email || !payload?.exp || payload.exp < Math.floor(Date.now() / 1e3)) return null;
  return payload.email;
}
__name(verifySession, "verifySession");
function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}
__name(sessionCookie, "sessionCookie");
function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
__name(clearCookie, "clearCookie");
function readSessionCookie(request) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return m ? m[1] : null;
}
__name(readSessionCookie, "readSessionCookie");
async function currentUser(kv, request) {
  const token = readSessionCookie(request);
  if (!token) return null;
  return verifySession(kv, token);
}
__name(currentUser, "currentUser");
async function loadProgress(kv, email) {
  return await kv.get(`progress:${email}`, "json") ?? {};
}
__name(loadProgress, "loadProgress");
async function saveProgress(kv, email, incoming) {
  const existing = await kv.get(`progress:${email}`, "json") ?? {};
  const merged = { ...existing, ...incoming, _updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await kv.put(`progress:${email}`, JSON.stringify(merged));
  return merged;
}
__name(saveProgress, "saveProgress");
async function authRateLimited(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = Math.floor(Date.now() / 36e5);
  const key = new Request(`https://cache.internal/auth-rate/${ip}/${bucket}`);
  const cache = caches.default;
  const res = await cache.match(key);
  const count = res ? (await res.json().catch(() => ({ count: 0 }))).count ?? 0 : 0;
  if (count >= AUTH_PER_IP_HOURLY_LIMIT) return true;
  await cache.put(
    key,
    new Response(JSON.stringify({ count: count + 1 }), {
      headers: { "content-type": "application/json", "cache-control": "max-age=3600" }
    })
  );
  return false;
}
__name(authRateLimited, "authRateLimited");
function json(obj, status = 200, cookie) {
  const headers = { "content-type": "application/json" };
  if (cookie) headers["set-cookie"] = cookie;
  return new Response(JSON.stringify(obj), { status, headers });
}
__name(json, "json");
async function handleAuth(request, env, subpath) {
  if (!env.INBOX) {
    return json(
      { error: "Accounts are opening soon \u2014 your progress is still safe in this browser." },
      503
    );
  }
  const kv = env.INBOX;
  if (subpath === "me" && request.method === "GET") {
    const email = await currentUser(kv, request);
    if (!email) return json({ authed: false });
    return json({ authed: true, email, progress: await loadProgress(kv, email) });
  }
  if (subpath === "logout" && request.method === "POST") {
    return json({ ok: true }, 200, clearCookie());
  }
  if ((subpath === "signup" || subpath === "login") && request.method === "POST") {
    if (await authRateLimited(request)) {
      return json({ error: "Too many attempts \u2014 wait a little and try again." }, 429);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }
    const email = (body?.email ?? "").toString().trim().toLowerCase();
    const password = (body?.password ?? "").toString();
    const localProgress = body?.progress && typeof body.progress === "object" ? body.progress : null;
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: "That email does not look right." }, 400);
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return json({ error: `Use at least ${MIN_PASSWORD_LEN} characters for your password.` }, 400);
    }
    if (password.length > MAX_PASSWORD_LEN) {
      return json({ error: "That password is too long." }, 400);
    }
    if (localProgress && JSON.stringify(localProgress).length > MAX_PROGRESS_BYTES) {
      return json({ error: "Too much saved progress to sync at once." }, 413);
    }
    const userKey = `user:${email}`;
    const existing = await kv.get(userKey, "json");
    if (subpath === "signup") {
      if (existing) {
        return json({ error: "An account with that email already exists \u2014 try logging in." }, 409);
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hash = await hashPassword(password, salt);
      await kv.put(
        userKey,
        JSON.stringify({
          email,
          salt: toB64url(salt),
          hash: toB64url(hash),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        })
      );
      let progress2 = {};
      if (localProgress) progress2 = await saveProgress(kv, email, localProgress);
      const token2 = await signSession(kv, email);
      return json({ ok: true, email, progress: progress2 }, 200, sessionCookie(token2));
    }
    if (!existing) {
      return json({ error: "No account with that email yet \u2014 create one first." }, 401);
    }
    const candidate = await hashPassword(password, fromB64url(existing.salt));
    if (!timingSafeEqual(candidate, fromB64url(existing.hash))) {
      return json({ error: "Email or password is wrong." }, 401);
    }
    let progress = await loadProgress(kv, email);
    if (localProgress && Object.keys(progress).filter((k) => k !== "_updatedAt").length === 0) {
      progress = await saveProgress(kv, email, localProgress);
    }
    const token = await signSession(kv, email);
    return json({ ok: true, email, progress }, 200, sessionCookie(token));
  }
  if (subpath === "progress" && request.method === "POST") {
    const email = await currentUser(kv, request);
    if (!email) return json({ error: "Not signed in." }, 401);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }
    if (!body?.progress || typeof body.progress !== "object") {
      return json({ error: "Nothing to save." }, 400);
    }
    if (JSON.stringify(body.progress).length > MAX_PROGRESS_BYTES) {
      return json({ error: "Too much data to save." }, 413);
    }
    const merged = await saveProgress(kv, email, body.progress);
    return json({ ok: true, progress: merged });
  }
  return json({ error: "Not found." }, 404);
}
__name(handleAuth, "handleAuth");

// worker/index.mjs
var MODEL = "@cf/baai/bge-m3";
var TOP_K = 12;
var EMBED_BATCH = 90;
var ASK_MODEL = "@cf/zai-org/glm-4.7-flash";
var ASK_FALLBACK_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
var ASK_MAX_QUESTION_LEN = 300;
var ASK_MAX_TOKENS = 1400;
var ASK_TOP_K = 5;
var ASK_MIN_SCORE = 0.35;
var ASK_PER_IP_HOURLY_LIMIT = 10;
var ASK_GLOBAL_DAILY_LIMIT = 300;
var SYSTEM_PROMPT = `You are the AI twin of Nathamuni, speaking directly on his website.

Voice: direct, engineer's clarity, zero guru-speak, tested-on-myself-first, one light Tamil warmth phrase at most. No motivational clich\xE9s, no bullet-point essays unless the question genuinely calls for steps.

You may ONLY use the facts in the CONTEXT block below. If someone asks about Nathamuni and the answer isn't in that context, say plainly that you only speak from what he has published, and suggest they ask him directly on Instagram. NEVER invent biographical details, dates, numbers, or events that aren't in the context.

Refuse \u2014 briefly and without judgment \u2014 any question about: salary or money specifics, relationship status, family details, health history beyond the published back-injury story, phone number, email, address, or anything else private. Point them to Instagram for anything personal.

For general questions about life, discipline, habits, training, or AI that aren't specifically about Nathamuni's biography, answer the way he would: practical, systems-first, concrete and testable, referencing his own tested experience from the context where it's genuinely relevant. Keep answers short \u2014 a few sentences to a short paragraph.`;
var memoryCache = null;
var personaCache = null;
var ipHourlyMemory = /* @__PURE__ */ new Map();
async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
__name(cosine, "cosine");
async function embedTexts(env, texts) {
  const vectors = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await env.AI.run(MODEL, { text: batch });
    vectors.push(...res.data);
  }
  return vectors;
}
__name(embedTexts, "embedTexts");
async function getIndex(env, request) {
  const indexRes = await env.ASSETS.fetch(new URL("/search-index.json", request.url));
  if (!indexRes.ok) throw new Error("search index missing from build");
  const indexText = await indexRes.text();
  const hash = await sha256(indexText);
  if (memoryCache?.hash === hash) return memoryCache;
  const cacheKey = new Request(`https://cache.internal/search-vectors/${hash}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  const items = JSON.parse(indexText);
  if (cached) {
    const vectors2 = await cached.json();
    memoryCache = { hash, vectors: vectors2, items };
    return memoryCache;
  }
  const texts = items.map(
    (it) => [it.title, it.category, it.tags.join(" "), it.text].filter(Boolean).join("\n")
  );
  const vectors = await embedTexts(env, texts);
  await cache.put(
    cacheKey,
    new Response(JSON.stringify(vectors), {
      headers: { "content-type": "application/json", "cache-control": "max-age=604800" }
    })
  );
  memoryCache = { hash, vectors, items };
  return memoryCache;
}
__name(getIndex, "getIndex");
async function getPersona(env, request) {
  if (personaCache) return personaCache;
  const res = await env.ASSETS.fetch(new URL("/persona.json", request.url));
  if (!res.ok) throw new Error("persona.json missing from build");
  personaCache = await res.json();
  return personaCache;
}
__name(getPersona, "getPersona");
function buildAskContext(persona, relatedItems) {
  const facts = persona.facts.map((f) => `- ${f}`).join("\n");
  const voice = persona.voice.slice(0, 5).map((v) => `- ${v}`).join("\n");
  const related = relatedItems.length ? relatedItems.map((it) => `- [${it.category}] "${it.title}": ${it.text}`).join("\n") : "(nothing specifically relevant in the video library for this question)";
  return `PUBLISHED FACTS ABOUT NATHAMUNI:
${facts}

VOICE SAMPLES (match this tone, don't just quote it):
${voice}

RELEVANT LIBRARY ENTRIES FOR THIS QUESTION:
${related}`;
}
__name(buildAskContext, "buildAskContext");
function hourBucket(date = /* @__PURE__ */ new Date()) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}${String(date.getUTCHours()).padStart(2, "0")}`;
}
__name(hourBucket, "hourBucket");
function dayBucket(date = /* @__PURE__ */ new Date()) {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}
__name(dayBucket, "dayBucket");
async function readCounter(cache, key) {
  const res = await cache.match(key);
  if (!res) return 0;
  const data = await res.json().catch(() => null);
  return data?.count ?? 0;
}
__name(readCounter, "readCounter");
async function writeCounter(cache, key, count, maxAgeSeconds) {
  await cache.put(
    key,
    new Response(JSON.stringify({ count }), {
      headers: { "content-type": "application/json", "cache-control": `max-age=${maxAgeSeconds}` }
    })
  );
}
__name(writeCounter, "writeCounter");
async function checkAndBumpRateLimit(env, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Date.now();
  const mem = ipHourlyMemory.get(ip);
  if (mem && mem.resetAt > now && mem.count >= ASK_PER_IP_HOURLY_LIMIT) {
    return { allowed: false, reason: "ip" };
  }
  const cache = caches.default;
  const hourKey = new Request(`https://cache.internal/ask-rate/ip/${ip}/${hourBucket()}`);
  const dayKey = new Request(`https://cache.internal/ask-rate/global/${dayBucket()}`);
  const [ipCount, globalCount] = await Promise.all([readCounter(cache, hourKey), readCounter(cache, dayKey)]);
  if (globalCount >= ASK_GLOBAL_DAILY_LIMIT) return { allowed: false, reason: "global" };
  if (ipCount >= ASK_PER_IP_HOURLY_LIMIT) return { allowed: false, reason: "ip" };
  await Promise.all([
    writeCounter(cache, hourKey, ipCount + 1, 3600),
    writeCounter(cache, dayKey, globalCount + 1, 9e4)
  ]);
  if (!mem || mem.resetAt <= now) {
    ipHourlyMemory.set(ip, { count: 1, resetAt: now + 36e5 });
  } else {
    mem.count += 1;
  }
  if (ipHourlyMemory.size > 5e3) ipHourlyMemory.clear();
  return { allowed: true };
}
__name(checkAndBumpRateLimit, "checkAndBumpRateLimit");
async function logQuestion(env, question, outcome) {
  if (!env.INBOX) return;
  try {
    const key = `q:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    await env.INBOX.put(key, JSON.stringify({ question, outcome, at: (/* @__PURE__ */ new Date()).toISOString() }));
  } catch (err) {
    console.warn("question log skipped:", err.message);
  }
}
__name(logQuestion, "logQuestion");
var JOIN_MAX_AMBITION_LEN = 200;
var EMAIL_RE2 = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function sendJoinConfirmation(env, email, { confirmToken, unsubToken, alreadyConfirmed, origin }) {
  const from = env.JOIN_FROM_EMAIL;
  if (!from) {
    console.error("join: RESEND_API_KEY set but JOIN_FROM_EMAIL missing");
    return false;
  }
  const confirmUrl = `${origin}/api/join/confirm?token=${confirmToken}`;
  const unsubUrl = `${origin}/api/join/unsubscribe?token=${unsubToken}`;
  const body = alreadyConfirmed ? [
    "You're already on the list on nathamuni.com \u2014 nothing further to do.",
    "",
    "Want off it? One click, no questions:",
    unsubUrl
  ] : [
    "You asked to join the list on nathamuni.com.",
    "",
    "Confirm here (the link works for 7 days):",
    confirmUrl,
    "",
    "If this wasn't you, ignore this email \u2014 nothing will be sent, and the request",
    "expires on its own.",
    "",
    "Unsubscribe at any time:",
    unsubUrl
  ];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: alreadyConfirmed ? "You're already on the list" : "Confirm your spot",
        text: body.join("\n"),
        // Lets mail clients offer native one-click unsubscribe, and keeps senders in
        // good standing with Gmail/Yahoo bulk requirements.
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      })
    });
    if (!res.ok) {
      console.error("join: resend responded", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("join: resend failed", err.message);
    return false;
  }
}
__name(sendJoinConfirmation, "sendJoinConfirmation");
async function handleJoinToken(request, env, action) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const page = /* @__PURE__ */ __name((msg, extra = "") => new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${msg}</title><body style="background:#0d0a1f;color:#f5f3ff;font:16px/1.6 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:2rem"><main><p>${msg}</p>${extra}<p><a style="color:#b294ff" href="/">\u2190 nathamuni.com</a></p></main>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        // Bearer token sits in the URL: keep it out of referrers and shared caches.
        "referrer-policy": "no-referrer",
        "cache-control": "no-store"
      }
    }
  ), "page");
  const confirmButton = /* @__PURE__ */ __name((label) => `<form method="POST"><button style="margin:1rem 0;padding:.7rem 1.4rem;border-radius:9999px;border:1px solid #b294ff59;background:#8b5cf62e;color:#f5f3ff;font:inherit;cursor:pointer">${label}</button></form>`, "confirmButton");
  if (!env.INBOX || !token) return page("That link is not valid.");
  if (request.method === "GET") {
    return action === "unsubscribe" ? page("Unsubscribe from the list?", confirmButton("Yes, unsubscribe me")) : page("Confirm your subscription?", confirmButton("Yes, confirm"));
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (action === "unsubscribe") {
    const email2 = await env.INBOX.get(`unsub:${token}`);
    if (!email2) return page("That link is not valid.");
    const record2 = await env.INBOX.get(`join:${email2}`, "json");
    if (record2?.confirmToken) await env.INBOX.delete(`jointoken:${record2.confirmToken}`);
    await env.INBOX.delete(`join:${email2}`);
    await env.INBOX.delete(`unsub:${token}`);
    return page("Unsubscribed. You will not hear from this list again.");
  }
  const email = await env.INBOX.get(`jointoken:${token}`);
  if (!email) return page("That link has expired or was already used.");
  const record = await env.INBOX.get(`join:${email}`, "json");
  if (!record) return page("That link is no longer valid.");
  await env.INBOX.put(
    `join:${email}`,
    JSON.stringify({ ...record, status: "confirmed", confirmedAt: (/* @__PURE__ */ new Date()).toISOString(), confirmToken: void 0 })
  );
  await env.INBOX.delete(`jointoken:${token}`);
  return page("You're in. Confirmed.");
}
__name(handleJoinToken, "handleJoinToken");
async function handleJoin(request, env) {
  if (request.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if ((body?.website ?? "").toString().trim() !== "") {
    return Response.json({ ok: true });
  }
  if (!env.INBOX || !env.RESEND_API_KEY || !env.JOIN_FROM_EMAIL) {
    return Response.json(
      { error: "The lab list opens very soon \u2014 until then, DM me on Instagram." },
      { status: 503 }
    );
  }
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const ambition = (body?.ambition ?? "").toString().trim().slice(0, JOIN_MAX_AMBITION_LEN);
  if (!EMAIL_RE2.test(email) || email.length > 254) {
    return Response.json({ error: "That email does not look right." }, { status: 400 });
  }
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const cache = caches.default;
  const hourBucket2 = Math.floor(Date.now() / 36e5);
  const joinKey = `https://rate.nathamuni.internal/join/${ip}/${hourBucket2}`;
  const prev = await readCounter(cache, joinKey);
  if (prev >= 5) {
    return Response.json({ error: "Too many attempts \u2014 try again later." }, { status: 429 });
  }
  await writeCounter(cache, joinKey, prev + 1, 3600);
  try {
    const token = crypto.randomUUID();
    const existing = await env.INBOX.get(`join:${email}`, "json");
    const alreadyConfirmed = existing?.status === "confirmed";
    const unsubToken = existing?.unsubToken ?? crypto.randomUUID();
    const PENDING_TTL = 60 * 60 * 24 * 7;
    await env.INBOX.put(
      `join:${email}`,
      JSON.stringify({
        email,
        ambition,
        at: (/* @__PURE__ */ new Date()).toISOString(),
        status: alreadyConfirmed ? "confirmed" : "pending",
        unsubToken,
        confirmToken: alreadyConfirmed ? void 0 : token
      }),
      // An unconfirmed address disappears on its own, so an abandoned signup does not
      // leave someone's email sitting here forever — which is what the email says.
      alreadyConfirmed ? void 0 : { expirationTtl: PENDING_TTL }
    );
    await env.INBOX.put(
      `unsub:${unsubToken}`,
      email,
      alreadyConfirmed ? void 0 : { expirationTtl: PENDING_TTL }
    );
    if (!alreadyConfirmed) {
      await env.INBOX.put(`jointoken:${token}`, email, { expirationTtl: PENDING_TTL });
    }
    const mailKey = `https://rate.nathamuni.internal/joinmail/${encodeURIComponent(email)}`;
    const mailedRecently = await readCounter(cache, mailKey);
    if (mailedRecently >= 1) {
      return Response.json({ ok: true, mailed: true });
    }
    await writeCounter(cache, mailKey, 1, 900);
    const origin = new URL(request.url).origin;
    const sent = await sendJoinConfirmation(env, email, {
      confirmToken: token,
      unsubToken,
      alreadyConfirmed,
      origin
    });
    return Response.json({ ok: true, mailed: sent });
  } catch (err) {
    console.error("join error:", err.message);
    return Response.json({ error: "Could not save that just now \u2014 try again." }, { status: 500 });
  }
}
__name(handleJoin, "handleJoin");
async function handleAsk(request, env) {
  if (request.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const question = (body?.question ?? "").toString().trim();
  if (!question) {
    return Response.json({ error: "Ask something first." }, { status: 400 });
  }
  if (question.length > ASK_MAX_QUESTION_LEN) {
    return Response.json(
      { error: `Keep it under ${ASK_MAX_QUESTION_LEN} characters \u2014 short questions get better answers.` },
      { status: 400 }
    );
  }
  const rate = await checkAndBumpRateLimit(env, request);
  if (!rate.allowed) {
    const message = rate.reason === "global" ? "The twin is resting for today \u2014 the free daily quota ran out. Try again tomorrow, or ask the real one on Instagram." : "That's enough questions for this hour \u2014 give the twin a breather and try again later.";
    return Response.json({ error: message }, { status: 429 });
  }
  try {
    const [persona, { vectors, items }] = await Promise.all([getPersona(env, request), getIndex(env, request)]);
    const [queryVector] = (await env.AI.run(MODEL, { text: [question] })).data;
    const related = items.map((item, i) => ({ item, score: cosine(queryVector, vectors[i]) })).sort((a, b) => b.score - a.score).slice(0, ASK_TOP_K).filter((r) => r.score > ASK_MIN_SCORE).map((r) => r.item);
    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}

${buildAskContext(persona, related)}` },
      { role: "user", content: question }
    ];
    let answer = "";
    let lastError = "no attempt produced text";
    for (const attempt of [
      { model: ASK_MODEL, messages, max_tokens: ASK_MAX_TOKENS },
      {
        model: ASK_MODEL,
        messages: [
          messages[0],
          {
            role: "user",
            content: `${question}

/nothink
(Answer directly in 2-5 sentences. Do not overthink.)`
          }
        ],
        max_tokens: ASK_MAX_TOKENS + 800
      },
      {
        model: ASK_FALLBACK_MODEL,
        messages: [
          messages[0],
          { role: "user", content: `${question}

(Answer directly in 2-5 sentences.)` }
        ],
        max_tokens: 600
      }
    ]) {
      const { model, ...input } = attempt;
      try {
        const result = await env.AI.run(model, input);
        answer = extractAnswer(result);
        if (answer) break;
        lastError = `${model} returned no visible text: ${JSON.stringify(result).slice(0, 160)}`;
      } catch (err) {
        lastError = `${model} threw: ${err.message}`;
      }
      console.warn("ask attempt failed:", lastError);
    }
    if (!answer) throw new Error(lastError);
    await logQuestion(env, question, "answered");
    return Response.json({ answer });
  } catch (err) {
    console.error("ask error:", err.message);
    await logQuestion(env, question, "failed");
    return Response.json(
      { error: "The twin's brain hiccuped mid-thought \u2014 try asking again in a moment." },
      { status: 200 }
    );
  }
}
__name(handleAsk, "handleAsk");
function extractAnswer(result) {
  if (!result) return "";
  let text = "";
  if (typeof result === "string") text = result;
  else {
    const cand = result.response ?? result.result?.response ?? result.output_text ?? result.choices?.[0]?.message?.content ?? "";
    text = typeof cand === "string" ? cand : "";
  }
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^[\s\S]*?<\/think>/, (m) => m.length < text.length ? "" : m).trim();
}
__name(extractAnswer, "extractAnswer");
async function handleVideos(request, env) {
  try {
    const videosRes = await env.ASSETS.fetch(new URL("/videos.json", request.url));
    if (!videosRes.ok) {
      return Response.json({ error: "videos data not found" }, { status: 404 });
    }
    const videos = await videosRes.json();
    return Response.json(videos, { headers: { "cache-control": "public, max-age=300" } });
  } catch (err) {
    console.error("videos error:", err.message);
    return Response.json({ error: "videos unavailable" }, { status: 500 });
  }
}
__name(handleVideos, "handleVideos");
async function handleSearch(request, env) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 200) {
    return Response.json({ results: [] });
  }
  const { vectors, items } = await getIndex(env, request);
  const [queryVector] = (await env.AI.run(MODEL, { text: [q] })).data;
  const scored = items.map((item, i) => ({ id: item.id, score: cosine(queryVector, vectors[i]) })).sort((a, b) => b.score - a.score).slice(0, TOP_K).filter((r) => r.score > 0.4);
  return Response.json(
    { results: scored },
    { headers: { "cache-control": "public, max-age=3600" } }
  );
}
__name(handleSearch, "handleSearch");
var worker = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/videos") {
      return handleVideos(request, env);
    }
    if (pathname === "/api/search") {
      try {
        return await handleSearch(request, env);
      } catch (err) {
        console.error("search error:", err.message);
        return Response.json({ results: [], error: "search unavailable" }, { status: 200 });
      }
    }
    if (pathname === "/api/ask") {
      return handleAsk(request, env);
    }
    if (pathname === "/api/join") {
      try {
        return await handleJoin(request, env);
      } catch (err) {
        console.error("join fatal:", err.message);
        return Response.json({ error: "Could not save that just now \u2014 try again." }, { status: 500 });
      }
    }
    if (pathname === "/api/join/confirm" || pathname === "/api/join/unsubscribe") {
      try {
        return await handleJoinToken(request, env, pathname.endsWith("unsubscribe") ? "unsubscribe" : "confirm");
      } catch (err) {
        console.error("join token fatal:", err.message);
        return new Response("Something went wrong.", { status: 500 });
      }
    }
    if (pathname.startsWith("/api/auth/")) {
      try {
        return await handleAuth(request, env, pathname.slice("/api/auth/".length));
      } catch (err) {
        console.error("auth fatal:", err.message);
        return Response.json({ error: "Something went wrong \u2014 try again." }, { status: 500 });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
var worker_default = worker;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-wXGvba/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-wXGvba/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker2) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker2;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker2.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker2.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker2,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker2.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker2.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
