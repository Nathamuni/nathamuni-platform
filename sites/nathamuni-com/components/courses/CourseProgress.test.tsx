import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { CourseProgressLine, CourseProgressRing } from './CourseProgress'

describe('CourseProgress', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders nothing before the course is started', () => {
    render(<CourseProgressRing slug="systems" moduleActionCounts={[3, 2]} />)
    render(<CourseProgressLine slug="systems" moduleActionCounts={[3, 2]} />)
    expect(screen.queryByTestId('course-progress-ring')).toBeNull()
    expect(screen.queryByTestId('course-progress-line')).toBeNull()
  })

  it('ring shows the right percentage from localStorage ticks', () => {
    window.localStorage.setItem('course-systems-0', JSON.stringify([true, true, false]))
    window.localStorage.setItem('course-systems-1', JSON.stringify([false, true]))
    render(<CourseProgressRing slug="systems" moduleActionCounts={[3, 2]} />)
    expect(screen.getByTestId('course-progress-ring')).toHaveTextContent('60%')
    expect(screen.getByTestId('course-progress-ring')).toHaveTextContent('3/5 actions done')
  })

  it('line says continue mid-way and Done at 100%', () => {
    window.localStorage.setItem('course-systems-0', JSON.stringify([true]))
    const { unmount } = render(
      <CourseProgressLine slug="systems" moduleActionCounts={[1, 1]} />
    )
    expect(screen.getByTestId('course-progress-line')).toHaveTextContent('50% — continue')
    unmount()

    window.localStorage.setItem('course-systems-1', JSON.stringify([true]))
    render(<CourseProgressLine slug="systems" moduleActionCounts={[1, 1]} />)
    expect(screen.getByTestId('course-progress-line')).toHaveTextContent('Done ✓')
  })

  it('recounts live when an action is ticked elsewhere', () => {
    window.localStorage.setItem('course-systems-0', JSON.stringify([true, false]))
    render(<CourseProgressRing slug="systems" moduleActionCounts={[2]} />)
    expect(screen.getByTestId('course-progress-ring')).toHaveTextContent('50%')

    window.localStorage.setItem('course-systems-0', JSON.stringify([true, true]))
    act(() => {
      window.dispatchEvent(new Event('nm-course-ticked'))
    })
    expect(screen.getByTestId('course-progress-ring')).toHaveTextContent('100%')
  })

  it('ignores malformed stored values', () => {
    window.localStorage.setItem('course-systems-0', '{broken')
    render(<CourseProgressRing slug="systems" moduleActionCounts={[3]} />)
    expect(screen.queryByTestId('course-progress-ring')).toBeNull()
  })
})
