import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders eyebrow, title, and lede', () => {
    render(<PageHeader eyebrow="The library" title="Everything, searchable." lede="A lede." />)
    expect(screen.getByText('The library')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Everything, searchable.' })).toBeTruthy()
    expect(screen.getByText('A lede.')).toBeTruthy()
  })

  it('omits the stats row when no stats are given', () => {
    const { container } = render(<PageHeader eyebrow="E" title="T" />)
    expect(container.querySelector('.pg-head-stats')).toBeNull()
  })

  it('formats numeric stat values with thousands separators', () => {
    render(<PageHeader eyebrow="E" title="T" stats={[{ value: 4823, label: 'Followers' }]} />)
    expect(screen.getByText('4,823')).toBeTruthy()
    expect(screen.getByText('Followers')).toBeTruthy()
  })

  it('renders a stat as a link only when href is provided', () => {
    render(
      <PageHeader
        eyebrow="E"
        title="T"
        stats={[
          { value: 165, label: 'Videos', href: '/videos' },
          { value: 5, label: 'Pillars' },
        ]}
      />
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('/videos')
    expect(links[0].textContent).toContain('Videos')
    // The stat without an href stays a plain div.
    expect(screen.getByText('Pillars').closest('a')).toBeNull()
  })

  it('applies the accent hue as a CSS custom property', () => {
    const { container } = render(<PageHeader eyebrow="E" title="T" accentHue={340} />)
    const head = container.querySelector('.pg-head') as HTMLElement
    expect(head.style.getPropertyValue('--pg-hue')).toBe('340')
  })
})
