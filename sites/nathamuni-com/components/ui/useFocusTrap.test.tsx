import { describe, expect, it } from 'vitest'
import { useRef, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from './useFocusTrap'

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true)
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Test dialog">
      <button onClick={onClose}>first</button>
      <button>middle</button>
      <button>last</button>
    </div>
  )
}

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button data-testid="opener" onClick={() => setOpen(true)}>
        open
      </button>
      <button data-testid="outside">outside</button>
      {open && <Dialog onClose={() => setOpen(false)} />}
    </>
  )
}

describe('useFocusTrap', () => {
  it('moves focus into the dialog on open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByTestId('opener'))
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('wraps Tab from the last focusable back to the first', () => {
    render(<Harness />)
    fireEvent.click(screen.getByTestId('opener'))
    const last = screen.getByRole('button', { name: 'last' })
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first focusable back to the last', () => {
    render(<Harness />)
    fireEvent.click(screen.getByTestId('opener'))
    const first = screen.getByRole('button', { name: 'first' })
    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
  })

  it('restores focus to the trigger when the dialog unmounts', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const opener = screen.getByTestId('opener')
    await user.click(opener)
    // "first" closes the dialog, unmounting the trap.
    await user.click(screen.getByRole('button', { name: 'first' }))
    expect(opener).toHaveFocus()
  })
})
