# interface-craft — reference material

Research output, 2026-08-05. **Not installed. Not wired into the harness.**
Nothing here is referenced by `Caveman-UI_UX-v10/manifest.json`, so `./update.sh` never sees it.

These are the reference files that *would* ship inside a future `interface-craft` skill.
Keeping them here first is deliberate: it lets the material be used and corrected against
real work before any of it earns a place in the global harness.

## Files

| File | What it is |
|---|---|
| `catalog.yaml` | Reference index — registries, studios, galleries. Records carry `fetch_status` + `last_verified`, and most are **unverified**; see the honesty note below. |
| `registries.md` | The free component pipeline: shadcn MCP + which registries to declare, and why 21st.dev is not a dependency. |
| `complexity-budget.md` | Replaces the naive "technology ladder". When an effect is allowed to get expensive, and what it must ship with. |
| `direction-cards.md` | The design-direction format, the differentiation test, and when to skip it entirely. |
| `narrative-architecture.md` | Structural storytelling for immersive/brand surfaces. Scene order and exit paths, not adjectives. |
| `component-audit.md` | Checklist for third-party component code. Applies whenever fetched code is used, regardless of source. |

## How this was arrived at

Three passes, each of which cut scope:

1. **ChatGPT proposal** — 8 skills, custom MCP, private registry, scripts, YAML schemas.
2. **This session's research** — the official shadcn MCP already does free, keyless
   search + install across any registry (`npx shadcn@latest mcp init --client claude`).
   That deleted the entire custom-retrieval layer. 21st.dev's own free tier
   (2 installs/day, 100 credits/month) disqualified it as a dependency.
3. **Codex review** (`gpt-5.6-luna`, `xhigh`, read-only) — attacked the result. Three
   findings survived scrutiny and are reflected in these files:
   - a prompt-based phase gate is a request, not a control boundary;
   - the "technology ladder" mixes techniques, libraries and rendering substrates,
     so it is not a ladder — a small shader can be simpler than a complex GSAP timeline;
   - a static catalogue of gallery homepages decays into a fake API.

## Honesty note on `catalog.yaml`

Most records are `fetch_status: unverified` with `last_verified: null`. That is not an
oversight — it is the point. Codex's sharpest criticism was that a hand-curated catalogue
lets an agent write "research completed" when retrieval actually failed. So the catalogue
ships marked as unproven, and a record is only trustworthy once something has actually
fetched it and stamped it.

Verified in this session: the shadcn MCP docs, `registry.directory`, the awesome-shadcn
registries index, and 21st.dev's pricing page. Everything else is a pointer, not a finding.

## Status

Proposal-stage. No skill exists. No manifest edit has been made. No skill has been
installed or removed. The open decisions are recorded in the session, not here.
