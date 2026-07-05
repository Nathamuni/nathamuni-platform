# CLAUDE.md — nathamuni.com

## Business

- **Name:** Nathamuni — personal creator content hub
- **Domain:** nathamuni.com (apex domain)
- **Category:** Personal brand / content library
- **Cloudflare Pages project:** nathamuni-com
- **Platform:** Nathamuni Digital Presence Platform

## Site Commands

Run from this directory (`sites/nathamuni-com/`):

```bash
npm run dev        # localhost:3000
npm run build      # static export to out/
npm run lint
npm run type-check
npm test           # vitest
```

## Content & Assets

- **Video data:** `lib/videos.json` — edit directly to add/update/remove videos
- **Hero video assets:** `public/video/portrait-forward.webm`, `public/video/portrait-reverse.webm`
  (sourced from `~/Projects/Antigravity/revealIT-Experience/asserts/profilepic/`)
- **Fallback portrait:** `public/images/portrait-fallback.png`

## Business-Specific Rules

- No Instagram API, no scraping, no AI API keys in v1 — search/filter is plain client-side
  string matching over `lib/videos.json`
- No database, no auth, no API routes — this is a fully static export site
- Social links live in `lib/social.ts`, not hardcoded per-component
- Instagram is the primary social CTA; YouTube is secondary until that channel is prioritized
- Mobile-first is mandatory

## Deployment

- Cloudflare Pages build root: `sites/nathamuni-com/`
- Build command: `npm run build`
- Output directory: `out/`
- Subdomain/apex DNS: managed in Cloudflare dashboard for `nathamuni.com`
