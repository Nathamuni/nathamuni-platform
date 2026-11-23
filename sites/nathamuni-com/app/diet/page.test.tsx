import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import DietPage from './page'
import { getDietReleases } from '@/lib/diet'

describe('/diet', () => {
  const releases = getDietReleases()

  it('offers the newest version and the permanent latest link', () => {
    render(<DietPage />)
    const latest = releases[0]
    expect(screen.getByTestId('diet-download').getAttribute('href')).toBe(latest.file)
    expect(screen.getByTestId('diet-download').textContent).toContain(`v${latest.version}`)
    expect(screen.getByTestId('diet-stable-url').textContent).toBe('nathamuni.com/diet/latest.zip')
  })

  it('has install steps for ChatGPT, Claude and other AI apps', () => {
    render(<DietPage />)
    for (const id of ['chatgpt', 'claude', 'other']) {
      expect(screen.getByTestId(`diet-guide-${id}`).querySelectorAll('ol > li').length).toBeGreaterThan(2)
    }
    expect(
      within(screen.getByTestId('diet-guide-chatgpt')).getAllByText(/Add plugin/).length
    ).toBeGreaterThan(0)
  })

  it('lists every version with its own download link, newest marked Latest', () => {
    render(<DietPage />)
    const items = screen.getByTestId('diet-versions').querySelectorAll(':scope > li')
    expect(items).toHaveLength(releases.length)
    releases.forEach((r, i) => {
      expect(items[i].textContent).toContain(`v${r.version}`)
      expect(items[i].querySelector(`a[href="${r.file}"]`)).not.toBeNull()
    })
    expect(items[0].textContent).toContain('Latest')
  })
})

describe('/diet before the first release', () => {
  it('shows a placeholder instead of a broken download', async () => {
    vi.resetModules()
    vi.doMock('@/lib/diet.json', () => ({ default: { releases: [] } }))
    const { default: EmptyDiet } = await import('./page')
    render(<EmptyDiet />)
    expect(screen.queryByTestId('diet-download')).toBeNull()
    expect(screen.getByText(/first version is on its way/)).toBeTruthy()
    vi.doUnmock('@/lib/diet.json')
  })
})
