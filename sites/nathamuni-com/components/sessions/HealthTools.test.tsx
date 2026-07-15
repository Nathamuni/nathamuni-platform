import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HealthTools } from './HealthTools'

describe('HealthTools', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows BMI and protein once weight and height are typed', async () => {
    const user = userEvent.setup()
    render(<HealthTools />)
    await user.type(screen.getByLabelText('Weight (kg)'), '70')
    await user.type(screen.getByLabelText('Height (cm)'), '175')
    expect(screen.getByTestId('bmi-result')).toHaveTextContent('22.9')
    expect(screen.getByTestId('bmi-result')).toHaveTextContent('Healthy range')
    expect(screen.getByTestId('protein-result')).toHaveTextContent('112–154g')
  })

  it('drops to the non-training protein range when unchecked', async () => {
    const user = userEvent.setup()
    render(<HealthTools />)
    await user.type(screen.getByLabelText('Weight (kg)'), '70')
    await user.click(screen.getByLabelText('I train regularly'))
    expect(screen.getByTestId('protein-result')).toHaveTextContent('56–84g')
  })

  it('shows no results for implausible input', async () => {
    const user = userEvent.setup()
    render(<HealthTools />)
    await user.type(screen.getByLabelText('Weight (kg)'), '5')
    await user.type(screen.getByLabelText('Height (cm)'), '175')
    expect(screen.queryByTestId('bmi-result')).toBeNull()
    expect(screen.queryByTestId('protein-result')).toBeNull()
  })

  it('persists the profile and restores it on remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<HealthTools />)
    await user.type(screen.getByLabelText('Weight (kg)'), '82')
    unmount()
    render(<HealthTools />)
    expect(await screen.findByDisplayValue('82')).toBeInTheDocument()
  })
})
