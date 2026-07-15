# Session Handoff — nathamuni.com creator platform (v1→v7 complete)

## Where it started
Build nathamuni.com as the owner's searchable creator hub (Instagram is the feed; the site is the organized brain). Free-first: Cloudflare Workers static assets, no DB/auth. Grew across this session into a full platform: complete Instagram library, story archive, AI search, blog, book showcase, full automation.

## Decisions locked + what shipped (all LIVE on nathamuni.com)
- 161-item library (112 reels + 49 posts), 5 categories w/ accent hues — auto-synced daily via Instagram API (Meta app in Development mode = permanent correct state; NEVER touch App Review/Live/advanced access — doing so blocked the API once already)
- Token self-renews weekly (IG_ACCESS_TOKEN + TOKEN_REFRESH_PAT secrets; PAT expires Jul 2027)
- /moments: permanent story archive (41 backfilled + daily capture), auto-flowing marquee on homepage
- Search: keyword+synonyms+ranking AND semantic /api/search (Workers AI bge-m3, EN+Tamil) in worker/index.mjs
- /blog: 4 posts in owner's voice (lib/posts.json); /books: showcase built from full 118-page read of his book (brief: .superpowers/sdd/book-brief.md)
- Mobile: bottom tab bar, static 24KB hero portrait on touch, scroll-reveals, press feedback
- SEO: share cards, sitemap, robots, Person/VideoObject/Article/Book JSON-LD
- Workflow: feature branch → tests → PR → CI green → merge → verify live. CSS patches must ASSERT match (two silent no-op incidents). Never git add -A (swept user files once; surgically fixed)

## Key files for next session
- /home/nathamuni/ Projects/Nathamuni-website/REQUIREMENTS.md — all-time requirements w/ status
- /home/nathamuni/ Projects/Nathamuni-website/.superpowers/sdd/progress.md — full ledger, read FIRST
- /home/nathamuni/ Projects/Nathamuni-website/.superpowers/sdd/book-brief.md — the book analysis
- sites/nathamuni-com/docs/ — CONTENT-PLAYBOOK (add-a-video flows), IMAGE-BRIEF, TECH-BACKLOG, image-brief.html (= Creator Hub, artifact 15b5ea19-71c6-4351-a9a2-8a41e1641e80)
- Data: lib/videos.json · lib/stories.json · lib/posts.json · lib/book.ts · lib/profile.ts

## Running state
- Dev server possibly still alive from earlier: PID 2073766, port 3002 (kill 2073766 if stale)
- No other background processes. Branches: work on main via feature branches; PRs #1–#13 merged
- GitHub Actions: CI, instagram-sync (daily), instagram-token-refresh (weekly Mon) — all green

## Verification
- cd "sites/nathamuni-com" && npm test (66/66) && npm run build (~169 pages)
- curl -s https://nathamuni.com/api/search?q=discipline → JSON results
- Live nav check: Home→Books client-side must show content (P0 reveal bug fixed in PR #13)

## OPEN ISSUES — user's latest feedback (top of next session)
1. VERIFY on real mobile after PR #13: user reported "book not visible" (root cause was reveal-on-navigation P0, fixed) — confirm /books renders everywhere now
2. "Ready to download" section on /books: user wants downloadable sample/PDF (source: /home/nathamuni/Documents/The-Silence-That-Haunts.pdf) — decide sample-chapter vs full, add download UI
3. Card thumbnails "not fully visible": media crop is 9:12 over 9:16 posters — trims edges; consider 9:14/9:16 or object-position tuning
4. Moments movement "not proper" per user — ASK what motion he envisions (speed? direction? full-bleed edge-to-edge? scroll-linked instead of time-based?) then rebuild
5. News/live-log feed section — promised for next session (unified chronological feed of posts+reels+stories)

## Deferred + waiting on owner
- 9 AI images → public/images/generated/ (specs+prompts in Creator Hub artifact) → then image category tiles, hero bg, about portrait, og banner, books teaser
- Hub text prompts #1/#2/#4 outputs (About long-form, Projects case studies, SEO bios)
- Review Excel: ~/Downloads/nathamuni-video-review-v2.xlsx → bulk description import
- GitHub OAuth app → build /admin (Sveltia CMS)
- Book purchase link → replace "DM me for a copy" CTA

## Pick up here
Read progress.md, confirm PR #13 deployed (client-side nav to /books shows content), then work the OPEN ISSUES list top-down — items 2–4 are concrete; item 4 needs one clarifying question to the user first.
