import { describe, it, expect } from 'vitest'
import { handleDietLatest } from './diet.mjs'
import worker from './index.mjs'

const req = new Request('https://nathamuni.com/diet/latest.zip')

describe('/diet/latest.zip', () => {
  it('redirects to the newest release, uncached', () => {
    const res = handleDietLatest(req, {
      releases: [{ file: '/downloads/diet/p-v1.2.5.zip' }, { file: '/downloads/diet/p-v1.2.4.zip' }],
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://nathamuni.com/downloads/diet/p-v1.2.5.zip')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('is a plain 404 before the first release', () => {
    expect(handleDietLatest(req, { releases: [] }).status).toBe(404)
  })

  it('is routed by the site Worker before the static assets', async () => {
    const env = { ASSETS: { fetch: () => new Response('asset') } }
    const res = await worker.fetch(req, env, {})
    expect([302, 404]).toContain(res.status)
  })
})
