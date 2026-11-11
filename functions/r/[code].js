// Cloudflare Pages Function: GET /r/:code
// - Instant mode: 302 redirect
// - Timer mode: 5s interstitial page (with AdSense placeholder)
// - Force timer by adding ?t=1 to the URL

function htmlTimer({ target, code }) {
  // Paste your AdSense snippet where indicated below.
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="5; url=${target}">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting… | ${code}</title>
  <style>
    body{margin:0;background:#0b1220;color:#e5e7eb;font-family:system-ui,Segoe UI,Roboto,Arial}
    .wrap{max-width:720px;margin:48px auto;padding:24px}
    .card{border:1px solid rgba(148,163,184,.25);background:#0f172a;border-radius:16px;padding:24px}
    h1{margin:0 0 8px;font-size:22px}
    p{margin:8px 0;color:#9aa4b2}
    .timer{font-size:14px;margin-top:10px}
    .bar{height:8px;background:#111827;border-radius:8px;overflow:hidden;margin-top:8px}
    .fill{height:100%;width:0;background:linear-gradient(90deg,#22d3ee,#a78bfa)}
    .ad{margin:18px 0;padding:12px;border:1px dashed rgba(148,163,184,.35);border-radius:12px;text-align:center;color:#94a3b8}
    a.btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:10px;background:#111827;color:#e5e7eb;text-decoration:none;border:1px solid rgba(148,163,184,.25)}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Taking you to your link…</h1>
      <p>We’ll redirect you in <strong id="sec">5</strong> seconds.</p>

      <div class="ad">
        <!-- ✅ Paste your AdSense ad unit below (e.g., <ins class="adsbygoogle">...</ins> + script) -->
        <em>Ad space</em>
      </div>

      <div class="timer">
        Redirecting to: <code>${target.replace(/</g,'&lt;')}</code>
        <div class="bar"><div class="fill" id="fill"></div></div>
      </div>

      <a class="btn" href="${target}">Skip & go now</a>
    </div>
  </div>

  <script>
    let t = 5;
    const sec = document.getElementById('sec');
    const fill = document.getElementById('fill');
    const target = ${JSON.stringify(target)};
    const iv = setInterval(() => {
      t--; sec.textContent = t;
      fill.style.width = ((5 - t) / 5 * 100) + '%';
      if (t <= 0) { clearInterval(iv); location.replace(target); }
    }, 1000);
  </script>
</body>
</html>`;
}

export async function onRequestGet({ params, request, env }) {
  const code = params.code;
  if (!env.SHORTLINKS) {
    return new Response('KV binding SHORTLINKS not configured', { status: 500 });
  }
  const raw = await env.SHORTLINKS.get(code);
  if (!raw) return new Response('Not found', { status: 404 });

  let record;
  try { record = JSON.parse(raw); } catch { return new Response('Broken record', { status: 500 }); }

  // simple visit counter (best-effort)
  try {
    record.visits = (record.visits || 0) + 1;
    await env.SHORTLINKS.put(code, JSON.stringify(record));
  } catch {}

  const forceTimer = new URL(request.url).searchParams.has('t');
  if (record.mode === 'timer' || forceTimer) {
    return new Response(htmlTimer({ target: record.url, code }), {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }

  // Instant redirect
  return Response.redirect(record.url, 302);
}
