import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MomentsWall } from './MomentsWall'
import type { Story } from '@/lib/stories'

const stories: Story[] = [
  { id: 's1', date: '2026-07-01', video: '/stories/s1.mp4', poster: '/stories/s1.jpg', title: null },
  { id: 's2', date: '2026-07-02', video: '/stories/s2.mp4', poster: '/stories/s2.jpg', title: null },
  { id: 's3', date: '2026-07-03', video: '/stories/s3.mp4', poster: '/stories/s3.jpg', title: null },
]

function openLightbox(index = 0) {
  const cards = screen.getAllByRole('button', { name: /^Play story from/ })
  fireEvent.click(cards[index])
}

describe('MomentsWall', () => {
  it('renders story cards in the grid', () => {
    render(<MomentsWall stories={stories} />)
    expect(screen.getByTestId('moments-grid')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Play story from/ })).toHaveLength(3)
  })

  it('opens the lightbox on card click showing that story video', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    const lightbox = screen.getByTestId('moment-lightbox')
    expect(lightbox).toBeInTheDocument()
    expect(lightbox.querySelector('video')?.getAttribute('src')).toBe('/stories/s1.mp4')
  })

  it('closes the lightbox on backdrop click', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    fireEvent.click(screen.getByTestId('moment-lightbox'))
    expect(screen.queryByTestId('moment-lightbox')).not.toBeInTheDocument()
  })

  it('does not close the lightbox when clicking inside the inner content', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    const lightbox = screen.getByTestId('moment-lightbox')
    const video = lightbox.querySelector('video')!
    fireEvent.click(video)
    expect(screen.getByTestId('moment-lightbox')).toBeInTheDocument()
  })

  it('renders prev/next arrows when there are multiple stories', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    expect(screen.getByTestId('moment-nav-prev')).toBeInTheDocument()
    expect(screen.getByTestId('moment-nav-next')).toBeInTheDocument()
  })

  it('does not render arrows when there is only one story', () => {
    render(<MomentsWall stories={[stories[0]]} />)
    openLightbox(0)
    expect(screen.queryByTestId('moment-nav-prev')).not.toBeInTheDocument()
    expect(screen.queryByTestId('moment-nav-next')).not.toBeInTheDocument()
  })

  it('clicking next shows the next story, wrapping past the last', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    fireEvent.click(screen.getByTestId('moment-nav-next'))
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s2.mp4'
    )
    fireEvent.click(screen.getByTestId('moment-nav-next'))
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s3.mp4'
    )
    fireEvent.click(screen.getByTestId('moment-nav-next'))
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s1.mp4'
    )
  })

  it('clicking prev shows the previous story, wrapping before the first', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    fireEvent.click(screen.getByTestId('moment-nav-prev'))
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s3.mp4'
    )
  })

  it('navigates with ArrowRight and ArrowLeft keys while open', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s2.mp4'
    )
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s1.mp4'
    )
  })

  it('closes with the Escape key', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('moment-lightbox')).not.toBeInTheDocument()
  })

  it('does not respond to keyboard navigation when the lightbox is closed', () => {
    render(<MomentsWall stories={stories} />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.queryByTestId('moment-lightbox')).not.toBeInTheDocument()
  })

  it('renders a gradient placeholder instead of a broken image when poster is null', () => {
    const noPoster: Story[] = [
      { id: 'np1', date: '2026-07-05', video: '/stories/np1.mp4', poster: null, title: null },
    ]
    render(<MomentsWall stories={noPoster} />)
    const card = screen.getByRole('button', { name: /^Play story from/ })
    expect(card.querySelector('img')).not.toBeInTheDocument()
    expect(card.querySelector('.thumb-peek-region')).not.toBeInTheDocument()
    expect(card.textContent).toContain('▶')
  })

  it('opens the lightbox for a poster-less story without a poster attribute on the video', () => {
    const noPoster: Story[] = [
      { id: 'np1', date: '2026-07-05', video: '/stories/np1.mp4', poster: null, title: null },
    ]
    render(<MomentsWall stories={noPoster} />)
    openLightbox(0)
    const video = screen.getByTestId('moment-lightbox').querySelector('video')!
    expect(video.getAttribute('poster')).toBeNull()
  })

  it('advances to the next story when the video ends', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(0)
    const video = screen.getByTestId('moment-lightbox').querySelector('video')!
    fireEvent.ended(video)
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/s2.mp4'
    )
  })

  it('closes the lightbox when the video ends on the last story', () => {
    render(<MomentsWall stories={stories} />)
    openLightbox(2)
    const video = screen.getByTestId('moment-lightbox').querySelector('video')!
    fireEvent.ended(video)
    expect(screen.queryByTestId('moment-lightbox')).not.toBeInTheDocument()
  })

  it('always appends the vibrant end-cap card, even with few stories', () => {
    render(<MomentsWall stories={stories} />)
    expect(screen.getByTestId('thought-card-endcap')).toBeInTheDocument()
    expect(screen.getByTestId('thought-card-endcap').textContent).toContain('logged for the future')
  })

  it('does not change the story card count when the end-cap is present', () => {
    render(<MomentsWall stories={stories} />)
    expect(screen.getAllByRole('button', { name: /^Play story from/ })).toHaveLength(stories.length)
  })

  it('intersperses a thought card after every 6th story and keeps lightbox order intact', () => {
    const many: Story[] = Array.from({ length: 13 }, (_, i) => ({
      id: `m${i}`,
      date: `2026-07-${String((i % 27) + 1).padStart(2, '0')}`,
      video: `/stories/m${i}.mp4`,
      poster: `/stories/m${i}.jpg`,
      title: null,
    }))
    render(<MomentsWall stories={many} />)

    // 13 stories -> interspersed after the 6th and 12th, plus the end-cap.
    expect(screen.getAllByRole('button', { name: /^Play story from/ })).toHaveLength(13)
    expect(screen.getAllByTestId('thought-card')).toHaveLength(2)
    expect(screen.getByTestId('thought-card-endcap')).toBeInTheDocument()

    // Lightbox index math is unaffected by grid position: opening the 7th
    // rendered story button (index 6 in the source array) must show m6, and
    // "next" must show m7, not a thought card's position.
    openLightbox(6)
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/m6.mp4'
    )
    fireEvent.click(screen.getByTestId('moment-nav-next'))
    expect(screen.getByTestId('moment-lightbox').querySelector('video')?.getAttribute('src')).toBe(
      '/stories/m7.mp4'
    )
  })
})
