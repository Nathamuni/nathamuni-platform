import { describe, it, expect } from 'vitest'
import { editRule } from './commentdm.mjs'

const s = {
  enabled: true,
  rules: [
    { id: 'a', keywords: 'link', dm: 'old dm', publicReplies: ['old reply'], noReply: false, reelUrl: '', reel: '', mediaId: '', enabled: true },
    { id: 'b', keywords: 'diet', dm: 'other', publicReplies: [], noReply: false, reelUrl: '', reel: '', mediaId: '', enabled: true },
  ],
}

describe('editRule', () => {
  it('changes only the DM text of one rule', () => {
    const { settings } = editRule(s, 'a', 'dm', 'new dm')
    expect(settings.rules[0]).toEqual({ ...s.rules[0], dm: 'new dm' })
    expect(settings.rules[1]).toEqual(s.rules[1])
  })
  it('changes the public reply, auto and none', () => {
    expect(editRule(s, 'a', 'reply', 'hi').settings.rules[0].publicReplies).toEqual(['hi'])
    expect(editRule(s, 'a', 'reply', 'none').settings.rules[0].noReply).toBe(true)
    expect(editRule(s, 'a', 'reply', 'auto').settings.rules[0]).toMatchObject({ noReply: false, publicReplies: [] })
  })
  it('rejects empty, oversize and unknown', () => {
    expect(editRule(s, 'a', 'dm', ' ').error).toBeTruthy()
    expect(editRule(s, 'a', 'dm', 'x'.repeat(1001)).error).toContain('limit')
    expect(editRule(s, 'zz', 'dm', 'x').error).toContain('no longer')
    expect(editRule(s, 'a', 'keywords', ' , ').error).toBeTruthy()
  })
})
