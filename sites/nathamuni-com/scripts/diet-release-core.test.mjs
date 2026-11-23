import { describe, it, expect } from 'vitest'
import { deflateRawSync, crc32 } from 'node:zlib'
import {
  readZip,
  extractNotes,
  describeRelease,
  addRelease,
  compareSemver,
  MAX_ZIP_BYTES,
} from './diet-release-core.mjs'

/** Minimal zip writer: [{ path, data, deflate? }] → Buffer. */
function makeZip(files) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const f of files) {
    const name = Buffer.from(f.path)
    const raw = Buffer.from(f.data ?? '')
    const body = f.deflate ? deflateRawSync(raw) : raw
    const crc = crc32(raw)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(f.deflate ? 8 : 0, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(name.length, 26)
    locals.push(local, name, body)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(f.deflate ? 8 : 0, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(body.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)
    offset += 30 + name.length + body.length
  }
  const cd = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(files.length, 8)
  eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cd.length, 12)
  eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, eocd])
}

const PLUGIN = {
  name: 'south-indian-satvahara',
  version: '1.2.5',
  author: { name: 'Nathamuni' },
  description: 'fallback description',
  extensions: {
    'com.openai': {
      interface: {
        displayName: 'South Indian Satvahara',
        developerName: 'Nathamuni',
        shortDescription: 'South Indian diet & nutrition',
        longDescription: 'A vegetarian-only coach.',
        defaultPrompt: ['Plan my meals.', 'Audit what I eat.'],
      },
    },
  },
}

const README = `# South Indian Satvahara

## Upgrade 1.2.4 — Challenges & Reminder Handoff

Adds challenges.

## Upgrade 1.2.5 — South Indian Satvahara branding

Updates the product name to **South Indian Satvahara**.

Keeps the \`vegetarian-only\` rules.
## Disclaimer
Not medical advice.
`

const pluginZip = (overrides = {}, extra = []) =>
  makeZip([
    { path: 'plugin.json', data: JSON.stringify({ ...PLUGIN, ...overrides }) },
    { path: 'README.md', data: README, deflate: true },
    { path: '.claude-plugin/plugin.json', data: '{"name":"x"}' },
    { path: 'skills/nathamuni/', data: '' },
    { path: 'skills/nathamuni/SKILL.md', data: '---\nname: nathamuni\n---\nbody', deflate: true },
    ...extra,
  ])

describe('readZip', () => {
  it('lists files, skips directories, and reads stored and deflated entries', () => {
    const entries = readZip(pluginZip())
    expect(entries.map((e) => e.path)).toEqual([
      'plugin.json',
      'README.md',
      '.claude-plugin/plugin.json',
      'skills/nathamuni/SKILL.md',
    ])
    expect(entries[3].read().toString()).toContain('name: nathamuni')
    expect(entries[1].bytes).toBe(Buffer.byteLength(README))
  })

  it('rejects a file that is not a zip', () => {
    expect(() => readZip(Buffer.from('%PDF-1.7 not a zip at all, just some bytes'))).toThrow(/not a zip/)
  })

  it('rejects paths that would escape the unzip folder', () => {
    expect(() => readZip(makeZip([{ path: '../evil.md', data: 'x' }]))).toThrow(/unsafe path/)
    expect(() => readZip(makeZip([{ path: '/etc/evil', data: 'x' }]))).toThrow(/unsafe path/)
  })
})

describe('extractNotes', () => {
  it('takes the section for exactly that version, up to the next heading', () => {
    const notes = extractNotes(README, '1.2.5')
    expect(notes.title).toBe('South Indian Satvahara branding')
    expect(notes.text).toContain('**South Indian Satvahara**')
    expect(notes.text).not.toContain('Not medical advice')
  })

  it('does not confuse 1.2.4 with 1.2.45', () => {
    expect(extractNotes('## Upgrade 1.2.45 — later\n\nx', '1.2.4')).toBeNull()
  })

  it('returns null when the version has no section', () => {
    expect(extractNotes(README, '9.9.9')).toBeNull()
  })
})

describe('describeRelease', () => {
  it('builds the release record from plugin.json and README', () => {
    const buf = pluginZip()
    const r = describeRelease(buf, { date: '2026-11-23' })
    expect(r).toMatchObject({
      version: '1.2.5',
      date: '2026-11-23',
      name: 'south-indian-satvahara',
      displayName: 'South Indian Satvahara',
      developerName: 'Nathamuni',
      description: 'A vegetarian-only coach.',
      prompts: ['Plan my meals.', 'Audit what I eat.'],
      hasSkill: true,
      file: '/downloads/diet/south-indian-satvahara-v1.2.5.zip',
      bytes: buf.length,
    })
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(r.notes.title).toBe('South Indian Satvahara branding')
    expect(r.files).toHaveLength(4)
  })

  it('handles a zip whose plugin sits inside one top folder', () => {
    const buf = makeZip([
      { path: 'Satvahara_v2/plugin.json', data: JSON.stringify({ ...PLUGIN, version: '2.0.0' }) },
      { path: 'Satvahara_v2/skills/nathamuni/SKILL.md', data: 'x' },
    ])
    const r = describeRelease(buf, { date: '2026-12-01' })
    expect(r.version).toBe('2.0.0')
    expect(r.files.map((f) => f.path)).toEqual(['plugin.json', 'skills/nathamuni/SKILL.md'])
  })

  it('refuses a zip with an email address unless allowed', () => {
    const buf = pluginZip({ author: { name: 'N', email: 'someone@example.com' } })
    expect(() => describeRelease(buf, { date: '2026-11-23' })).toThrow(/plugin.json: someone@example.com/)
    expect(describeRelease(buf, { date: '2026-11-23', allowEmail: true }).version).toBe('1.2.5')
  })

  it('uses --notes over the README when given', () => {
    const r = describeRelease(pluginZip(), { date: '2026-11-23', notesOverride: 'Hand notes' })
    expect(r.notes).toEqual({ title: '', text: 'Hand notes' })
  })

  it('rejects a bad version, a missing plugin.json, and an oversized file', () => {
    expect(() => describeRelease(pluginZip({ version: 'v1.3' }))).toThrow(/not X.Y.Z/)
    expect(() => describeRelease(makeZip([{ path: 'SKILL.md', data: 'x' }]))).toThrow(/no plugin.json/)
    expect(() => describeRelease(Buffer.alloc(MAX_ZIP_BYTES + 1))).toThrow(/limit/)
  })
})

describe('addRelease', () => {
  const rel = (version) => ({ version })

  it('puts the new version first', () => {
    const m = addRelease(addRelease({ releases: [] }, rel('1.2.4')), rel('1.2.5'))
    expect(m.releases.map((r) => r.version)).toEqual(['1.2.5', '1.2.4'])
  })

  it('refuses to republish a version or go backwards', () => {
    const m = { releases: [rel('1.2.5')] }
    expect(() => addRelease(m, rel('1.2.5'))).toThrow(/already released/)
    expect(() => addRelease(m, rel('1.2.4'))).toThrow(/not newer/)
  })

  it('compares versions numerically, not as text', () => {
    expect(compareSemver('1.10.0', '1.9.9')).toBeGreaterThan(0)
  })
})
