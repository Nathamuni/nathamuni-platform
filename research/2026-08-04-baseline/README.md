# Baseline — nathamuni.com foundations upgrade

Measured 2026-08-04 on branch `feat/foundations-upgrade` (parent commit `e068b97`).
All later phases are judged against these numbers. Re-run the commands below to compare.

## Disk

| Target | Size |
|---|---|
| `public/` | **74 MB** |
| ├ `public/stories/` | 54 MB (128 files, MP4) |
| ├ `public/images/` | 19 MB |
| │  └ `public/images/thumbnails/` | **17.7 MB**, 171 files, avg 106 KB |
| └ `public/downloads/` | 432 KB |
| `out/` (built) | **105 MB** |
| `.next/static/` | 1.4 MB |

### Thumbnail dimensions (the weight problem)

36 of 171 files are ≥1080px wide; these dominate the 17.7 MB.

| Dimensions | Count |
|---|---|
| 480x854 | 76 |
| 610x1084 | 27 |
| 1440x1440 | 13 |
| 1440x1800 | 12 |
| 540x960 | 11 |
| 1440x1080 | 5 |
| 1440x1920 | 4 |
| other ≥1024px | ~20 |

Largest single files: `DHiP6SbxX4w.jpg` 680 KB, `DbPzEWzEQXP.jpg` 626 KB,
`CjqAfXXplk6.jpg` 607 KB, `C6Osl11vZUY.jpg` 578 KB.

## Route weight

| Route | HTML raw | HTML gzip |
|---|---|---|
| `/feed` | **408,548** | not measured |
| `/videos` | 322,044 | 47,694 |
| `/pulse` | 169,456 | 31,575 |
| `/sessions/diet-reset` | 126,381 | 23,640 |
| `/moments` | 66,666 | 12,218 |
| `/` | 67,733 | 11,199 |
| `/blog` | 48,867 | 8,826 |

**`/feed` at 408 KB is the heaviest route on the site and was missed by every audit.**
Investigate during Phase 3.

Also shipped as static assets: `out/videos.json` 120,464 B (the client-fetch payload
Phase 3 removes), `out/videos.txt` 116,634 B, `out/pulse.txt` 109,042 B, `out/feed.txt` 222,395 B.

## Client chunks

| Chunk | Raw | Gzip |
|---|---|---|
| `3rxl-jt3pdxgx.js` | 227,538 | 70,925 |
| `1thoze8vha6xw.js` | 149,785 | 40,438 |
| `0cz1d0mv5g_q7.js` | 112,594 | 39,496 |
| **`3omqdicrcnb3j.js`** | **104,920** | **25,366** |

## RESOLVED: the video-catalog bundle leak

Phase 0's open question is settled — **Codex was right, the internal audit was wrong.**

`components/video/VideoExplorer.tsx:4` imports **values**, not types:

```ts
import { getAllCategories, searchAndFilterVideos, type Video } from '@/lib/videos'
```

and `lib/videos.ts:1` is `import videosData from './videos.json'`. So the entire
172-entry catalog is pulled into the client bundle.

**Verified empirically, not by reading source** — probing for video id
`50-thinkers-6-months-separating-action-from-reaction` finds it inside
`.next/static/chunks/3omqdicrcnb3j.js` (104,920 B raw / 25,366 B gzip).

Consequence: the catalog ships **twice** on some journeys — once inside this chunk,
and again as the 120 KB `out/videos.json` that `components/home/VideoSections.tsx`
fetches at runtime. Phase 3 must fix both, and splitting `lib/videos.ts` into
server-data vs client-safe-search is required, not optional.

## Tooling available (no new deps needed for Phase 1)

- `sharp` — resolves from the project (transitive dep). Use for WebP + responsive variants.
- `ffmpeg` — present on PATH. Use for MP4 poster extraction.
- `cwebp` / ImageMagick (`convert`, `identify`) — **not installed**; don't depend on them.

## Reproduce

```bash
cd "sites/nathamuni-com"
npm run build
du -sh public/ out/ .next/static
du -sh public/*/ | sort -rh
for p in index videos pulse feed blog moments; do \
  printf "%-12s %8s raw %8s gz\n" "$p" "$(stat -c%s out/$p.html)" "$(gzip -c out/$p.html|wc -c)"; done
for f in $(ls -S .next/static/chunks/*.js | head -8); do \
  printf "%-24s %8s raw %8s gz\n" "$(basename $f)" "$(stat -c%s $f)" "$(gzip -c $f|wc -c)"; done
```

## Not yet measured

Lighthouse and axe runs are **not done** — they need a running server and a Chrome
instance. Run before Phase 4 sign-off so the accessibility work has a real before/after:

```bash
npx serve out -p 4173
# then axe + Lighthouse against /, /videos, /pulse, /sessions/diet-reset
```
