import { describe, expect, it } from 'vitest'
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
