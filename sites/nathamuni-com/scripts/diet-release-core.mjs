/**
 * Pure helpers behind scripts/diet-release.mjs (kept separate so they are testable
 * without touching the filesystem).
 *
 * A release is one plugin zip. Everything the /diet page shows about it is read from
 * the zip itself — the root plugin.json (name, version, display copy, starter prompts)
 * and the README's "## Upgrade <version>" section (release notes) — so the page never
 * says anything the plugin does not.
 */

import { createHash } from 'node:crypto'
import { inflateRawSync } from 'node:zlib'

export const MAX_ZIP_BYTES = 1024 * 1024 // a skills plugin is ~50 KB; 1 MB means a wrong file

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g

/** Email addresses in the zip's text files — the zip is public, so these would be too. */
export function findEmails(entries) {
  const hits = []
  for (const e of entries) {
    if (!/\.(md|json|txt|ya?ml)$/i.test(e.path)) continue
    for (const m of e.read().toString('utf8').matchAll(EMAIL)) hits.push(`${e.path}: ${m[0]}`)
  }
  return hits
}

export function parseSemver(v) {
  const m = SEMVER.exec(String(v ?? '').trim())
  return m ? m.slice(1).map(Number) : null
}

export function compareSemver(a, b) {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}

/**
 * Reads a zip's central directory. Returns [{ path, bytes, read() }] for files
 * (directories skipped). Throws on anything that is not a plain zip, and on entry
 * paths that could escape the folder a visitor unzips into.
 */
export function readZip(buf) {
  if (buf.length < 22 || buf.readUInt32LE(0) !== 0x04034b50) {
    throw new Error('not a zip file (missing PK signature)')
  }
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('zip end-of-directory record not found')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  if (count === 0xffff || p === 0xffffffff) throw new Error('zip64 archives are not supported')

  const entries = []
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('corrupt zip central directory')
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const size = buf.readUInt32LE(p + 24)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOffset = buf.readUInt32LE(p + 42)
    const path = buf.toString('utf8', p + 46, p + 46 + nameLen)
    p += 46 + nameLen + extraLen + commentLen

    if (path.startsWith('/') || path.includes('\\') || path.split('/').includes('..')) {
      throw new Error(`unsafe path inside zip: ${path}`)
    }
    if (path.endsWith('/')) continue
    if (path.startsWith('__MACOSX/') || path.endsWith('.DS_Store')) continue

    entries.push({
      path,
      bytes: size,
      read() {
        const ln = buf.readUInt16LE(localOffset + 26)
        const le = buf.readUInt16LE(localOffset + 28)
        const start = localOffset + 30 + ln + le
        const data = buf.subarray(start, start + compSize)
        if (method === 0) return Buffer.from(data)
        if (method === 8) return inflateRawSync(data)
        throw new Error(`unsupported compression method ${method} for ${path}`)
      },
    })
  }
  return entries
}

/** The plugin's root folder inside the zip: '' when plugin.json is at the top, else 'Folder/'. */
function pluginRoot(entries) {
  const manifest = entries
    .map((e) => e.path)
    .filter((path) => /(^|\/)plugin\.json$/.test(path) && !path.includes('-plugin/'))
    .sort((a, b) => a.split('/').length - b.split('/').length)[0]
  if (!manifest) throw new Error('no plugin.json found in the zip')
  return manifest.slice(0, -'plugin.json'.length)
}

/** Release notes for one version from the README's "## Upgrade X.Y.Z[ — title]" heading. */
export function extractNotes(readme, version) {
  if (!readme) return null
  const lines = readme.split(/\r?\n/)
  const escaped = version.replace(/\./g, '\\.')
  const head = new RegExp(`^##\\s+Upgrade\\s+${escaped}(?![\\d.])\\s*(?:[—–:-]\\s*(.*))?$`)
  const start = lines.findIndex((l) => head.test(l.trim()))
  if (start < 0) return null
  const title = (head.exec(lines[start].trim())[1] || '').trim()
  const body = []
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line)) break
    body.push(line)
  }
  const text = body.join('\n').trim()
  return text || title ? { title, text } : null
}

/**
 * Turns a zip into a release record. `date` is the release date (YYYY-MM-DD);
 * `notesOverride` replaces the README-derived notes when given; email addresses are
 * refused unless `allowEmail`.
 */
export function describeRelease(buf, { date, notesOverride, allowEmail = false } = {}) {
  if (buf.length > MAX_ZIP_BYTES) {
    throw new Error(`zip is ${buf.length} bytes; the limit is ${MAX_ZIP_BYTES} — wrong file?`)
  }
  const entries = readZip(buf)
  const root = pluginRoot(entries)
  const emails = findEmails(entries)
  if (emails.length && !allowEmail) {
    throw new Error(
      `the zip contains an email address, which would be public on /diet:\n    ${emails.join('\n    ')}\n` +
        '  remove it (e.g. author.email in plugin.json), or pass --allow-email if it is meant to be public'
    )
  }
  const byPath = new Map(entries.map((e) => [e.path, e]))

  let plugin
  try {
    plugin = JSON.parse(byPath.get(`${root}plugin.json`).read().toString('utf8'))
  } catch {
    throw new Error('plugin.json is not valid JSON')
  }
  const version = String(plugin.version ?? '')
  if (!parseSemver(version)) throw new Error(`plugin.json version "${version}" is not X.Y.Z`)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(plugin.name ?? '')) {
    throw new Error(`plugin.json name "${plugin.name}" must be lowercase letters, digits and dashes`)
  }

  const ui = plugin.extensions?.['com.openai']?.interface ?? {}
  const readme = byPath.get(`${root}README.md`)?.read().toString('utf8')
  const notes = notesOverride ? { title: '', text: notesOverride } : extractNotes(readme, version)

  return {
    version,
    date,
    name: plugin.name,
    displayName: ui.displayName || plugin.name,
    developerName: ui.developerName || plugin.author?.name || '',
    shortDescription: ui.shortDescription || '',
    description: ui.longDescription || plugin.description || '',
    prompts: Array.isArray(ui.defaultPrompt) ? ui.defaultPrompt.map(String) : [],
    hasSkill: entries.some((e) => e.path.endsWith('/SKILL.md') || e.path === 'SKILL.md'),
    file: `/downloads/diet/${plugin.name}-v${version}.zip`,
    bytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
    files: entries.map((e) => ({ path: e.path.slice(root.length), bytes: e.bytes })),
    notes,
  }
}

/** Adds a release to the manifest, newest first. Versions are immutable and must go up. */
export function addRelease(manifest, release) {
  const releases = manifest.releases ?? []
  if (releases.some((r) => r.version === release.version)) {
    throw new Error(
      `version ${release.version} is already released — bump "version" in plugin.json; ` +
        'published versions never change, so old download links keep working'
    )
  }
  const latest = releases[0]
  if (latest && compareSemver(release.version, latest.version) <= 0) {
    throw new Error(`version ${release.version} is not newer than the latest (${latest.version})`)
  }
  return { ...manifest, releases: [release, ...releases] }
}
