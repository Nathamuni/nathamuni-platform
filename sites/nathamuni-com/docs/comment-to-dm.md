# Comment → DM setup

Code: `worker/commentdm.mjs` (tests beside it). Rules live in KV (`ig:rules`), edited at `/admin/comment-dm`.

## One-time setup (nothing works until all are done)
1. **Meta app** (the one behind `IG_ACCESS_TOKEN`): add the Instagram messaging product; regenerate the
   token with `instagram_business_manage_comments` + `instagram_business_manage_messages`.
2. **Webhook**: Callback URL `https://nathamuni.com/api/ig/webhook`, verify token = `IG_VERIFY_TOKEN`;
   subscribe the account to the `comments` field.
3. **Worker secrets** (`wrangler secret put`): `IG_ACCESS_TOKEN` (new token), `IG_APP_SECRET`,
   `IG_VERIFY_TOKEN`, `ADMIN_EMAIL`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`.
4. **Cloudflare Access** (Zero Trust, free): self-hosted app covering `nathamuni.com/admin/*` **and**
   `nathamuni.com/api/admin/*`, policy = allow only your email (one-time PIN). Copy its AUD tag.
   Without this the admin routes return 403 (fail closed).
5. **Go Live.** While the app is Unpublished, Meta only sends comment webhooks for people with a role
   on the app (you + testers). Real followers need the app set to Live (Publish). Needs a privacy
   policy URL (`https://nathamuni.com/privacy`) and may need Advanced Access for the comments
   permission; reports conflict, so try Live + Standard Access first.
6. Test from a second Instagram account added as an app tester first.

## Telegram
`/dm` opens a button menu (Create a DM, My DMs, Turn ALL OFF/ON, Recent activity). Create asks one question at a
time: video (5 newest with thumbnails, paging, All videos, or paste any link) → keyword → DM text → public reply
(auto / none / own wording) → Save. My DMs shows one card per rule (thumbnail, Pause/Resume, Delete with confirm).
Typed shortcuts still work: `/dm add keywords | message | reel link`, `/dm off 2`, `/dm del 2`, `/dm log`.
UI code: `worker/dmui.mjs`; state machine and rules: `worker/commentdm.mjs`; `/menu` re-registers the "/" list.
Only `TELEGRAM_CHAT_ID` is served. A reel link limits a rule to that reel (media id resolved once, cached in KV).

## Limits to remember
- One DM per comment, within 7 days; DM text max 1000 UTF-8 bytes (Tamil = 3 bytes/char).
- Non-followers get the DM in Requests.
- KV free tier: 1,000 writes/day; each matched comment uses 2 → about 500 matched comments/day.
- The Worker refreshes the token weekly into KV (`ig:token`); the GitHub refresh job only updates its own copy.
