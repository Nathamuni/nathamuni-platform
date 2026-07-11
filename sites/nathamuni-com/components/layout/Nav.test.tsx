import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Nav } from './Nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/videos',
}))

describe('Nav', () => {
  it('links to every top-level route', () => {
    render(<Nav />)
    const expectedHrefs = [
      '/',
      '/feed',
      '/videos',
      '/moments',
      '/about',
      '/blog',
      '/books',
      '/projects',
      '/stats',
      '/journey',
      '/ask',
    ]
    const links = screen.getAllByRole('link')
    expectedHrefs.forEach((href) => {
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    })
  })

  it('marks the current route as active in both the top nav and tab bar', () => {
    render(<Nav />)
    const videosLinks = screen.getAllByRole('link', { name: /Videos/ })
    expect(videosLinks.length).toBeGreaterThanOrEqual(2)
    expect(videosLinks.every((l) => l.getAttribute('aria-current') === 'page')).toBe(true)
    const homeLinks = screen.getAllByRole('link', { name: /Home/ })
    expect(homeLinks.every((l) => !l.hasAttribute('aria-current'))).toBe(true)
  })

  it('renders the mobile tab bar with the four primary sections', () => {
    render(<Nav />)
    const tabBar = screen.getByTestId('tab-bar')
    expect(tabBar).toBeInTheDocument()
    expect(tabBar.querySelectorAll('a')).toHaveLength(4)
  })
})
