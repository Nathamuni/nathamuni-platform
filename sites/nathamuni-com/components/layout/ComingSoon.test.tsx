import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComingSoon } from './ComingSoon'

describe('ComingSoon', () => {
  it('renders the given title and description, and a link home', () => {
    render(<ComingSoon title="Blog" description="Coming soon." />)
    expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back home/i })).toHaveAttribute('href', '/')
  })
})
