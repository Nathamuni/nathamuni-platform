import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutContent } from './AboutContent'

describe('AboutContent', () => {
  it('renders the page heading, key sections, and social buttons', () => {
    render(<AboutContent />)
    expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'The arc' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tested on myself first' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'What I build' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'The quiet part' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'The book' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Principles' })).toBeInTheDocument()
    expect(screen.getByTestId('social-buttons')).toBeInTheDocument()
  })

  it('shows the portrait image and links out to projects and books', () => {
    render(<AboutContent />)
    expect(screen.getByTestId('about-portrait-img')).toHaveAttribute(
      'src',
      '/images/generated/about-portrait.jpg'
    )
    expect(screen.getByTestId('about-projects-link')).toHaveAttribute('href', '/projects')
    expect(screen.getByTestId('about-books-link')).toHaveAttribute('href', '/books')
  })
})
