# Plan — v10 experience overhaul

Date: 2026-07-10 · Branch: `feat/v10-experience-overhaul`
Requirements: `memory/prompt-log.md` v10 section · Facts: `sites/nathamuni-com/docs/content-source.md`

## Goal
Owner delivered all 9 images + full dossier/resume and granted full creative freedom
(no payments; sensitive facts excluded; mobile must never break). Ship: hero v3 with
cursor aurora + scroll-stopping visuals, all images wired, tile/card polish, moments
poster fix + sync hardening, complete About rework, real Projects page, researched
referenced blog, public /stats page, roaming screen companion.

## Execution — 5 parallel Sonnet subagents, strict file ownership
- **A hero/motion/cards**: owns `app/globals.css`, `app/page.tsx`, `components/hero/*`,
  `components/home/CategoryTiles.tsx`, `components/fx/CursorAurora.tsx` (new),
  `components/layout/Nav.tsx` (+Stats link). Hero: hero-bg.jpg backdrop + about-portrait.jpg
  glass 3D frame; cursor-following aurora glow; tiles bigger + label plate fix; Start-here
  elegance; moments/blog card CSS.
- **B content pages**: `lib/profile.ts`, `app/about/*`, `components/about/*`,
  `lib/projects.ts` (new), `app/projects/*`, `app/books/page.tsx` (books-teaser + polish),
  `app/layout.tsx` metadata (og-banner.jpg + about-portrait in JSON-LD). No globals.css.
- **C blog**: `lib/posts.json` (5–6 researched posts w/ references), `lib/blog.ts` (+refs
  field) + tests, `app/blog/*` layout upgrade (inline utilities). WebSearch for citations.
- **D stats/sync**: `lib/stats.ts` (+test), `app/stats/page.tsx`, `scripts/instagram-sync.mjs`
  (like/comment counts graceful; poster extraction hardened: verify ffmpeg result, poster
  null on failure), `lib/videos.ts` optional count fields, `lib/stories.ts` nullable poster +
  poster-null fallbacks in `MomentsWall.tsx`/`MomentsStrip.tsx` (TSX only; CSS is A's).
- **E companion**: `components/fx/Companion.tsx` (+test) — SVG kitty/spark toy, cursor
  chasing/eye tracking, click/tap reactions, picker + off switch (localStorage), fully
  self-styled (no globals.css). Lead mounts it in layout after review.

Already done by lead: all 9 images converted to `public/images/generated/`; 2 missing
story posters generated via ffmpeg; categoryMeta wired for humor/life.

## Acceptance
- 100% tests green, lint/type clean, build succeeds; mobile layouts intact (spot-check
  built HTML + viewport CSS); no invented facts (content traceable to content-source.md);
  hard exclusions absent; live verification after merge.
