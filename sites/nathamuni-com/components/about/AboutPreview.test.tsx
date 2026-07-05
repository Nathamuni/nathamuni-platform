import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutPreview } from './AboutPreview'

describe('AboutPreview', () => {
  it('links to the full about page', () => {
    render(<AboutPreview />)
    expect(screen.getByTestId('about-preview-link')).toHaveAttribute('href', '/about')
  })
})
