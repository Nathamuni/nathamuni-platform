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
})
