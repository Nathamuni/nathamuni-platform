# Content Playbook — exact workflows

## When you post a new reel on Instagram — your 3 options

**There is no fully-automatic path.** Meta's API for reading your own posts
(Instagram Graph API) requires a business/creator account, a registered Meta
app, and an app-review process — and scraping is both against ToS and
deliberately excluded from this project. So the honest options are:

| Option | Your effort | How it works |
|---|---|---|
| **A. Tell the agent (recommended)** | ~1 minute | Paste the reel link + caption into a Claude Code session (and the video file or a thumbnail image if you have it). The agent adds the JSON entry, makes the thumbnail, verifies, and ships. |
| **B. Manual edit** | ~5 minutes | Follow "Add one new video" below yourself — one JSON entry + one image file + commit. |
| **C. Batch later** | ~0 per post, batched | Keep posting normally; every month or two, request a fresh Meta export (Media only) + update the URL/caption Excel, and the agent batch-imports everything new in one pass — same pipeline that built the current library. |

Practical rhythm: use **A** for videos you want on the site immediately,
**C** as the safety net that catches everything else. The site needs no
code changes for new data — `videos.json` is the only thing that grows,
and category counts, search, tiles, and sitemap all update automatically
at the next build.

## Add one new video (the routine you'll use most)

1. Post the reel on Instagram as usual.
2. Add an entry to `lib/videos.json` (copy an existing one as template):
   - `id`: kebab-case slug from the title (must be unique)
   - `instagramUrl`: `https://www.instagram.com/reel/<SHORTCODE>/`
   - `thumbnail`: `/images/thumbnails/<SHORTCODE>.jpg`
   - `category`: one of the 5 exact strings (see BRAND-SYSTEM.md)
   - `tags`: 2–8 lowercase tags; first two should be the category defaults
   - `shortDescription`: one line, ≤140 chars (card text)
   - `detailedDescription`: full caption (newlines preserved on detail page)
   - `featured`: keep only 5–7 videos featured at any time
   - `publishedDate`: `YYYY-MM-DD`
3. Drop the thumbnail at `public/images/thumbnails/<SHORTCODE>.jpg`
   (portrait, ~480px wide, ≤100KB — from the video file:
   `ffmpeg -ss 1 -i reel.mp4 -vframes 1 -vf scale=480:-2 -q:v 4 out.jpg`)
4. `npm test && npm run build` inside `sites/nathamuni-com/`, commit, PR to
   `main`. Merge = auto-deploy.

## The review-Excel loop (bulk refinement)

- The generated sheet lives at `~/Downloads/nathamuni-video-review.xlsx`
  (one row per video, columns match videos.json fields).
- Edit any of: title, category, tags, shortDescription, detailedDescription,
  keyLessons (one per line), featured (yes/blank).
- Hand the file back to the agent → it re-imports into videos.json in bulk.
- Rule: **never edit ids or URLs in the sheet** — those are the join keys.

## Custom thumbnails (the plan you mentioned)

- Same filename convention: `public/images/thumbnails/<SHORTCODE>.jpg` —
  overwrite the auto-extracted frame, nothing else changes.
- Spec: 9:16 portrait, 480–720px wide, JPEG quality ~80, ≤120KB.
- Design consistency: use the category accent color (BRAND-SYSTEM.md) as a
  border/glow/label so the grid reads as a organized system, not a feed dump.
- Prioritize: featured 6 → Mind & Discipline top 10 → the rest.

## Batch import from a future Instagram export

The one-off pipeline that built the current library lives in the session
scratchpad pattern; the repeatable logic is:

1. Meta export (Settings → Download your information → **Media only**,
   JSON, High quality) → gives `reels.json` (file+caption+date per reel).
2. URL archive: keep the caption→URL Excel up to date
   (`link`, `description` columns) whenever you post.
3. Match on normalized caption prefix; emoji-only captions won't match —
   log them for manual confirmation instead of guessing.
4. ffmpeg-extract thumbnails at 480w; slugify titles; hashtags → tags.

## Category assignment rules

- One category per video — the pillar it *most* serves.
- Follow-bait/gratitude/travel posts → Life & Moments (keeps the four
  substantive pillars dense and high-signal).
- Series content (50 thinkers, life rules) → Mind & Discipline, tagged with
  a series tag (`50-thinkers`, `life-rules`) so they're findable as a set.
- If a 6th category ever feels necessary, first check whether a tag serves —
  categories should stay ≤6 forever or filtering degrades.
