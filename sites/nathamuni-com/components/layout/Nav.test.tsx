import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Nav } from './Nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/videos',
}))

describe('Nav', () => {
  it('links to every primary route in the visible bar', () => {
    render(<Nav />)
    const expectedHrefs = ['/', '/feed', '/videos', '/moments', '/courses', '/sessions', '/blog', '/ask']
    const links = screen.getAllByRole('link')
    expectedHrefs.forEach((href) => {
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    })
  })

  it('groups the identity pages behind the About dropdown', () => {
    render(<Nav />)
    const aboutHrefs = ['/about', '/journey', '/projects', '/stats', '/books']
    expect(screen.queryByTestId('nav-about-dropdown')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('nav-about-menu'))
    const dropdown = screen.getByTestId('nav-about-dropdown')
    const links = Array.from(dropdown.querySelectorAll('a'))
    aboutHrefs.forEach((href) => {
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

  it('renders the mobile tab bar with the five primary sections', () => {
    render(<Nav />)
    const tabBar = screen.getByTestId('tab-bar')
    expect(tabBar).toBeInTheDocument()
    const links = tabBar.querySelectorAll('a')
    expect(links).toHaveLength(5)
    expect([...links].map((a) => a.getAttribute('href'))).toContain('/pulse')
  })
})
