import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemedImage } from './ThemedImage'
import { ALT_THEME_IDS } from '@/lib/themes'

describe('ThemedImage', () => {
  it('renders the default plus one decorative, lazy twin per alternate theme', () => {
    const { container } = render(<ThemedImage base="/img/x" alt="Portrait" testId="x" />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(1 + ALT_THEME_IDS.length)
    expect(screen.getByTestId('x')).toHaveAttribute('src', '/img/x.jpg')
    for (const id of ALT_THEME_IDS) {
      const twin = container.querySelector(`.themed-img-${id}`)
      expect(twin).toHaveAttribute('src', `/img/x-${id}.jpg`)
      expect(twin).toHaveAttribute('loading', 'lazy')
      expect(twin).toHaveAttribute('aria-hidden', 'true')
      expect(twin).toHaveAttribute('alt', '')
    }
  })

  it('keeps the alt text only on the default image', () => {
    render(<ThemedImage base="/img/x" alt="Portrait" />)
    expect(screen.getAllByAltText('Portrait')).toHaveLength(1)
  })
})
