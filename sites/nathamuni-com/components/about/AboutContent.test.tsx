import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutContent } from './AboutContent'

describe('AboutContent', () => {
  it('renders the bio and social buttons', () => {
    render(<AboutContent />)
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
    expect(screen.getByTestId('social-buttons')).toBeInTheDocument()
  })
})
