# Plan — v8: image integration, thumbnail peek, accuracy pipeline

Date: 2026-07-09 · Branch: `feat/v8-images-hover-accuracy`

## Goal

Ship the owner's latest requirements: integrate the 3 ready AI images into category
tiles (wired so the remaining 6 drop in with a one-line change), add an enlarged
hover/press thumbnail preview everywhere posters appear, relax the card crop, and
establish the "genuine data" pipeline that will fix the inaccurate About content.

## The owner's requirements, restated precisely

1. **Content depth question (answered, no code):** captions are the current source of
   titles/descriptions/tags and are sufficient for baseline browsing + search. Real
   per-video descriptions/transcripts make search and detail pages substantially richer;
   the channel for that is the review Excel (`~/Downloads/nathamuni-video-review-v2.xlsx`)
   — paste transcripts or notes into the description column, any subset, any time.
   Auto-transcription is possible later (sync job downloads media → Whisper) but is a
   separate feature; NOT in this branch.
2. **Hover/press to see the real thumbnail:** hovering any post/story card (desktop) or
   press-and-holding (mobile, video cards) must show a slightly-bigger, fully visible
   (uncropped) version of the poster. Applies to: video cards, homepage moments strip,
   /moments wall.
3. **About Me is not accurate:** current `lib/profile.ts` copy was drafted from captions
   and inference. Fix = owner runs the master data-retrieval prompt (below) in
   ChatGPT/Gemini (where his real history lives), returns the dossier, agent rewrites
   profile.ts/About/bios from it. NO invented facts in the meantime.
4. **Master retrieval prompt:** a single copy-paste prompt that makes any AI with his
   chat history output a structured, source-marked, no-invention dossier about him.
   Lives in the requirements doc (docs/creator-hub.html) — copyable.
5. **Images:** 3 of 9 are ready (`~/Downloads/Insta chatgpt imgs`): img1 = cat-mind,
   img2 = cat-fitness, imp3 = cat-ai. Remaining 6 are being generated and will drop in
   later. Integration must not break when images are missing (fallback = current
   gradient/icon tile).
6. **Requirements doc as HTML in the repo** (not an artifact): self-contained,
   viewable/shareable/downloadable file at `sites/nathamuni-com/docs/creator-hub.html`
   containing the restated requirements, status, the 9 image prompts (copyable), and
   the master retrieval prompt (copyable).
7. **UI consistency + deep improvement pass:** known concrete item this branch: card
   crop trims 9:16 posters too hard (aspect 9/12 → 9/14 + peek overlay solves full
   visibility). Category tiles become uniform 4:5 art cards (image or gradient) so
   mixed states don't look inconsistent. Bigger visual audit continues next session
   with the owner's specific list.

## Files

- `public/images/generated/cat-{mind,fitness,ai}.jpg` — new (sharp, 900×1125, q78)
- `lib/categoryMeta.ts` — `image?` field + 3 entries
- `components/home/CategoryTiles.tsx` — art tiles with fallback
- `components/fx/ThumbPeek.tsx` (+ test) — new hover/long-press preview
- `components/video/VideoCard.tsx`, `components/home/MomentsStrip.tsx`,
  `components/moments/MomentsWall.tsx` — wrap posters in ThumbPeek
- `app/globals.css` — tile art styles, peek overlay, crop 9/14
- `docs/creator-hub.html` — the referable requirements + prompts document
- `REQUIREMENTS.md` — v8 items appended

## Acceptance criteria

- Homepage tiles show the 3 real images with legible name/count; 2 remaining tiles look
  deliberate (uniform size, gradient + icon); all 5 still link to filtered /videos.
- Desktop: hovering a video card/moment shows the uncropped poster enlarged; leaves
  close it; Escape closes; reduced-motion safe. Mobile: long-press a video card shows
  it; releasing closes; tap still navigates; long-press does NOT navigate.
- 66+ tests green, lint/type-check clean, build succeeds, CI green, verified live.

## Failure mode to watch

Long-press peek swallowing legitimate taps on mobile (navigation broken) — guarded by
suppressing only the click that immediately follows a completed long-press; tested.

## Waiting on owner

- Remaining 6 images → drop in `public/images/generated/` (exact filenames in doc)
- Master-prompt dossier output → then rewrite `lib/profile.ts` (About, bios, headline)
- Moments motion preference (question open from last session)
