// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import YourCode from './index'
import type { FlagConfigOutput } from './lib/to-output'

// Monaco loads from a CDN, which jsdom can't do; show the value as plain text instead
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value }: { value: string }) => (
    <pre data-testid="preview">{value}</pre>
  ),
}))

const preview = () =>
  JSON.parse(screen.getByTestId('preview').textContent) as FlagConfigOutput

const typeInto = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } })

// Radix Select calls these browser APIs, which jsdom doesn't implement
Element.prototype.hasPointerCapture = () => false
Element.prototype.releasePointerCapture = () => {}
Element.prototype.scrollIntoView = () => {}

/** Open a Radix Select and click one of its options. */
const choose = (trigger: HTMLElement, option: string) => {
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' })
  fireEvent.click(screen.getByRole('option', { name: option }))
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

describe('Targeting rules', () => {
  const firstQuery = () => preview().flags['my-first-flag'].targeting?.[0].query

  it('builds the query from nested groups and updates it live', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    typeInto(screen.getByLabelText('Field'), 'group')
    typeInto(screen.getByLabelText('Value'), 'beta')
    expect(firstQuery()).toBe('group eq "beta"')

    fireEvent.click(screen.getByRole('button', { name: 'Group' }))
    typeInto(screen.getAllByLabelText('Field')[1], 'country')
    typeInto(screen.getAllByLabelText('Value')[1], 'TH')
    expect(firstQuery()).toBe('group eq "beta" and (country eq "TH")')

    fireEvent.click(screen.getByRole('button', { name: 'Remove group' }))
    expect(firstQuery()).toBe('group eq "beta"')
  })

  it('nests groups inside nested groups', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Group' }))
    // The second "Group" button belongs to the nested group
    fireEvent.click(screen.getAllByRole('button', { name: 'Group' })[1])

    expect(screen.getAllByRole('group', { name: 'Nested group' })).toHaveLength(
      2,
    )
    expect(screen.getAllByLabelText('Field')).toHaveLength(3)
  })

  it('shows an error on a group with nothing in it', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove condition' }))

    expect(
      document.getElementById('rules[0].query.children-error')?.textContent,
    ).toBe('Add at least one condition or group')
  })
})

describe('Select-driven fields', () => {
  it('disables the value input for the "Present" operator', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    typeInto(screen.getByLabelText('Field'), 'email')
    expect(screen.getByLabelText('Value')).toHaveProperty('disabled', false)

    choose(screen.getByLabelText('Operator'), 'Present')
    expect(screen.getByLabelText('Value')).toHaveProperty('disabled', true)
    expect(preview().flags['my-first-flag'].targeting?.[0].query).toBe(
      'email pr',
    )
  })
})

describe('Serve', () => {
  const defaultRule = () => preview().flags['my-first-flag'].defaultRule

  it('serves the chosen variation', () => {
    render(<YourCode />)
    choose(screen.getByLabelText('Serve'), 'Variation_2')
    expect(defaultRule()).toEqual({ variation: 'Variation_2' })
  })

  it('starts a percentage rollout from an even split', () => {
    render(<YourCode />)
    choose(screen.getByLabelText('Serve'), 'a percentage rollout')
    expect(defaultRule()).toEqual({
      percentage: { Variation_1: 50, Variation_2: 50 },
    })
  })

  it('requires the percentages to add up to 100', () => {
    render(<YourCode />)
    choose(screen.getByLabelText('Serve'), 'a percentage rollout')

    typeInto(screen.getByLabelText('Variation_1'), '70')
    expect(
      document.getElementById('defaultRule.percentage-error')?.textContent,
    ).toBe('Percentages must add up to 100 (now 120)')

    typeInto(screen.getByLabelText('Variation_2'), '30')
    expect(document.getElementById('defaultRule.percentage-error')).toBeNull()
    expect(defaultRule()).toEqual({
      percentage: { Variation_1: 70, Variation_2: 30 },
    })
  })

  it('asks for a new variation when the served one is removed', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove variation 1' }))
    expect(
      document.getElementById('defaultRule.variationId-error')?.textContent,
    ).toBe('Select a variation')
  })
})
