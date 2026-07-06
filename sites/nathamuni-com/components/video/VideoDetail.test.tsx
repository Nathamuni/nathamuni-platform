import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoDetail } from './VideoDetail'
import { getAllVideos, getVideoBySlug } from '@/lib/videos'

describe('VideoDetail', () => {
  it('renders the title, description, category, and tags', () => {
    const video = getVideoBySlug('generations-and-wisdom')!
    render(<VideoDetail video={video} />)
    expect(screen.getByRole('heading', { name: video.title })).toBeInTheDocument()
    expect(screen.getByText(video.detailedDescription)).toBeInTheDocument()
    expect(screen.getAllByText(video.category).length).toBeGreaterThan(0)
    video.tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument()
    })
  })

  it('links to Instagram', () => {
    const video = getVideoBySlug('generations-and-wisdom')!
    render(<VideoDetail video={video} />)
    expect(screen.getByTestId('watch-on-instagram')).toHaveAttribute('href', video.instagramUrl)
  })

  it('renders key lessons when present', () => {
    const video = getVideoBySlug('generations-and-wisdom')!
    render(<VideoDetail video={video} />)
    expect(screen.getByTestId('video-detail-lessons')).toBeInTheDocument()
  })

  it('omits the key lessons block when absent', () => {
    const video = getAllVideos().find((v) => !v.keyLessons)!
    render(<VideoDetail video={video} />)
    expect(screen.queryByTestId('video-detail-lessons')).not.toBeInTheDocument()
  })
})
