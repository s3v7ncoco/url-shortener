// Cloudflare Pages Function: POST /api/shorten
// Expects JSON: { url: string, code?: string, mode?: 'instant' | 'timer' }
// Stores { url, mode, createdAt, visits } in KV (binding name: SHORTLINKS)

const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LEN = 6;

function genCode(n = CODE_LEN) {
  let id = '';
  for (let i = 0; i < n; i++) id += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return id;
}

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

export async function onRequestPost({ request, env }) {
  if (!env.SHORTLINKS) {
    return new Response(JSON.stringify({ error: 'KV binding SHORTLINKS not configured' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  const url = (body.url || '').trim();
  let code = (body.code || '').trim();
  const mode = (body.mode === 'timer') ? 'timer' : 'instant';

  if (!isValidHttpUrl(url)) {
    return new Response(JSON.stringify({ error: 'Invalid URL. Use http(s)://' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Generate or validate code
  if (!code) {
    // Try up to a few times to avoid collisions
    for (let i = 0; i < 5; i++) {
      const candidate = genCode();
      const exists = await env.SHORTLINKS.get(candidate);
      if (!exists) { code = candidate; break; }
    }
    if (!code) {
      return new Response(JSON.stringify({ error: 'Could not generate unique code' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  } else {
    // simple sanitation
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'Custom code must be 2–40 chars: letters, numbers, _ or -' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    const exists = await env.SHORTLINKS.get(code);
    if (exists) {
      return new Response(JSON.stringify({ error: 'This code is already taken' }), { status: 409, headers: { 'content-type': 'application/json' } });
    }
  }

  const record = {
    url,
    mode,               // 'instant' | 'timer'
    createdAt: Date.now(),
    visits: 0
  };

  await env.SHORTLINKS.put(code, JSON.stringify(record), { metadata: { createdAt: record.createdAt, mode } });

  // Build short URL from request origin
  const reqUrl = new URL(request.url);
  const shortUrl = `${reqUrl.protocol}//${reqUrl.host}/r/${code}`;

  return new Response(JSON.stringify({ code, shortUrl }), { headers: { 'content-type': 'application/json' } });
}
