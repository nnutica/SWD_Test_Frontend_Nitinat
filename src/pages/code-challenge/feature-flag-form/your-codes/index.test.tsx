// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import YourCode from './index'

// Monaco loads from a CDN, which jsdom can't do; show the value as plain text instead
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value }: { value: string }) => (
    <pre data-testid="preview">{value}</pre>
  ),
}))

const preview = () =>
  JSON.parse(screen.getByTestId('preview').textContent) as {
    flags: Record<string, { variations: Record<string, unknown> }>
  }

afterEach(cleanup)

describe('Feature flag editor', () => {
  it('updates the JSON preview while typing', () => {
    render(<YourCode />)
    fireEvent.change(screen.getByLabelText('Flag name'), {
      target: { value: 'new-checkout' },
    })
    expect(Object.keys(preview().flags)).toEqual(['new-checkout'])
  })

  it('shows the Zod error under the field that caused it', () => {
    render(<YourCode />)
    const nameInput = screen.getByLabelText('Flag name')
    fireEvent.change(nameInput, { target: { value: '' } })

    expect(nameInput).toHaveProperty('ariaInvalid', 'true')
    expect(document.getElementById('name-error')?.textContent).toBe(
      'Flag name is required',
    )
    expect(screen.getByText('1 error')).toBeTruthy()
  })

  it('adds and removes variations', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add variation/i }))
    fireEvent.change(screen.getByLabelText('Variation 3 name'), {
      target: { value: 'Variation_3' },
    })
    expect(Object.keys(preview().flags['my-first-flag'].variations)).toEqual([
      'Variation_1',
      'Variation_2',
      'Variation_3',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Remove variation 1' }))
    expect(Object.keys(preview().flags['my-first-flag'].variations)).toEqual([
      'Variation_2',
      'Variation_3',
    ])
  })

  it('flags a duplicate variation name on the second input', () => {
    render(<YourCode />)
    fireEvent.change(screen.getByLabelText('Variation 2 name'), {
      target: { value: 'Variation_1' },
    })
    expect(
      document.getElementById('variations[1].name-error')?.textContent,
    ).toBe('Variation name must be unique')
  })
})
