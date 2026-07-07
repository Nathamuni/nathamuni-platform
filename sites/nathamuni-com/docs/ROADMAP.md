# Roadmap — from library to platform

Phases are ordered by leverage: each one makes the next more effective.
Don't skip Phase 1 — a polished platform with half-finished data reads as
abandoned; complete data with modest features reads as serious.

## Phase 1 — Complete the library (now → 2 weeks)

- [ ] Refine the review Excel (`~/Downloads/nathamuni-video-review.xlsx`):
      correct titles, tighten descriptions, add `keyLessons` for the top ~20
      videos, adjust categories/tags, rotate `featured`. Hand back for re-import.
- [ ] Confirm URLs for the 17 unmatched reels (emoji-only captions) via a
      visual review sheet.
- [ ] Decide on the ~30 archive URLs with no local video file: add as
      link-only cards (thumbnail via custom art) or skip.
- [ ] Custom thumbnails: replace auto-extracted frames with designed covers
      for the featured six first (highest visual ROI), then per-category
      batches. Drop files in `public/images/thumbnails/<shortcode>.jpg` — no
      code change needed.

## Phase 2 — Own the traffic loop (weeks 2–6)

- [ ] **Make nathamuni.com the Instagram bio link.** Every profile visit
      becomes a site visit. Use `/videos` as the destination — it's the
      strongest first impression.
- [ ] End every reel with "full library → nathamuni.com" (verbal + caption).
- [ ] Enable Cloudflare Web Analytics (free, cookieless, dashboard toggle) —
      know which videos/categories people actually open.
- [ ] Submit sitemap to Google Search Console + Bing Webmaster Tools.
- [ ] Newsletter capture: a single email field ("One tested idea, weekly").
      Free tier options: Buttondown, Substack embed, or Cloudflare Worker +
      KV. Start collecting before you need it.

## Phase 3 — Authority surfaces (months 2–4)

- [ ] **Blog**: turn the 3–5 densest video captions (systems, 50-thinkers
      series) into long-form written posts. Written content is what Google
      ranks and what gets cited.
- [ ] **Books/Writings**: publish reading notes or the "50 thinkers" digest
      as a free PDF — classic email-list builder.
- [ ] **Projects**: case-study pages for the AI apps (local AI app,
      instauser-understanding) with screenshots and links. This converts the
      "AI Architect" claim into proof.
- [ ] Transcripts: the Meta export contains .srt subtitle files for 30+
      reels — attach them to detail pages as searchable, SEO-indexable text.

## Phase 4 — Scale & monetize (month 4+)

- [ ] YouTube channel revival (@LogicAndLaunch): long-form versions of the
      top-performing library topics; embed on detail pages (site becomes
      dual-source).
- [ ] Digital product: course/cohort on the discipline-systems material, or
      the AI apps as products. The library is the funnel.
- [ ] Speaking/press kit page: bio, photos, stats, contact — the "celebrity"
      infrastructure.
- [ ] Consider i18n: Tamil/English toggle — the Tamil audience is a real,
      underserved niche for this content mix.

## Definition of "top-notch" (recurring bar)

Every phase change should re-verify: Lighthouse mobile ≥ 90, all links
clickable, zero broken thumbnails, share-card preview correct on WhatsApp/
Twitter/LinkedIn, and the hero portrait visible within 1s on 4G.
