import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Nav } from './Nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/videos',
}))

describe('Nav', () => {
  it('links to every top-level route', () => {
    render(<Nav />)
    const expectedHrefs = ['/', '/videos', '/about', '/blog', '/books', '/projects']
    const links = screen.getAllByRole('link')
    expectedHrefs.forEach((href) => {
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    })
  })

  it('marks the current route as active', () => {
    render(<Nav />)
    const videosLink = screen.getByRole('link', { name: 'Videos' })
    expect(videosLink).toHaveAttribute('aria-current', 'page')
    const homeLink = screen.getByRole('link', { name: 'Home' })
    expect(homeLink).not.toHaveAttribute('aria-current')
  })
})
