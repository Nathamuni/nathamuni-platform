#!/usr/bin/env node
/**
 * Publish a new version of the diet plugin on /diet.
 *
 *   npm run diet:release -- path/to/plugin.zip [--date YYYY-MM-DD] [--notes "..."] [--dry-run]
 *
 * Refuses a zip that contains an email address (it would be public) unless --allow-email.
 * Reads the version, name and copy from the zip's plugin.json and the release notes from
 * its README ("## Upgrade X.Y.Z — title"), copies the zip to
 * public/downloads/diet/<name>-v<version>.zip and adds it to the top of lib/diet.json.
 * Older versions stay where they are, so every link ever shared keeps working, and
 * nathamuni.com/diet/latest.zip always points at the newest one (worker/diet.mjs).
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { addRelease, describeRelease } from './diet-release-core.mjs'

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = join(SITE, 'lib/diet.json')

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    date: { type: 'string' },
    notes: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'allow-email': { type: 'boolean', default: false },
  },
})

if (positionals.length !== 1) {
  console.error('usage: npm run diet:release -- path/to/plugin.zip [--date YYYY-MM-DD] [--notes "..."] [--dry-run]')
  process.exit(1)
}

const date = values.date ?? new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD, got "${date}"`)
  process.exit(1)
}

try {
  const zipPath = resolve(positionals[0])
  const buf = readFileSync(zipPath)
  const release = describeRelease(buf, {
    date,
    notesOverride: values.notes,
    allowEmail: values['allow-email'],
  })
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const next = addRelease(manifest, release)
  const target = join(SITE, 'public', release.file)
  if (existsSync(target)) throw new Error(`${release.file} already exists — refusing to overwrite`)

  console.log(`${release.displayName} v${release.version} (${date})`)
  console.log(`  ${release.files.length} files, ${(release.bytes / 1024).toFixed(1)} KB, sha256 ${release.sha256.slice(0, 16)}…`)
  console.log(`  notes: ${release.notes ? release.notes.title || '(untitled)' : 'none found in README — pass --notes'}`)
  if (!release.hasSkill) console.warn('  warning: no SKILL.md in the zip — hosts may reject it')
  console.log(`  → public${release.file}`)

  if (values['dry-run']) {
    console.log('dry run: nothing written')
  } else {
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(zipPath, target)
    writeFileSync(MANIFEST, JSON.stringify(next, null, 2) + '\n')
    console.log('done — commit lib/diet.json and the new zip, then deploy')
  }
} catch (err) {
  console.error(`release failed: ${err.message}`)
  process.exit(1)
}
