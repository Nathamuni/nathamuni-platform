# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js / React website for the Nathamuni platform.
GitHub remote: `https://github.com/Nathamuni/nathamuni-platform.git`

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run type-check # TypeScript type check (tsc --noEmit)
npm test           # run tests (if configured)
```

## CI

GitHub Actions runs on every push to `main` / `develop` and on PRs targeting `main`:
- Install → Lint → Type-check → Build
- Workflow file: `.github/workflows/ci.yml`

## Architecture

This is a Next.js App Router project (once scaffolded). Key conventions:
- Pages live under `app/` (App Router) or `pages/` (Pages Router) depending on what is set up
- Shared components go in `components/`
- Utility/helper code goes in `lib/` or `utils/`
- Static assets go in `public/`
- Environment variables are prefixed `NEXT_PUBLIC_` for client-side exposure

## Memory & Harness Directories

| Path | Purpose |
|---|---|
| `memory/` | Durable project knowledge (see `memory/README.md`) |
| `plans/` | Implementation plans before coding (WISC "Write" step) |
| `research/` | Long-form research findings |
| `explanations/` | Local-only interactive HTML explanations (gitignored) |
| `.claude/settings.json` | Project-level Claude Code permissions |

The global SessionStart hook checks for `memory/README.md` and loads `memory/soul.md` + `memory/user.md` at the start of each session.

## Branch Strategy

- `main` — production-ready code, protected; CI must pass before merge
- `develop` — integration branch for feature work
- Feature branches: `feat/<name>`, fix branches: `fix/<name>`
