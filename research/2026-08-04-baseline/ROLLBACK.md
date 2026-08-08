# Rollback & safety — foundations upgrade

Written 2026-08-04. Read this before panicking about anything on
`feat/foundations-upgrade`.

## The single most important fact

**Production cannot be affected by this work until someone pushes to `main`.**

Cloudflare Workers Builds deploys from `main` (site `CLAUDE.md` → Deployment; confirmed
by grep — no workflow in `.github/workflows/` contains `wrangler deploy`). All upgrade
work lives on the local branch `feat/foundations-upgrade`, which has **never been pushed**.

So the blast radius today is zero. The live site is still serving whatever `origin/main`
last built.

## Rollback points

| Ref | What it is |
|---|---|
| `origin/main` | Exactly what production is serving. The ultimate fallback. |
| `e068b97` | Local `main`. Pre-upgrade state + the Sundaram docs commit. |
| `08c34c8` | Phase 0 — measurements only, zero code change. |
| `7ce0b7a` | Phase 1 — image pipeline. |

Each phase is one commit, so rollback granularity is one phase.

## How to undo

**Abandon everything, keep production safe:**
```bash
git checkout main          # feat/foundations-upgrade is simply left behind
```

**Undo the most recent phase only:**
```bash
git checkout feat/foundations-upgrade
git revert <commit>        # prefer revert over reset — keeps history auditable
```

**Undo one phase but keep later ones** — every phase is independent by design, so
`git revert` of a single phase commit should apply cleanly. If it conflicts, that means
the phases were not as independent as intended; stop and re-plan rather than force it.

**Nuclear option:**
```bash
git reset --hard origin/main
```
Destroys local work including the unpushed `e068b97` Sundaram docs commit. Only after
confirming nothing else on `main` is unpushed.

## Data integrity — the one thing that looked risky

Phase 1 moved 171 thumbnail originals `public/images/thumbnails/` → `assets/thumbnails/`.

**Verified: all 171 files are byte-identical to their pre-change versions.** Checked by
comparing every git blob hash at `HEAD:assets/thumbnails/<f>` against
`e068b97:public/images/thumbnails/<f>` — 0 differing, 0 missing. It was a pure rename.

Nothing was deleted. `git rm --cached` was used to untrack the *generated* copies; the
tracked originals were never touched.

Re-run that check any time:
```bash
for f in $(git ls-files sites/nathamuni-com/assets/thumbnails); do
  bn=$(basename "$f")
  old="sites/nathamuni-com/public/images/thumbnails/$bn"
  [ "$(git rev-parse e068b97:$old)" = "$(git rev-parse HEAD:$f)" ] || echo "DIFFERS: $bn"
done
```

## New failure mode introduced by Phase 1 (and how it's contained)

`public/images/thumbnails/` is now **generated**, not tracked. If
`scripts/optimize-thumbnails.mjs` fails, there are no thumbnails.

Contained three ways:

1. **`sharp` is now a declared devDependency** (`^0.34.5`). It previously worked only
   because Next 16 pulls it in transitively — a Next upgrade or `--omit=optional`
   install would have silently broken the build.
2. **The script fails loudly.** It exits non-zero on a missing source dir, an empty
   source dir, any per-file failure, or if the emitted `.webp` count is short of the
   source count. Verified by hiding `assets/thumbnails/` and confirming exit code 1.
3. **A failed build is the safe outcome.** Cloudflare Workers Builds keeps serving the
   last successful deploy; it does not publish a half-built site.

Recovery if originals are ever lost: they are git-tracked
(`git checkout -- sites/nathamuni-com/assets/thumbnails`), and are in any case
re-downloadable from Instagram via `scripts/instagram-sync.mjs`.

## Known pre-existing breakage (NOT caused by this work)

`lib/blog.test.ts` fails 2 tests on clean `main`:
- `real-confidence-is-not-a-posture` has no `references`
- a post falls outside the word-count bounds

Traced to `b8ff611` ("add two blog posts"). Verified by stashing all upgrade changes and
re-running against `main`. **CI is red on `main` independently of this branch.** Left
alone deliberately — it is content, and the test may be correct.

## Before ever merging to main

1. `npm run lint && npm run type-check && npm test && npm run build` — all green
   (blog test excepted, or fixed first).
2. Confirm `out/` contains thumbnails: `ls out/images/thumbnails/*.webp | wc -l` = 171.
3. Confirm OG still resolves: `grep -o 'og:image[^>]*' out/videos/just-goat.html`.
4. Open a PR rather than pushing `main` directly, so CI runs before Workers Builds does.
