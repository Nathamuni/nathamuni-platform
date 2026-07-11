# Prompt Log — owner directives, verbatim intent

Every prompt/directive Nathamuni gives is appended here (newest last) so no
requirement is ever lost between sessions. Paraphrases keep his intent; direct
quotes where wording matters. Update REQUIREMENTS.md when a directive becomes
a tracked requirement.

## 2026-07-09 — v8 round (session: images + accuracy)

1. Rework the image-prompt page into **nine separate copyable sections** — each a
   complete detailed prompt including resolution/aspect ("so that I can just copy
   paste that individually").
2. Don't build reference docs as artifacts — "build it as an HTML file in the
   present itself" (in the repo), viewable/shareable/downloadable in future.
3. Question answered: captions vs transcripts — captions suffice; richer
   descriptions welcome via review Excel.
4. **Hover/press peek**: "I must be able to hover that post or anything to see it
   like a... slightly big where the actual thumbnail is pretty visible to me. Do
   this for all those highlights and things."
5. **About Me is not accurate** — must contain "the actual thing"; all info must be
   retrieved genuinely from a single source: a master prompt he pastes into
   ChatGPT/Gemini which retrieves everything about him; he returns the output.
6. 3 images delivered (`~/Downloads/Insta chatgpt imgs`): cat-mind, cat-fitness,
   cat-ai. Remaining 6 generating on the fly.
7. "Do a deep dive... heavy lifting of the improvement... precise, full, helpful."
8. Use subagents to make it proper and fast; open to recommendations — "do it very
   perfect."

## 2026-07-09 — v9 round (same day, after v8 shipped)

1. **Moments viewer**: when viewing a poster/moment, add right/left arrows to move
   to the next one; when a video ends it should auto-advance to the next.
2. **Hero section**: "I don't want the video, instead I want the clear defined,
   well defined, best perfect image"; the text must be modified — the current
   headline should NOT be the first thing; "the layout, the design, the total
   overall thing is not at all nice" → redesign.
3. **Every prompt he gives must be documented** in memory or somewhere durable
   (→ this file; keep appending).
4. **More 3D effect on the home screen** + more moving effects (scrolling /
   automatic motion) — current home "not at all looking perfect."
5. Plan and execute with **cost-effective subagents**.
6. Category tile text "not properly visible" over the new images → add a small
   bordered, slightly-gradient glass plate/layout behind the text.
7. Direction: "Make everything as gradient glass finish... every overall view must
   be transparent and give a very visual impact."
8. Click feedback: a "shiver" (or similar) animation on click; varied animations —
   "but don't make this site slopey [sloppy]".
9. Hover peek must pop up only after a **0.6s delay**, and the pop-up animation
   must be smooth.

## 2026-07-10

1. "Ship with haiku" — use Haiku-model subagents for mechanical ship pipelines.
2. Text-content prompts: don't require one-by-one runs — one combined
   all-in-one canvas prompt ("best possible one") producing the whole content
   pack in a single paste. Delivered in chat (owner used it — dossiers came
   back same day). Also added to creator-hub.html (2026-07-11, ships with v13).

## 2026-07-10 — v10 round (the big brief)

1. Delivered ALL inputs in `~/Downloads/Insta chatgpt imgs/`: 6 remaining images
   (img4–img9) + dossier outputs from ChatGPT (chatgpt1–3) and Gemini (gemini*).
   Plus `~/Documents/about-me .txt` and `~/Documents/My-Resume 28-4-2026.pdf`
   — "refer to the max".
2. **Hero reworked completely** — no video/old portrait; something very new, best
   possible; landing page "more evident"; mouse cursor movement should show
   colorful things; 3D animation in every nuance; increase fluidity; "pleasing to
   be watchable"; later: "scroll-stopping" sections, visually strong.
3. **/stats page** — public statistical analysis of his Instagram profile (most
   recommended posts etc.). Wanted options + what data is accessible + how/when
   Instagram data is pulled + longevity (does Meta dev account need attention?).
   (Answers delivered in chat + doc; build proceeding with existing data +
   like/comment counts added to sync.)
4. Category tiles: text and pictures "lightly mismatched — not acceptable"; cards
   bigger, more animated. "Start here" cards slightly janky → make elegant.
5. Moments: certain images not loading → find and fix (root cause: sync's ffmpeg
   poster extraction failed silently for 2 stories; fixed + hardened).
6. Blog: no fake personal blogs — populate with researched, readable posts with
   references, based on his interests/knowledge; card layout must look better.
7. Books: impressed; improve anywhere possible.
8. **About page: rework completely** ("looking like a baby") using delivered data.
9. Projects page: fill from real projects/resume.
10. Asked: can Gemini watch his Instagram videos and write descriptions to feed
    the site? (Answered in chat: yes, semi-automated via Gemini API in sync is
    feasible later; needs API key secret.)
11. Wants me to ask only essential questions (max 20) — then full freedom granted:
    "you just do everything now"; no payment actions; respect security judgment.
12. **Mobile must not break — make it the best.** All the 3D I judge good is
    approved.
13. Document everything heavily for future sessions (this log + REQUIREMENTS +
    docs/content-source.md).
14. **Screen companion**: a small animated doll/kitty/toy roaming the screen,
    looking at / chasing the cursor, reacting to clicks (taps on mobile); user
    can pick the toy; must be visually appealing and Cloudflare-static
    compatible (it is — pure client-side).

## 2026-07-11 — v11 polish round (screenshots feedback)

1. Kitty: more responsive + vibrant/different colors; must NOT cover content
   (seen sitting on tiles/text) → constrained to a bottom lane.
2. Cursor effect: current one "not good… hiding some details and causing me
   distraction" → redesign, must never obscure text (move behind content).
3. Tile labels: dark/hue-colored text unreadable over plates ("black color text
   not looking nice", "card here is hidden… text not visible") → white names.
4. Moments strip: card sizes/crops mismatched → uniform.
5. About outdated: he NOW works in Chennai as a software developer; Reveal IT
   etc. are PREVIOUS experience. Fix copy accordingly.
6. Books page banner looks bad at wide resolution → fix crop/height.
7. Blog post body text nearly invisible (ghosted) → suspected cursor overlay
   compositing; fix with cursor v2 + text opacity hardening.
8. /stats "looking childish… I want visually appealing, no distractions" →
   premium redesign.
9. Moments page ends blankly → add end-cap + interspersed vibrant quote/thought
   cards ("logged for the future", text quotes, random interesting cards);
   he wants the site to NOT feel normal — contrast, vibrant, different.
10. Humor tile on mobile (full-width 5th tile) crops badly → fix focal point.
11. Book date CONFIRMED by owner: **November 2025**.
12. reels-needing-description.txt: keep ONLY the reels that truly need his
    input (search must work, e.g. "diet" should find the diet reel).

## 2026-07-11 — v12 round (1am/10am messages)

1. "Do all those changes, not limited to that" + overall mobile UI must be
   much better.
2. **Decision-map / ideology page**: flow map of his decisions, policies,
   ideology — "in this time, if this happened, I took this decision" — animated,
   diagrammatic, mobile-responsive, its own page; creative freedom granted
   ("make it up… I don't want it to be rigid; you have my ideology").
3. **Dream tracking, goals and milestones** included.
4. **Data sources audit**: state which external data is genuinely useful, then
   implement the good ones (audit delivered in chat 2026-07-11; goals-file now,
   GitHub-stats worth it pending username confirm, Meta insights rejected as
   risky, Play scraping rejected as fragile).
5. **AI version of the assistant/him on the site**: "ask me anything" chat
   answering in his style, solving problems the way he would; asked whether a
   paid API key is needed → NO: Cloudflare Workers AI free tier (same binding
   as semantic search) serves the chat model; strict grounding + rate limits.
6. He asked for his voice-typed request to be restated as a clear realistic
   spec (done in chat, mirrored here).

## 2026-07-11 — v14 round (evening screenshots)

1. Shared https://github.com/stars/Nathamuni/ → GitHub username confirmed:
   `Nathamuni`. GitHub stats implemented (weekly action + /projects strip).
2. Moments and other cards are cropped — "I want it to see full sized, no
   cropping" → strip + video cards now native 9:16.
3. Blog text STILL dark → TRUE root cause found: Tailwind v4 token collision —
   custom color `--color-base` hijacked the `text-base` font-size utility into
   `color:#0d0a1f` (desktop/sm+ only). Fixed by renaming token to
   `--color-ground`. NEVER name a theme color `base`/`sm`/`lg` etc.
4. "Do again and check all my previous complaints and functional requirements,
   fix all, check the website against those" → full audit pass run with v14.
5. Feed section could be better + everything must keep working as data grows →
   feed kind-filters (CSS-only, with counts), rows already content-visibility;
   growth-proofing verified (feed/stats/search all data-driven).
6. Owner completed the reels description file → 43 reels imported (v13).
