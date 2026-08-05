#!/usr/bin/env node
/**
 * SessionStart hook — UI inventory.
 *
 * Tells the next agent what UI already exists, so it extends the system instead of
 * inventing a parallel one. Answers three questions before anyone asks them:
 *   what design tokens exist, what components exist, what conventions are in force.
 *
 * Contract: prints one JSON object with hookSpecificOutput.additionalContext, and
 * ALWAYS exits 0. A hook that can fail is a hook that blocks sessions — on any error
 * it emits nothing and gets out of the way.
 *
 * Budget: hard-capped (see MAX_CHARS). This text is prepended to every session in the
 * project, so it is charged on every single turn. Cheap or it does not belong here.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const MAX_CHARS = 2000;

const emit = (text) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: text.slice(0, MAX_CHARS),
    },
  }));
  process.exit(0);
};

try {
  // ---- locate UI roots: a plain app, or sites/* in a monorepo -----------------
  const candidates = [];
  const sitesDir = join(ROOT, 'sites');
  if (existsSync(sitesDir)) {
    for (const d of readdirSync(sitesDir)) {
      const p = join(sitesDir, d);
      if (statSync(p).isDirectory() && existsSync(join(p, 'components'))) candidates.push(p);
    }
  }
  if (existsSync(join(ROOT, 'components'))) candidates.push(ROOT);
  if (!candidates.length) process.exit(0); // not a UI project — say nothing

  const walk = (dir, ext, acc = []) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, ext, acc);
      else if (e.name.endsWith(ext) && !e.name.includes('.test.')) acc.push(p);
    }
    return acc;
  };

  const blocks = [];

  for (const site of candidates) {
    const name = basename(site);
    const parts = [];

    // ---- design tokens -------------------------------------------------------
    const cssFiles = existsSync(join(site, 'app')) ? walk(join(site, 'app'), '.css') : [];
    const tokens = new Set();
    for (const f of cssFiles) {
      for (const m of readFileSync(f, 'utf8').matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)) tokens.add(m[1]);
    }
    if (tokens.size) {
      // group by prefix so 51 tokens read as 6 families, not a wall of names
      const fam = {};
      for (const t of tokens) {
        const k = t.split('-')[2] || 'misc';
        (fam[k] ||= []).push(t);
      }
      const top = Object.entries(fam).sort((a, b) => b[1].length - a[1].length).slice(0, 6);
      parts.push(`tokens (${tokens.size}) in app/globals.css — ` +
        top.map(([k, v]) => `--*-${k}*(${v.length})`).join(' '));
    }

    // ---- components ----------------------------------------------------------
    const cdir = join(site, 'components');
    if (existsSync(cdir)) {
      const files = walk(cdir, '.tsx');
      const groups = {};
      for (const f of files) {
        const rel = f.slice(cdir.length + 1);
        const g = rel.includes('/') ? rel.split('/')[0] : '(root)';
        (groups[g] ||= []).push(basename(f, '.tsx'));
      }
      parts.push(`components (${files.length}) in components/ — ` +
        Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
          .map(([g, v]) => `${g}(${v.length})`).join(' '));

      const shared = groups['ui'];
      if (shared) parts.push(`shared primitives: ${shared.join(', ')}`);
    }

    if (parts.length) blocks.push(`### ${name}\n${parts.join('\n')}`);
  }

  if (!blocks.length) process.exit(0);

  emit(
    `## UI inventory (auto, SessionStart)\n\n${blocks.join('\n\n')}\n\n` +
    `Before adding UI: reuse these tokens and components rather than introducing new ` +
    `colours, spacing or a parallel component. If something here is missing, say so ` +
    `rather than hard-coding a value.\n` +
    `This inventory is generated from the filesystem — it lists what EXISTS, not what ` +
    `is correct or in use. Verify before relying on any entry.`
  );
} catch {
  process.exit(0); // never block a session over an inventory
}
