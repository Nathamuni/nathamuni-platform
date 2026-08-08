# CLAUDE.md — nathamuni.com

## Business

- **Name:** Nathamuni — personal creator content hub
- **Domain:** nathamuni.com (apex domain)
- **Category:** Personal brand / content library
- **Cloudflare Workers project:** nathamuni-platform (Workers Builds, deploys from main)
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

- **Video data:** `lib/videos.json` — auto-grown by `scripts/instagram-sync.mjs`
  (daily GitHub Action, IG_ACCESS_TOKEN secret); safe to hand-edit titles/categories/tags
- **Story archive:** `lib/stories.json` + `public/stories/` — self-hosted clips
  (Instagram deletes stories after 24h; the sync captures active ones each run)
- **Thumbnails:** originals live in `assets/thumbnails/<shortcode>.jpg` (git-tracked,
  never deployed). `scripts/optimize-thumbnails.mjs` derives the served 540w
  `.webp`/`.jpg` into `public/images/thumbnails/`, which is generated and gitignored —
  do not put files there by hand, they will not be committed
- **Profile/bio copy:** `lib/profile.ts` — single source of truth for hero/about/metadata
- **Hero video assets:** `public/video/portrait-*.webm`; static fallbacks in `public/images/`

## Architecture Rules

- Static export (`output: 'export'`) + a thin Worker (`worker/index.mjs`) that serves
  assets and `/api/search` (semantic search via Workers AI bge-m3, vectors cached by
  index hash from the prebuild `search-index.json`)
- No database, but there *is* optional auth: `worker/auth.mjs` stores email +
  PBKDF2-SHA256 password hashes and a per-user progress blob in the `INBOX` KV
  namespace, behind HMAC-signed HttpOnly cookies. Accounts are opt-in; signed out,
  progress stays in localStorage. Keep `app/privacy/page.tsx` honest about this.
- The Instagram Graph API is touched only by the daily sync job, never by visitor traffic
- Social links live in `lib/social.ts`; category colors in `lib/categoryMeta.ts`
- Instagram is the primary social CTA; YouTube is secondary until that channel is prioritized
- Mobile-first is mandatory; 3D/tilt effects are desktop-only and reduced-motion-safe
- Docs for roadmap/brand/growth/tech-backlog: `docs/`

## Deployment

- Cloudflare Workers Builds: root `sites/nathamuni-com/`, `npm run build`, wrangler
  deploys `worker/index.mjs` with `out/` as static assets (see `wrangler.jsonc`)
- Custom domain `nathamuni.com` attached in the Cloudflare dashboard
- GitHub Actions: CI (lint/type-check/test/build), daily `instagram-sync`, weekly
  `instagram-token-refresh` (needs TOKEN_REFRESH_PAT secret)
