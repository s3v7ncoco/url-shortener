# Free - URL Shortener
A minimal, open-source URL shortener you can run on **Cloudflare Pages Functions** (serverless) or classic shared hosting (**PHP** fallback).

**[👉 Shorten your link now](https://url-shortener-1kp.pages.dev/)**

## Features
- Clean frontend (HTML/CSS/JS)
- Short link creation via `/api/shorten`
- Instant or 5s timer redirect page
- Cloudflare KV support
- PHP fallback for shared hosting

## Deploy
- Connect repo to Cloudflare Pages (no build command, output folder = `public`)
- Add KV binding named `SHORTLINKS`
- Or upload to classic hosting with `api.php` and `.htaccess`.

MIT License © 2025 Luc Constantin
