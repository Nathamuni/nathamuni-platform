import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Nav } from './Nav'

describe('Nav', () => {
  it('links to every top-level route', () => {
    render(<Nav />)
    const expectedHrefs = ['/', '/videos', '/about', '/blog', '/books', '/projects']
    const links = screen.getAllByRole('link')
    expectedHrefs.forEach((href) => {
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    })
  })
})
