import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoCard } from './VideoCard'
import { getAllVideos } from '@/lib/videos'

describe('VideoCard', () => {
  const video = getAllVideos()[0]

  it('renders the title, category, and description', () => {
    render(<VideoCard video={video} />)
    expect(screen.getByText(video.title)).toBeInTheDocument()
    expect(screen.getAllByText(video.category).length).toBeGreaterThan(0)
    expect(screen.getByText(video.shortDescription)).toBeInTheDocument()
  })

  it('links to the video detail page', () => {
    render(<VideoCard video={video} />)
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === `/videos/${video.id}`)).toBe(true)
  })

  it('renders placeholder art when there is no thumbnail', () => {
    render(<VideoCard video={{ ...video, thumbnail: null }} />)
    expect(screen.getByTestId('placeholder-art')).toBeInTheDocument()
  })

  it('renders an image when a thumbnail is present', () => {
    render(<VideoCard video={{ ...video, thumbnail: '/images/thumbnails/example.jpg' }} />)
    expect(screen.queryByTestId('placeholder-art')).not.toBeInTheDocument()
    expect(screen.getByAltText(video.title)).toBeInTheDocument()
  })
})
