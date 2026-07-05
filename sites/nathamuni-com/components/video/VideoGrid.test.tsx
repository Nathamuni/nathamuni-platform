import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoGrid } from './VideoGrid'
import { getAllVideos } from '@/lib/videos'

describe('VideoGrid', () => {
  it('renders a card for each video', () => {
    const videos = getAllVideos()
    render(<VideoGrid videos={videos} />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(videos.length)
  })

  it('shows an empty-state message when there are no videos', () => {
    render(<VideoGrid videos={[]} />)
    expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('video-card')).not.toBeInTheDocument()
  })
})
