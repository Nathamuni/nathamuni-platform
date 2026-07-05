import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlaceholdersRow } from './PlaceholdersRow'

describe('PlaceholdersRow', () => {
  it('links to blog, books, and projects', () => {
    render(<PlaceholdersRow />)
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/blog')).toBe(true)
    expect(links.some((link) => link.getAttribute('href') === '/books')).toBe(true)
    expect(links.some((link) => link.getAttribute('href') === '/projects')).toBe(true)
  })
})
