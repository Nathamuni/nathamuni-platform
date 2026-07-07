# Growth Ideas — traffic, discovery, and audience ownership

## The core loop (do this before anything fancy)

```
Instagram reel → "full library: nathamuni.com" → site visit
   → search/browse related videos → follow/subscribe → return visitor
```

The site's job is to convert a 15-second viewer into someone who binges 5
videos by topic — something Instagram's feed actively prevents.

## Already shipped (v3)

- Per-video social share cards: any `/videos/<slug>` link pasted into
  WhatsApp/Twitter/LinkedIn/Telegram shows the real thumbnail + title.
  **Use these links when sharing, not the raw Instagram URL.**
- `sitemap.xml` + `robots.txt` + canonical URLs
- JSON-LD: Person (homepage) + VideoObject (every detail page) — eligible
  for Google video-rich results
- Newest-first ordering, searchable captions, clickable tags everywhere

## Next actions (owner, ~1 hour total)

1. **Instagram bio link → `https://nathamuni.com/videos`** (highest ROI
   single change available)
2. **Google Search Console**: add property, submit
   `https://nathamuni.com/sitemap.xml`
3. **Cloudflare Web Analytics**: dashboard → Analytics → Web Analytics →
   enable for nathamuni.com (free, no cookies, no consent banner needed);
   paste the beacon snippet request to the agent to wire it in
4. **WhatsApp share test**: paste a video URL in a chat, confirm the
   thumbnail card renders (may take one crawl cycle)

## Content-side growth ideas

- **Series landing links**: share `/videos?tag=50-thinkers` style deep links
  in captions — they open pre-filtered. Works today.
- **Transcripts as SEO fuel**: 30+ reels have .srt files in the Meta export.
  Tamil+English transcript text on detail pages = long-tail search traffic
  competitors can't copy. (TECH-BACKLOG has the implementation sketch.)
- **"Idea of the week" newsletter**: repurpose one video caption per week;
  the writing already exists. Buttondown free tier → embed form on homepage.
- **Cross-post to YouTube Shorts**: same clips, @LogicAndLaunch, link the
  library. YouTube search has a far longer tail than IG.
- **Pin a "Start here" comment** on popular reels linking the site.

## Credibility infrastructure (the "celebrity" layer)

- Press/speaker kit page: short + long bio, 3 photos, key numbers, contact
- Consistent handle: `nathamuni_` everywhere or redirect from variants
- Email on domain (hello@nathamuni.com via Cloudflare Email Routing — free)
- Schema is already in place; when Google shows the knowledge panel, claim it

## Measurement (keep it simple)

Track only: unique visitors/week, top 10 opened videos, search terms used
on-site (needs a tiny analytics event later), newsletter signups. Review
monthly; double down on the category that pulls the most opens.
