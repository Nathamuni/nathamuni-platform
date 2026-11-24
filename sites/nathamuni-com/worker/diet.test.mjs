import { describe, it, expect, beforeEach } from 'vitest'
import {
  handleDietLatest,
  handleDietLead,
  handleDietFile,
  normaliseName,
  normalisePhone,
  signDownloadToken,
  verifyDownloadToken,
  LEAD_PER_IP_HOURLY,
} from './diet.mjs'
import worker from './index.mjs'

const SECRET = 'test-secret-not-real'
const DATA = {
  releases: [{ file: '/downloads/diet/p-v1.2.5.zip' }, { file: '/downloads/diet/p-v1.2.4.zip' }],
}
const IP = '203.0.113.7'

function makeEnv() {
  const store = new Map()
  return {
    store,
    DIET_TOKEN_SECRET: SECRET,
    INBOX: { put: async (k, v) => void store.set(k, v) },
    ASSETS: { fetch: async () => new Response('zipbytes', { headers: { 'content-type': 'application/zip' } }) },
  }
}

function post(body, { ip = IP, headers = {} } = {}) {
  return new Request('https://nathamuni.com/api/diet/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip, ...headers },
    body: JSON.stringify(body),
  })
}
const valid = { name: 'Asha Raman', phone: '98765 43210' }
const getReq = (path, ip = IP) => new Request(`https://nathamuni.com${path}`, { headers: { 'cf-connecting-ip': ip } })

beforeEach(() => {
  // In-memory stand-in for the Workers Cache API (counters only).
  const m = new Map()
  globalThis.caches = {
    default: {
      match: async (k) => (m.has(String(k.url ?? k)) ? new Response(m.get(String(k.url ?? k))) : undefined),
      put: async (k, res) => void m.set(String(k.url ?? k), await res.text()),
    },
  }
})

describe('validation', () => {
  it('normalises Indian mobiles to 10 digits', () => {
    for (const raw of ['9876543210', '+91 98765-43210', '919876543210', '09876543210', ' 98765 43210 ']) {
      expect(normalisePhone(raw)).toBe('9876543210')
    }
  })
  it('rejects bad numbers', () => {
    for (const raw of ['', '12345', '5876543210', '9999999999', '98765432101', 'abcdefghij', '98765+43210', '+1 9876543210']) {
      expect(normalisePhone(raw)).toBeNull()
    }
  })
  it('accepts real names including Tamil, rejects junk', () => {
    expect(normaliseName('  Asha   Raman ')).toBe('Asha Raman')
    expect(normaliseName('நாதமுனி')).toBe('நாதமுனி')
    expect(normaliseName("D'Souza-Rao Jr.")).toBe("D'Souza-Rao Jr.")
    for (const bad of ['', 'A', 'x'.repeat(61), 'bob123', '<script>', 'http://spam.io', 'a@b.co', '12']) {
      expect(normaliseName(bad)).toBeNull()
    }
  })
})

describe('POST /api/diet/lead', () => {
  it('stores the lead and returns a tokenised zip url', async () => {
    const env = makeEnv()
    const res = await handleDietLead(post(valid), env, DATA)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.url).toMatch(/^\/downloads\/diet\/p-v1\.2\.5\.zip\?t=\d+\./)
    expect([...env.store.keys()]).toHaveLength(1)
    const [key, value] = [...env.store.entries()][0]
    expect(key).toMatch(/^lead:diet:/)
    const lead = JSON.parse(value)
    expect(lead.name).toBe('Asha Raman')
    expect(lead.phone).toBe('9876543210')
    expect(lead.ipHash).toBeTruthy()
    expect(JSON.stringify(lead)).not.toContain(IP)
  })

  it('honours a specific released file and rejects unknown ones', async () => {
    const env = makeEnv()
    const ok = await handleDietLead(post({ ...valid, file: '/downloads/diet/p-v1.2.4.zip' }), env, DATA)
    expect((await ok.json()).url).toContain('p-v1.2.4.zip')
    const bad = await handleDietLead(post({ ...valid, file: '/etc/passwd' }), env, DATA)
    expect(bad.status).toBe(400)
  })

  it('rejects invalid name or phone without storing', async () => {
    const env = makeEnv()
    expect((await handleDietLead(post({ ...valid, name: '1' }), env, DATA)).status).toBe(400)
    expect((await handleDietLead(post({ ...valid, phone: '12345' }), env, DATA)).status).toBe(400)
    expect(env.store.size).toBe(0)
  })

  it('silently drops honeypot submissions: no url, no storage', async () => {
    const env = makeEnv()
    const res = await handleDietLead(post({ ...valid, website: 'http://bot' }), env, DATA)
    expect(await res.json()).toEqual({ ok: true })
    expect(env.store.size).toBe(0)
  })

  it('rate limits per IP, not across IPs', async () => {
    const env = makeEnv()
    for (let i = 0; i < LEAD_PER_IP_HOURLY; i++) {
      expect((await handleDietLead(post(valid), env, DATA)).status).toBe(200)
    }
    expect((await handleDietLead(post(valid), env, DATA)).status).toBe(429)
    expect((await handleDietLead(post(valid, { ip: '198.51.100.9' }), env, DATA)).status).toBe(200)
  })

  it('refuses cross-origin posts, non-JSON, wrong method, and a missing secret or KV', async () => {
    const env = makeEnv()
    expect((await handleDietLead(post(valid, { headers: { origin: 'https://evil.example' } }), env, DATA)).status).toBe(403)
    const form = new Request('https://nathamuni.com/api/diet/lead', { method: 'POST', body: 'a=b' })
    expect((await handleDietLead(form, env, DATA)).status).toBe(400)
    expect((await handleDietLead(getReq('/api/diet/lead'), env, DATA)).status).toBe(405)
    expect((await handleDietLead(post(valid), { ...env, DIET_TOKEN_SECRET: undefined }, DATA)).status).toBe(503)
    expect((await handleDietLead(post(valid), { ...env, INBOX: undefined }, DATA)).status).toBe(503)
  })
})

describe('download tokens', () => {
  it('verify for the same IP within the window', async () => {
    const t = await signDownloadToken(SECRET, IP)
    expect(await verifyDownloadToken(SECRET, t, IP)).toBe(true)
  })
  it('fail when expired, forged, malformed, wrong IP, wrong secret or no secret', async () => {
    const now = Date.now()
    const t = await signDownloadToken(SECRET, IP, now)
    expect(await verifyDownloadToken(SECRET, t, IP, now + 11 * 60_000)).toBe(false)
    const [exp] = t.split('.')
    expect(await verifyDownloadToken(SECRET, `${exp}.forgedmac`, IP)).toBe(false)
    expect(await verifyDownloadToken(SECRET, `${Number(exp) + 9999}.${t.split('.')[1]}`, IP)).toBe(false)
    expect(await verifyDownloadToken(SECRET, 'garbage', IP)).toBe(false)
    expect(await verifyDownloadToken(SECRET, null, IP)).toBe(false)
    expect(await verifyDownloadToken(SECRET, t, '198.51.100.9')).toBe(false)
    expect(await verifyDownloadToken('other', t, IP)).toBe(false)
    expect(await verifyDownloadToken(undefined, t, IP)).toBe(false)
  })
})

describe('/diet/latest.zip', () => {
  it('without a token sends the visitor to the form, never the zip', async () => {
    const res = await handleDietLatest(getReq('/diet/latest.zip'), makeEnv(), DATA)
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://nathamuni.com/diet?get=1')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
  it('with a forged or expired token also goes to the form', async () => {
    const res = await handleDietLatest(getReq('/diet/latest.zip?t=1.abc'), makeEnv(), DATA)
    expect(res.headers.get('location')).toContain('/diet?get=1')
  })
  it('with a valid token redirects to the newest zip carrying the token', async () => {
    const t = await signDownloadToken(SECRET, IP)
    const res = await handleDietLatest(getReq(`/diet/latest.zip?t=${t}`), makeEnv(), DATA)
    expect(res.headers.get('location')).toBe(`https://nathamuni.com/downloads/diet/p-v1.2.5.zip?t=${t}`)
  })
  it('is a plain 404 before the first release', async () => {
    expect((await handleDietLatest(getReq('/diet/latest.zip'), makeEnv(), { releases: [] })).status).toBe(404)
  })
})

describe('/downloads/diet/*.zip', () => {
  it('raw url without a token goes to the form', async () => {
    const res = await handleDietFile(getReq('/downloads/diet/p-v1.2.5.zip'), makeEnv())
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('/diet?get=1')
  })
  it('serves as an attachment with a valid token, but not to another IP', async () => {
    const t = await signDownloadToken(SECRET, IP)
    const res = await handleDietFile(getReq(`/downloads/diet/p-v1.2.5.zip?t=${t}`), makeEnv())
    expect(res.status).toBe(200)
    expect(res.headers.get('content-disposition')).toContain('p-v1.2.5.zip')
    expect(res.headers.get('cache-control')).toContain('no-store')
    const other = await handleDietFile(getReq(`/downloads/diet/p-v1.2.5.zip?t=${t}`, '198.51.100.9'), makeEnv())
    expect(other.status).toBe(302)
  })
  it('fails closed when the secret is not configured', async () => {
    const t = await signDownloadToken(SECRET, IP)
    const res = await handleDietFile(getReq(`/downloads/diet/x.zip?t=${t}`), { ...makeEnv(), DIET_TOKEN_SECRET: undefined })
    expect(res.status).toBe(302)
  })
})

describe('routing in the site Worker', () => {
  it('gates the stable link, the lead api and raw zips before static assets', async () => {
    const env = makeEnv()
    const latest = await worker.fetch(getReq('/diet/latest.zip'), env, {})
    expect(latest.headers.get('location')).toContain('/diet?get=1')
    const raw = await worker.fetch(getReq('/downloads/diet/south-indian-satvahara-v1.3.0.zip'), env, {})
    expect(raw.headers.get('location')).toContain('/diet?get=1')
    const lead = await worker.fetch(post(valid), env, {})
    expect(lead.status).toBe(200)
  })
})
