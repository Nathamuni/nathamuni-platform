import { describe, it, expect } from 'vitest'
import { renderCaptions, captionPrompt } from './ig-ai-core.mjs'

describe('/caption', () => {
  it('renders 3 captions and 5 hashtags, escaping HTML', () => {
    const out = renderCaptions({ captions: ['a <b>', 'b', 'c', 'd'], hashtags: ['#Chennai', 'diet', 'tamil fit', 'x', 'y', 'z'] }, 'video')
    expect(out).toContain('a &lt;b&gt;')
    expect(out).not.toContain('<b>4.')
    expect(out.match(/#[a-zA-Z]+/g)).toHaveLength(5)
    expect(out).toContain('#tamilfit')
  })
  it('prompt carries the details and niche', () => {
    expect(captionPrompt('ctx', 'protein breakfast')).toContain('protein breakfast')
  })
})
