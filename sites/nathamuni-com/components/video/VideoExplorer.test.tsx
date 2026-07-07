import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoExplorer } from './VideoExplorer'
import { getAllVideos } from '@/lib/videos'

describe('VideoExplorer', () => {
  const videos = getAllVideos()

  it('shows only featured videos by default when featuredIds is passed', () => {
    const featuredIds = videos.filter((v) => v.featured).map((v) => v.id)
    render(<VideoExplorer videos={videos} featuredIds={featuredIds} />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(featuredIds.length)
  })

  it('shows all videos by default when featuredIds is not passed', () => {
    render(<VideoExplorer videos={videos} />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(videos.length)
  })

  it('searches across the full set, including non-featured videos', async () => {
    const user = userEvent.setup()
    const featuredIds = videos.filter((v) => v.featured).map((v) => v.id)
    const nonFeatured = videos.find(
      (v) => !v.featured && v.title.split(' ')[0].length > 5
    )!
    render(<VideoExplorer videos={videos} featuredIds={featuredIds} />)

    await user.type(screen.getByTestId('search-bar'), nonFeatured.title.split(' ')[0])

    expect(screen.getAllByText(nonFeatured.title).length).toBeGreaterThan(0)
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    render(<VideoExplorer videos={videos} />)
    await user.click(screen.getByRole('button', { name: /Humor & Tamil/ }))
    const cards = screen.getAllByTestId('video-card')
    const humorCount = videos.filter((v) => v.category === 'Humor & Tamil').length
    expect(cards).toHaveLength(humorCount)
  })

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(<VideoExplorer videos={videos} />)
    await user.type(screen.getByTestId('search-bar'), 'zzzznomatch')
    expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument()
  })
})
