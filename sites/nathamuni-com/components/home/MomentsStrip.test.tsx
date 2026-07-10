import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MomentsStrip } from './MomentsStrip'

describe('MomentsStrip', () => {
  it('renders story cards linking to /moments', () => {
    render(<MomentsStrip />)
    const strip = screen.getByTestId('moments-strip')
    expect(strip).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(5)
    expect(links.every((l) => l.getAttribute('href') === '/moments')).toBe(true)
  })
})

describe('MomentsStrip with a poster-less story', () => {
  vi.resetModules()
  vi.doMock('@/lib/stories', () => ({
    getAllStories: () => [
      { id: 'np1', date: '2026-07-05', video: '/stories/np1.mp4', poster: null, title: null },
    ],
  }))

  it('renders a gradient placeholder instead of a broken image when poster is null', async () => {
    const { MomentsStrip: MomentsStripWithMock } = await import('./MomentsStrip')
    render(<MomentsStripWithMock />)
    const strip = screen.getByTestId('moments-strip')
    expect(strip.querySelector('img')).not.toBeInTheDocument()
    expect(strip.querySelector('.thumb-peek-region')).not.toBeInTheDocument()
    expect(strip.textContent).toContain('▶')
  })
})
