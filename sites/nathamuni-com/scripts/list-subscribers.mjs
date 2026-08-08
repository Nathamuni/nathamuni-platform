#!/usr/bin/env node
/**
 * Shows who is actually on the list, read from the INBOX KV namespace.
 *
 *   node scripts/list-subscribers.mjs            # summary + table
 *   node scripts/list-subscribers.mjs --emails   # just the addresses, one per line
 *   node scripts/list-subscribers.mjs --csv      # spreadsheet / ESP import
 *
 * Read-only: it never writes, deletes, or sends anything.
 *
 * Needs wrangler to be authenticated (`npx wrangler login`), or CLOUDFLARE_API_TOKEN
 * set with Workers KV Storage: Read.
 */
import { execFileSync } from 'node:child_process'

const BINDING = 'INBOX'
const mode = process.argv.includes('--emails')
  ? 'emails'
  : process.argv.includes('--csv')
    ? 'csv'
    : 'table'

function wrangler(args) {
  return execFileSync('npx', ['--yes', 'wrangler', ...args], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
}

function main() {
  let keys
  try {
    keys = JSON.parse(wrangler(['kv', 'key', 'list', '--binding', BINDING, '--remote']))
  } catch (err) {
    console.error(
      'Could not read KV. Authenticate first:\n' +
        '  npx wrangler login\n' +
        'or set CLOUDFLARE_API_TOKEN with "Workers KV Storage: Read".\n\n' +
        String(err.message).split('\n').slice(0, 3).join('\n')
    )
    process.exit(1)
  }

  const joinKeys = keys.map((k) => k.name).filter((n) => n.startsWith('join:'))
  if (joinKeys.length === 0) {
    console.log('No signups yet — the list is empty.')
    return
  }

  const rows = []
  for (const key of joinKeys) {
    let value
    try {
      value = wrangler(['kv', 'key', 'get', key, '--binding', BINDING, '--remote'])
    } catch {
      rows.push({ email: key.slice(5), status: 'UNREADABLE' })
      continue
    }
    try {
      const r = JSON.parse(value)
      rows.push({
        email: r.email ?? key.slice(5),
        // Records written before double opt-in existed have no status field. They are
        // signups that were never confirmed and were never sent anything.
        status: r.status ?? 'legacy (pre-confirmation)',
        joined: (r.at ?? '').slice(0, 10),
        confirmed: (r.confirmedAt ?? '').slice(0, 10),
        welcomed: r.welcomedAt ? 'yes' : '',
        ambition: r.ambition ?? '',
      })
    } catch {
      rows.push({ email: key.slice(5), status: 'UNPARSEABLE', raw: value.slice(0, 60) })
    }
  }

  rows.sort((a, b) => (b.joined ?? '').localeCompare(a.joined ?? ''))

  if (mode === 'emails') {
    rows.forEach((r) => console.log(r.email))
    return
  }
  if (mode === 'csv') {
    console.log('email,status,joined,confirmed,welcomed,ambition')
    rows.forEach((r) =>
      console.log(
        [r.email, r.status, r.joined, r.confirmed, r.welcomed, `"${(r.ambition ?? '').replace(/"/g, '""')}"`].join(',')
      )
    )
    return
  }

  const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})
  console.log(`\n${rows.length} signup${rows.length === 1 ? '' : 's'} in KV\n`)
  Object.entries(counts).forEach(([status, n]) => console.log(`  ${String(n).padStart(4)}  ${status}`))
  console.log()
  const pad = (s, n) => String(s ?? '').padEnd(n)
  console.log(`  ${pad('EMAIL', 34)}${pad('STATUS', 26)}${pad('JOINED', 12)}AMBITION`)
  rows.forEach((r) =>
    console.log(`  ${pad(r.email, 34)}${pad(r.status, 26)}${pad(r.joined, 12)}${(r.ambition ?? '').slice(0, 40)}`)
  )
  console.log()
  if (counts['legacy (pre-confirmation)']) {
    console.log(
      'Note: "legacy" rows predate double opt-in. They never confirmed and have never\n' +
        'been emailed. Mailing them is a judgement call — see docs before doing it.\n'
    )
  }
}

main()
