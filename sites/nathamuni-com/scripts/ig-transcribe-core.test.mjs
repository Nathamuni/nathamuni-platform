import { describe, it, expect } from 'vitest'
import { selectPending, mergeResults, shortcodeOf } from './ig-transcribe-core.mjs'

const m = (sc, ts, type = 'VIDEO') => ({
  media_type: type,
  media_url: `https://cdn/${sc}.mp4`,
  permalink: `https://www.instagram.com/reel/${sc}/`,
  timestamp: ts,
})

describe('shortcodeOf', () => {
  it('handles trailing slashes and query strings', () => {
    expect(shortcodeOf('https://www.instagram.com/reel/AbC/')).toBe('AbC')
    expect(shortcodeOf('https://www.instagram.com/p/XyZ?igsh=1')).toBe('XyZ')
  })
})

describe('selectPending', () => {
  const media = [
    m('old', '2026-01-01T10:00:00+0000'),
    m('new', '2026-11-20T10:00:00+0000'),
    m('mid', '2026-06-01T10:00:00+0000'),
    m('photo', '2026-11-21T10:00:00+0000', 'IMAGE'),
    m('album', '2026-11-21T10:00:00+0000', 'CAROUSEL_ALBUM'),
  ]
  it('returns only videos, newest first', () => {
    expect(selectPending(media, {}, 10).map((x) => x.shortcode)).toEqual(['new', 'mid', 'old'])
  })
  it('skips reels already transcribed (including no-speech) and respects the limit', () => {
    const done = { new: { status: 'ok' }, mid: { status: 'no-speech' } }
    expect(selectPending(media, done, 10).map((x) => x.shortcode)).toEqual(['old'])
    expect(selectPending(media, {}, 1).map((x) => x.shortcode)).toEqual(['new'])
  })
  it('ignores items without a media_url', () => {
    expect(selectPending([{ ...m('x', '2026-11-01T00:00:00+0000'), media_url: undefined }], {}, 5)).toEqual([])
  })
})

describe('mergeResults', () => {
  const opts = { model: 'large-v3', now: '2026-11-22T00:00:00Z' }
  it('stores ok and no-speech, drops errors so they retry', () => {
    const { transcripts, added } = mergeResults(
      {},
      {
        a: { status: 'ok', lang: 'ta', text: 'vanakkam', hook: 'vanakkam' },
        b: { status: 'no-speech' },
        c: { status: 'error', error: 'boom' },
      },
      { a: { timestamp: '2026-11-20T10:00:00+0000' }, b: { timestamp: '2026-11-21T10:00:00+0000' } },
      opts,
    )
    expect(added).toBe(2)
    expect(Object.keys(transcripts)).toEqual(['b', 'a']) // newest first
    expect(transcripts.c).toBeUndefined()
    expect(transcripts.a).toMatchObject({ text: 'vanakkam', model: 'large-v3', publishedAt: '2026-11-20T10:00:00+0000' })
  })
  it('keeps existing transcripts untouched', () => {
    const existing = { z: { status: 'ok', text: 'old', publishedAt: '2026-01-01' } }
    const { transcripts, added } = mergeResults(existing, {}, {}, opts)
    expect(added).toBe(0)
    expect(transcripts.z.text).toBe('old')
  })
})
