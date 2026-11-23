import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  matchesKeyword,
  matchingRules,
  shortcodeOf,
  applyDmCommand,
  dmCommand,
  sanitizeSettings,
  verifySignature,
  extractComments,
  processComment,
  handleWebhook,
  handleAdminApi,
  verifyAccess,
} from './commentdm.mjs'

const kv = () => {
  const m = new Map()
  return {
    get: async (k) => m.get(k) ?? null,
    put: async (k, v) => void m.set(k, v),
    _m: m,
  }
}
const sign = async (body, secret) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return 'sha256=' + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const rule = { id: 'r1', keywords: 'link, guide', dm: 'Here: https://x.test/a', publicReplies: ['Sent!'] }
const payload = (over = {}) => ({
  entry: [{ id: 'OWN1', changes: [{ field: 'comments', value: { id: 'C1', text: 'send me the LINK pls', media: { id: '555555' }, from: { id: 'U1', username: 'fan' }, ...over } }] }],
})

afterEach(() => vi.unstubAllGlobals())

describe('matching', () => {
  it('matches whole words, any case, not substrings', () => {
    expect(matchesKeyword('Send LINK!', 'link')).toBe(true)
    expect(matchesKeyword('linkedin', 'link')).toBe(false)
    expect(matchesKeyword('வணக்கம் guide', 'guide')).toBe(true)
    expect(matchesKeyword('anything', '')).toBe(false)
  })
  it('respects off switches and the media filter', () => {
    const s = { enabled: true, rules: [{ ...rule, mediaId: '999999' }] }
    expect(matchingRules(s, 'link', '555555')).toHaveLength(0)
    expect(matchingRules(s, 'link', '999999')).toHaveLength(1)
    expect(matchingRules({ ...s, enabled: false }, 'link', '999999')).toHaveLength(0)
    expect(matchingRules({ enabled: true, rules: [{ ...rule, enabled: false }] }, 'link', '1')).toHaveLength(0)
  })
  it('puts a reel-specific rule ahead of the catch-all', () => {
    const s = { enabled: true, rules: [{ ...rule, id: 'all' }, { ...rule, id: 'one', reel: 'ABC123' }] }
    expect(matchingRules(s, 'link', '1').map((r) => r.id)).toEqual(['one', 'all'])
  })
  it('reads shortcodes from reel, post and profile-prefixed links', () => {
    expect(shortcodeOf('https://www.instagram.com/reel/DaczeEJRhpZ/?igsh=x')).toBe('DaczeEJRhpZ')
    expect(shortcodeOf('https://www.instagram.com/nathamuni_/reel/ABC_1-x/')).toBe('ABC_1-x')
    expect(shortcodeOf('https://www.instagram.com/p/XYZ9/')).toBe('XYZ9')
    expect(shortcodeOf('https://example.com/reel/ABC')).toBe('')
  })
})

describe('sanitizeSettings', () => {
  it('rejects empty keywords, empty DM and oversize Tamil DMs', () => {
    expect(() => sanitizeSettings({ rules: [{ keywords: '', dm: 'x' }] })).toThrow(/keyword/)
    expect(() => sanitizeSettings({ rules: [{ keywords: 'a', dm: '' }] })).toThrow(/empty/)
    expect(() => sanitizeSettings({ rules: [{ keywords: 'a', dm: 'த'.repeat(400) }] })).toThrow(/1000 bytes/)
    expect(() => sanitizeSettings({ rules: [{ keywords: 'a', dm: 'x', mediaId: 'abc' }] })).toThrow(/media ID/)
  })
  it('turns a reel link into a shortcode and rejects other links', () => {
    const out = sanitizeSettings({ rules: [{ keywords: 'a', dm: 'x', reelUrl: 'https://www.instagram.com/reel/ABC123/' }] })
    expect(out.rules[0].reel).toBe('ABC123')
    expect(() => sanitizeSettings({ rules: [{ keywords: 'a', dm: 'x', reelUrl: 'https://example.com' }] })).toThrow(/reel or post link/)
  })
  it('cleans and keeps valid rules', () => {
    const out = sanitizeSettings({ rules: [{ keywords: ' link ', dm: ' hi ', publicReplies: [' a ', ''] }] })
    expect(out.rules[0]).toMatchObject({ keywords: 'link', dm: 'hi', publicReplies: ['a'], enabled: true })
  })
})

describe('webhook', () => {
  it('verifies signatures and rejects bad ones', async () => {
    const sig = await sign('{"a":1}', 's3')
    expect(await verifySignature('{"a":1}', sig, 's3')).toBe(true)
    expect(await verifySignature('{"a":2}', sig, 's3')).toBe(false)
    expect(await verifySignature('{"a":1}', sig, '')).toBe(false)
    expect(await verifySignature('{"a":1}', null, 's3')).toBe(false)
  })
  it('answers the Meta GET handshake only with the right token', async () => {
    const env = { IG_VERIFY_TOKEN: 'tok' }
    const ok = await handleWebhook(new Request('https://x/api/ig/webhook?hub.mode=subscribe&hub.verify_token=tok&hub.challenge=42'), env)
    expect(await ok.text()).toBe('42')
    const bad = await handleWebhook(new Request('https://x/api/ig/webhook?hub.mode=subscribe&hub.verify_token=no&hub.challenge=42'), env)
    expect(bad.status).toBe(403)
  })
  it('drops our own comments and thread replies', () => {
    expect(extractComments(payload({ from: { id: 'OWN1', username: 'me' } }))).toHaveLength(0)
    expect(extractComments(payload())[0]).toMatchObject({ commentId: 'C1', mediaId: '555555', username: 'fan' })
  })
  it('rejects an unsigned POST with 401 and sends nothing', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const res = await handleWebhook(new Request('https://x/api/ig/webhook', { method: 'POST', body: JSON.stringify(payload()) }), { IG_APP_SECRET: 's3', INBOX: kv() })
    expect(res.status).toBe(401)
    expect(f).not.toHaveBeenCalled()
  })
})

describe('processComment', () => {
  const setup = async () => {
    const INBOX = kv()
    await INBOX.put('ig:rules', JSON.stringify({ enabled: true, rules: [rule] }))
    const f = vi.fn(async () => Response.json({ ok: true }))
    vi.stubGlobal('fetch', f)
    return { env: { INBOX, IG_ACCESS_TOKEN: 'T' }, f }
  }
  const c = { commentId: 'C1', text: 'link please', mediaId: '555555', userId: 'U1', username: 'fan', parentId: '' }

  it('sends one DM and one public reply, then ignores a retry of the same comment', async () => {
    const { env, f } = await setup()
    await processComment(env, c)
    expect(f).toHaveBeenCalledTimes(2)
    const [dmUrl, dmInit] = f.mock.calls[0]
    expect(dmUrl).toContain('/me/messages')
    expect(JSON.parse(dmInit.body)).toEqual({ recipient: { comment_id: 'C1' }, message: { text: 'Here: https://x.test/a' } })
    expect(f.mock.calls[1][0]).toContain('/C1/replies')
    await processComment(env, c)
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('does nothing for non-matching comments and thread replies', async () => {
    const { env, f } = await setup()
    await processComment(env, { ...c, text: 'nice reel' })
    await processComment(env, { ...c, commentId: 'C2', parentId: 'P' })
    expect(f).not.toHaveBeenCalled()
  })
  it('records a failed DM in the log instead of throwing', async () => {
    const { env } = await setup()
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: { message: 'nope' } }, { status: 400 })))
    await processComment(env, c)
    expect(JSON.parse(await env.INBOX.get('ig:log'))[0].dm).toContain('failed: nope')
  })
})

describe('admin gate', () => {
  it('fails closed with no Access config or no JWT', async () => {
    expect(await verifyAccess(new Request('https://x'), {})).toBeNull()
    const res = await handleAdminApi(new Request('https://x/api/admin/ig-rules', { headers: { 'cf-access-authenticated-user-email': 'me@x.com' } }), { ADMIN_EMAIL: 'me@x.com', INBOX: kv() })
    expect(res.status).toBe(403)
  })
  it('accepts a correctly signed Access JWT and rejects wrong email, audience, expiry or signature', async () => {
    const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
    const jwk = { ...(await crypto.subtle.exportKey('jwk', pair.publicKey)), kid: 'k1' }
    const b64 = (o) => btoa(typeof o === 'string' ? o : JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const mk = async (claims, key = pair.privateKey) => {
      const h = b64({ alg: 'RS256', kid: 'k1' })
      const p = b64(claims)
      const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`)))
      return `${h}.${p}.${b64(String.fromCharCode(...sig))}`
    }
    const env = { CF_ACCESS_TEAM_DOMAIN: 't.cloudflareaccess.com', CF_ACCESS_AUD: 'AUD', ADMIN_EMAIL: 'Me@x.com' }
    const certs = async () => Response.json({ keys: [jwk] })
    const good = { aud: ['AUD'], iss: 'https://t.cloudflareaccess.com', exp: 2000, email: 'me@x.com' }
    const run = async (claims, key) => verifyAccess(new Request('https://x', { headers: { 'cf-access-jwt-assertion': await mk(claims, key) } }), env, certs, 1000)
    expect(await run(good)).toBe('me@x.com')
    expect(await run({ ...good, email: 'evil@x.com' })).toBeNull()
    expect(await run({ ...good, aud: ['OTHER'] })).toBeNull()
    expect(await run({ ...good, exp: 500 })).toBeNull()
    const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
    expect(await run(good, other.privateKey)).toBeNull()
  })
})

describe('reel-specific rules', () => {
  const reelRule = { ...rule, keywords: 'link', dm: 'Reel DM', reel: 'ABC123', publicReplies: [] }
  const generic = { ...rule, id: 'g', keywords: 'link', dm: 'Generic DM', publicReplies: [] }
  const run = async (permalink, text = 'link') => {
    const INBOX = kv()
    await INBOX.put('ig:rules', JSON.stringify({ enabled: true, rules: [generic, reelRule] }))
    const f = vi.fn(async (url) => (String(url).includes('fields=permalink') ? Response.json({ permalink }) : Response.json({ ok: true })))
    vi.stubGlobal('fetch', f)
    await processComment({ INBOX, IG_ACCESS_TOKEN: 'T' }, { commentId: 'C9', text, mediaId: '777777', userId: 'U', username: 'fan', parentId: '' })
    const sent = f.mock.calls.find(([u]) => String(u).includes('/messages'))
    return { f, text: sent ? JSON.parse(sent[1].body).message.text : null, INBOX }
  }
  it('sends the reel DM on that reel and caches the lookup', async () => {
    const r = await run('https://www.instagram.com/reel/ABC123/')
    expect(r.text).toBe('Reel DM')
    expect(await r.INBOX.get('ig:media:777777')).toBe('ABC123')
  })
  it('falls back to the catch-all on any other reel', async () => {
    expect((await run('https://www.instagram.com/reel/OTHER/')).text).toBe('Generic DM')
  })
})

describe('/dm Telegram command', () => {
  const empty = { enabled: true, rules: [] }
  it('adds a rule with a reel link, then lists it', () => {
    const a = applyDmCommand(empty, 'add link, guide | Here you go https://x.test | https://www.instagram.com/reel/ABC123/')
    expect(a.changed).toBe(true)
    expect(a.settings.rules[0]).toMatchObject({ keywords: 'link, guide', dm: 'Here you go https://x.test', reel: 'ABC123' })
    expect(applyDmCommand(a.settings, '').reply).toContain('reel ABC123')
  })
  it('explains mistakes instead of saving them', () => {
    const r = applyDmCommand(empty, 'add link')
    expect(r.changed).toBe(false)
    expect(r.reply).toContain('DM message is empty')
    expect(applyDmCommand(empty, 'del 3').reply).toContain('no rule 3')
  })
  it('adds and clears public replies, switches rules and deletes', () => {
    let s = applyDmCommand(empty, 'add link | hi').settings
    s = applyDmCommand(s, 'reply 1 | Sent you a DM!').settings
    expect(s.rules[0].publicReplies).toEqual(['Sent you a DM!'])
    s = applyDmCommand(s, 'reply 1 clear').settings
    expect(s.rules[0].publicReplies).toEqual([])
    expect(applyDmCommand(s, 'off 1').settings.rules[0].enabled).toBe(false)
    expect(applyDmCommand(s, 'off').settings.enabled).toBe(false)
    expect(applyDmCommand(s, 'del 1').settings.rules).toHaveLength(0)
  })
  it('escapes user text in replies and saves through KV', async () => {
    const INBOX = kv()
    const reply = await dmCommand({ INBOX }, 'add <b>x</b> | y')
    expect(reply).toContain('&lt;b&gt;x')
    expect(JSON.parse(await INBOX.get('ig:rules')).rules).toHaveLength(1)
  })
})
