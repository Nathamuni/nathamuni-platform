# Handoff: Instagram recommendation bot (2026-11-23)

**Start the next session with:** "Read memory/handoffs/2026-11-23-instagram-bot.md and finish the open items."

## Goal
Hands-off Instagram growth coach for @nathamuni_ (12.6k → 50k). It sends daily data-backed suggestions to
Telegram (@nathamuni_insta_bot) and works with the laptop off. No secrets in this file.

## What is live (verified 2026-11-23)
| Piece | Where | Notes |
|---|---|---|
| Sync + insights | `.github/workflows/instagram-sync.yml` (jobs: gate → sync → transcribe → report) | Full run 45056470503 passed |
| Speech-to-text | `instagram-transcribe.yml`, `scripts/ig-transcribe*.mjs` → `lib/transcripts.json` | Gemini, newest first, 15/run; 18 done |
| Morning report + AI ideas | `scripts/ig-daily-report.mjs`, `scripts/ig-ideas.mjs` → `lib/ideas.json` | 1 Gemini call/day |
| Bot commands | `worker/telegram.mjs` at `/api/telegram` on the site Worker | /next /ideas /idea /today /week /best /when /goal /boost /reel /mute /unmute |
| Push reminders | Worker crons in `wrangler.jsonc` | 02:30 UTC dispatch, 12:15 UTC nudge, Sun 13:30 UTC review |
| Rules / AI prompts | `scripts/ig-report-core.mjs`, `scripts/ig-ai-core.mjs`, `scripts/gemini.mjs` | Thresholds at top of report-core |
| Post times | `publishedAt` on all 244 entries in `lib/videos.json` | `/when` shows median views per IST window |

Tests: 363 pass (`cd sites/nathamuni-com && npm test`). Lint and type-check are clean.

## Secrets inventory (names only)
- GitHub secrets: `IG_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GEMINI_API_KEY`
- GitHub repo variable: `TRANSCRIBE_ENABLED=true` (set `false` to stop speech-to-text)
- Cloudflare Worker secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `GEMINI_API_KEY`
- **Missing:** Cloudflare secret `GH_DISPATCH_TOKEN` (see open item 1)

## Open items, in order
1. **8 AM trigger needs a token from the owner.** GitHub's cron started ~7.5 h late every day. The Worker cron
   (`dispatchSync` in `worker/telegram.mjs`) is deployed but does nothing without the token. Owner creates a
   fine-grained PAT at github.com/settings/personal-access-tokens/new: only repo `nathamuni-platform`, Actions Read
   and write, longest expiry. Store it with `printf '%s' "$TOKEN" | npx wrangler secret put GH_DISPATCH_TOKEN` in
   `sites/nathamuni-com`. Check: the next day's `gh run list --workflow=instagram-sync.yml` shows a
   `workflow_dispatch` run at ~02:30 UTC, and the fallback `schedule` run logs "skipping fallback".
2. **Phone test not seen.** Ask the owner to send /ideas, /idea <text>, /when, /week. Watch with
   `npx wrangler tail nathamuni-platform --format json` and look for exceptions.
3. **Gemini free quota** (~20 requests/day per project per model; the figure is not confirmed). 2026-11-22/23 testing
   used most of it, so the next transcribe run may stop early. That is handled: it logs "daily quota" and resumes
   the next day. If the backfill (~225 left) is too slow, the owner said they would pay. Confirm Google's price first.
4. **Credential hygiene (owner):** the Telegram token and 8 Gemini keys were pasted in chat. Suggest `/revoke` in
   BotFather plus a new token, and deleting Gemini keys 2-8 in AI Studio. Key 1 (…w2YU) is in use. If either
   is rotated, update BOTH GitHub and Cloudflare secrets and re-run `setWebhook` with the webhook secret.
5. Not built: AI-edited vs natural comparison (needs owner tags), boost ROI (needs Ads tools screenshots), carousel
   video transcription, and `/next` hook-pattern rules from transcripts.

## Gotchas (learned the hard way)
- **Whisper is useless on this speaker's Tanglish.** It misdetects English and hallucinates. Use Gemini. The
  reel-transcript skill already said "No ASR". Check skills before trying any ASR.
- Don't process videos on the laptop. The owner wants cloud only (see native memory feedback).
- Don't hammer manual `instagram-sync` dispatches, because of the Instagram rate limits. One test run is fine.
- Using several Gemini keys from different projects to dodge limits breaks Google's terms. Use one key.
- `gemini-2.5-*` returns 404 for newer projects. Use `gemini-3.5-flash` / `-flash-lite`.
- The Worker reads data from raw.githubusercontent (public repo, ~10 min cache), so bot data lags a push by minutes.
- Instagram share links end in `/?igsh=…`. Shortcode parsing must strip the query before the trailing slash.
- `wrangler deployments list` shows "Secret Change" entries. Don't mistake them for the code deploy.
