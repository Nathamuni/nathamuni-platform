import { describe, it, expect } from 'vitest'
import { dmHandle, pickVideo, ruleCards, homeMsg } from './dmui.mjs'
import { advanceDm } from './commentdm.mjs'

const kv = () => {
  const m = new Map()
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), delete: async (k) => void m.delete(k), _m: m }
}
const vid = (code, title, date) => ({
  instagramUrl: `https://www.instagram.com/reel/${code}/`,
  title,
  publishedAt: `${date}T10:00:00+0000`,
  thumbnail: `/images/thumbnails/${code}.jpg`,
})
const VIDEOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((c, i) => vid(`CODE${c}`, `Reel ${c}`, `2026-11-${String(20 - i).padStart(2, '0')}`))
const load = async () => VIDEOS
const text = (out) => out.map((m) => m.text || '').join('\n')
const dataOf = (out) => out.flatMap((m) => (m.buttons || []).flat().map((x) => x.d))

describe('plain /dm with saved DMs', () => {
  it('lists them with Edit buttons, no /dm list needed', async () => {
    const env = { INBOX: kv() }
    await env.INBOX.put('ig:rules', JSON.stringify({ enabled: true, rules: [{ id: 'a', keywords: 'link', dm: 'hello', publicReplies: [], noReply: false }] }))
    const out = await dmHandle(env, { kind: 'text', text: '/dm' }, load)
    expect(text(out)).toContain('Your DMs')
    expect(dataOf(out)).toContain('dm:e:a')
  })
})

describe('/dm menu', () => {
  it('shows buttons for create, list, turn off, activity', async () => {
    const out = await dmHandle({ INBOX: kv() }, { kind: 'text', text: '/dm' }, load)
    expect(text(out)).toContain('What do you want to do?')
    expect(dataOf(out)).toEqual(expect.arrayContaining(['dm:new', 'dm:list', 'dm:g', 'dm:log']))
  })
  it('ignores ordinary messages and other commands when no setup runs', async () => {
    expect(await dmHandle({ INBOX: kv() }, { kind: 'text', text: 'hello' }, load)).toBeNull()
    expect(await dmHandle({ INBOX: kv() }, { kind: 'text', text: '/today' }, load)).toBeNull()
    expect(await dmHandle({ INBOX: kv() }, { kind: 'text', text: '/dm off 1' }, load)).toBeNull()
  })
})

describe('video picker', () => {
  it('offers the 5 newest videos with thumbnails, numbered buttons and paging', () => {
    const out = pickVideo(VIDEOS, 0)
    expect(out[0].album).toHaveLength(5)
    expect(out[0].album[0]).toMatchObject({ url: 'https://nathamuni.com/images/thumbnails/CODEA.jpg' })
    const d = dataOf(out)
    expect(d.slice(0, 5)).toEqual(['dm:v:CODEA', 'dm:v:CODEB', 'dm:v:CODEC', 'dm:v:CODED', 'dm:v:CODEE'])
    expect(d).toEqual(expect.arrayContaining(['dm:pg:1', 'dm:all', 'dm:older', 'dm:cancel']))
  })
  it('page 2 shows the rest and a Newer button', () => {
    const out = pickVideo(VIDEOS, 1)
    expect(dataOf(out)).toEqual(expect.arrayContaining(['dm:v:CODEF', 'dm:v:CODEG', 'dm:pg:0']))
  })
  it('still works with no videos loaded', () => {
    expect(text(pickVideo([], 0))).toContain('Paste a reel link')
  })
})

describe('creating a DM with buttons', () => {
  it('video tap → keyword → DM → auto reply → save', async () => {
    const env = { INBOX: kv() }
    const start = await dmHandle(env, { kind: 'button', data: 'dm:new' }, load)
    expect(text(start)).toContain('Step 1/4')
    expect(text(await dmHandle(env, { kind: 'button', data: 'dm:v:CODEB' }, load))).toContain('Step 2/4')
    expect(text(await dmHandle(env, { kind: 'text', text: 'link, guide' }, load))).toContain('Step 3/4')
    expect(text(await dmHandle(env, { kind: 'text', text: 'Here you go https://drive.google.com/x' }, load))).toContain('Step 4/4')
    const confirm = await dmHandle(env, { kind: 'button', data: 'dm:rep:auto' }, load)
    expect(text(confirm)).toContain('Reel B')
    expect(dataOf(confirm)).toContain('dm:ok')
    expect(text(await dmHandle(env, { kind: 'button', data: 'dm:ok' }, load))).toContain('Saved')
    const rule = JSON.parse(env.INBOX._m.get('ig:rules')).rules[0]
    expect(rule).toMatchObject({ keywords: 'link, guide', reel: 'CODEB', noReply: false })
    expect(env.INBOX._m.has('tg:dm:flow')).toBe(false)
  })
  it('accepts a pasted link inside a sentence for an old video, and All videos', async () => {
    const env = { INBOX: kv() }
    await dmHandle(env, { kind: 'text', text: '/dm new' }, load)
    await dmHandle(env, { kind: 'text', text: 'use this one https://www.instagram.com/reel/OLD999/?igsh=x thanks' }, load)
    expect(JSON.parse(env.INBOX._m.get('tg:dm:flow')).draft.reelUrl).toBe('https://www.instagram.com/reel/OLD999/?igsh=x')
    const env2 = { INBOX: kv() }
    await dmHandle(env2, { kind: 'text', text: '/dm new' }, load)
    await dmHandle(env2, { kind: 'button', data: 'dm:all' }, load)
    expect(JSON.parse(env2.INBOX._m.get('tg:dm:flow')).draft.reelUrl).toBe('')
  })
  it('explains share links and bad input and keeps the same step', async () => {
    const env = { INBOX: kv() }
    await dmHandle(env, { kind: 'text', text: '/dm new' }, load)
    expect(text(await dmHandle(env, { kind: 'text', text: 'https://www.instagram.com/share/reel/BAbc/' }, load))).toContain('Copy link')
    expect(text(await dmHandle(env, { kind: 'text', text: 'banana' }, load))).toContain('could not find a reel link')
    expect(JSON.parse(env.INBOX._m.get('tg:dm:flow')).step).toBe('reel')
  })
  it('type-my-own wording, no-reply and cancel paths', async () => {
    const run = async (steps) => {
      const env = { INBOX: kv() }
      for (const s of steps) await dmHandle(env, s.startsWith('dm:') ? { kind: 'button', data: s } : { kind: 'text', text: s }, load)
      return env
    }
    const own = await run(['/dm new', 'dm:all', 'link', 'hi', 'dm:rep:custom', 'Sent it!', 'dm:ok'])
    expect(JSON.parse(own.INBOX._m.get('ig:rules')).rules[0]).toMatchObject({ publicReplies: ['Sent it!'], noReply: false })
    const none = await run(['/dm new', 'dm:all', 'link', 'hi', 'dm:rep:none', 'dm:ok'])
    expect(JSON.parse(none.INBOX._m.get('ig:rules')).rules[0].noReply).toBe(true)
    const cancelled = await run(['/dm new', 'dm:all', '/cancel'])
    expect(cancelled.INBOX._m.has('ig:rules')).toBe(false)
    expect(cancelled.INBOX._m.has('tg:dm:flow')).toBe(false)
  })
  it('a stale button after the setup expired asks to start again', async () => {
    const out = await dmHandle({ INBOX: kv() }, { kind: 'button', data: 'dm:v:CODEA' }, load)
    expect(text(out)).toContain('expired')
  })
  it('other commands pass through mid-setup and the setup waits', async () => {
    const env = { INBOX: kv() }
    await dmHandle(env, { kind: 'text', text: '/dm new' }, load)
    expect(await dmHandle(env, { kind: 'text', text: '/today' }, load)).toBeNull()
    expect(JSON.parse(env.INBOX._m.get('tg:dm:flow')).step).toBe('reel')
  })
})

describe('managing DMs', () => {
  const seed = async () => {
    const env = { INBOX: kv() }
    for (const s of ['/dm new', 'dm:v:CODEA', 'link', 'hi', 'dm:rep:auto', 'dm:ok']) {
      await dmHandle(env, s.startsWith('dm:') ? { kind: 'button', data: s } : { kind: 'text', text: s }, load)
    }
    return env
  }
  it('lists each DM as a card with its thumbnail, pause and delete buttons', async () => {
    const env = await seed()
    const out = await dmHandle(env, { kind: 'button', data: 'dm:list' }, load)
    const card = out.find((m) => m.photo)
    expect(card.photo).toContain('CODEA.jpg')
    expect(card.text).toContain('Reel A')
    expect(dataOf([card]).some((d) => d.startsWith('dm:t:'))).toBe(true)
    expect(dataOf([card]).some((d) => d.startsWith('dm:x:'))).toBe(true)
  })
  it('pauses and resumes a DM', async () => {
    const env = await seed()
    const id = JSON.parse(env.INBOX._m.get('ig:rules')).rules[0].id
    expect(text(await dmHandle(env, { kind: 'button', data: `dm:t:${id}` }, load))).toContain('Paused')
    expect(JSON.parse(env.INBOX._m.get('ig:rules')).rules[0].enabled).toBe(false)
    expect(text(await dmHandle(env, { kind: 'button', data: `dm:t:${id}` }, load))).toContain('Resumed')
  })
  it('asks before deleting, then deletes', async () => {
    const env = await seed()
    const id = JSON.parse(env.INBOX._m.get('ig:rules')).rules[0].id
    const ask = await dmHandle(env, { kind: 'button', data: `dm:x:${id}` }, load)
    expect(text(ask)).toContain('cannot be undone')
    expect(JSON.parse(env.INBOX._m.get('ig:rules')).rules).toHaveLength(1)
    await dmHandle(env, { kind: 'button', data: `dm:xy:${id}` }, load)
    expect(JSON.parse(env.INBOX._m.get('ig:rules')).rules).toHaveLength(0)
  })
  it('turns everything off and on with one button', async () => {
    const env = await seed()
    expect(text(await dmHandle(env, { kind: 'button', data: 'dm:g' }, load))).toContain('OFF')
    expect(JSON.parse(env.INBOX._m.get('ig:rules')).enabled).toBe(false)
    expect(homeMsg({ enabled: false, rules: [] }).text).toContain('nothing is being sent')
    expect(text(await dmHandle(env, { kind: 'button', data: 'dm:g' }, load))).toContain('ON')
  })
  it('shows an empty state with a Create button', () => {
    expect(dataOf(ruleCards({ enabled: true, rules: [] }, VIDEOS))).toContain('dm:new')
  })
  it('keeps every button under Telegram’s 64-byte limit', async () => {
    const env = await seed()
    const out = await dmHandle(env, { kind: 'button', data: 'dm:list' }, load)
    for (const d of dataOf(out)) expect(new TextEncoder().encode(d).length).toBeLessThanOrEqual(64)
  })
})

describe('advanceDm', () => {
  it('answering no saves nothing', () => {
    const out = advanceDm({ step: 'confirm', draft: { keywords: 'a', dm: 'b' } }, 'no')
    expect(out.flow).toBeNull()
    expect(out.save).toBeUndefined()
    expect(out.cancel).toBe(true)
  })
  it('rejects an oversize Tamil DM and stays on the step', () => {
    const out = advanceDm({ step: 'dm', draft: {} }, 'த'.repeat(400))
    expect(out.error).toContain('limit is 1000')
    expect(out.flow.step).toBe('dm')
  })
})
