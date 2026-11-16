// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
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
    expect(document.getElementById('flags[0].name-error')?.textContent).toBe(
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
      document.getElementById('flags[0].variations[1].name-error')?.textContent,
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

  it('removes a group that has siblings after it', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Group' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Group' })[0])
    typeInto(screen.getAllByLabelText('Field')[0], 'a')
    typeInto(screen.getAllByLabelText('Value')[0], '1')
    typeInto(screen.getAllByLabelText('Field')[2], 'c')
    typeInto(screen.getAllByLabelText('Value')[2], '3')

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove group' })[0])
    expect(firstQuery()).toBe('a eq 1 and (c eq 3)')
  })

  it('shows an error on a group with nothing in it', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove condition' }))

    expect(
      document.getElementById('flags[0].rules[0].query.children-error')
        ?.textContent,
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
      document.getElementById('flags[0].defaultRule.percentage-error')
        ?.textContent,
    ).toBe('Percentages must add up to 100 (now 120)')

    typeInto(screen.getByLabelText('Variation_2'), '30')
    expect(
      document.getElementById('flags[0].defaultRule.percentage-error'),
    ).toBeNull()
    expect(defaultRule()).toEqual({
      percentage: { Variation_1: 70, Variation_2: 30 },
    })
  })

  it('asks for a new variation when the served one is removed', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove variation 1' }))
    expect(
      document.getElementById('flags[0].defaultRule.variationId-error')
        ?.textContent,
    ).toBe('Select a variation')
  })
})

describe('Multiple flags and metadata', () => {
  it('adds another flag next to the first one in the output', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add another flag/i }))
    expect(Object.keys(preview().flags)).toEqual([
      'my-first-flag',
      'new-flag-2',
    ])

    // Both flags now have a remove button; removing the first keeps the second
    fireEvent.click(screen.getAllByRole('button', { name: /remove flag/i })[0])
    expect(Object.keys(preview().flags)).toEqual(['new-flag-2'])
    expect(screen.queryByRole('button', { name: /remove flag/i })).toBeNull()
  })

  it('flags a second flag that reuses a name', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add another flag/i }))
    typeInto(screen.getAllByLabelText('Flag name')[1], 'my-first-flag')
    expect(document.getElementById('flags[1].name-error')?.textContent).toBe(
      'Flag name must be unique',
    )
  })

  it('writes key/value metadata next to the description', () => {
    render(<YourCode />)
    typeInto(screen.getByLabelText('Description'), 'New checkout')
    fireEvent.click(screen.getByRole('button', { name: /add metadata/i }))
    typeInto(screen.getByLabelText('Metadata 1 key'), 'Age')
    typeInto(screen.getByLabelText('Metadata 1 value'), '22')

    expect(preview().flags['my-first-flag'].metadata).toEqual({
      description: 'New checkout',
      Age: '22',
    })
  })
})

describe('Drag and drop', () => {
  const dataTransfer = {
    setData: () => {},
    setDragImage: () => {},
    effectAllowed: '',
    dropEffect: '',
  }

  /** Drag by a handle and drop on the item that holds another handle. */
  const dragOnto = (handle: HTMLElement, targetHandle: HTMLElement) => {
    const target = targetHandle.closest('[data-drag-item]') as HTMLElement
    fireEvent.dragStart(handle, { dataTransfer })
    fireEvent.dragOver(target, { dataTransfer })
    fireEvent.drop(target, { dataTransfer })
    fireEvent.dragEnd(handle, { dataTransfer })
  }

  const ruleNames = () =>
    preview().flags['my-first-flag'].targeting?.map((rule) => rule.name)

  const addTwoRules = () => {
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    typeInto(screen.getAllByLabelText('Rule name')[0], 'First')
    typeInto(screen.getAllByLabelText('Rule name')[1], 'Second')
  }

  it('reorders rules by dragging the handle', () => {
    render(<YourCode />)
    addTwoRules()
    dragOnto(
      screen.getByRole('button', { name: /^Rule 1\. Drag/ }),
      screen.getByRole('button', { name: /^Rule 2\. Drag/ }),
    )
    expect(ruleNames()).toEqual(['Second', 'First'])
  })

  it('reorders rules with the arrow keys', () => {
    render(<YourCode />)
    addTwoRules()
    fireEvent.keyDown(screen.getByRole('button', { name: /^Rule 2\. Drag/ }), {
      key: 'ArrowUp',
    })
    expect(ruleNames()).toEqual(['Second', 'First'])
  })

  it('reorders conditions inside the same group', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Condition' }))
    typeInto(screen.getAllByLabelText('Field')[0], 'a')
    typeInto(screen.getAllByLabelText('Value')[0], '1')
    typeInto(screen.getAllByLabelText('Field')[1], 'b')
    typeInto(screen.getAllByLabelText('Value')[1], '2')

    const handles = screen.getAllByRole('button', { name: /^Condition\. Drag/ })
    dragOnto(handles[1], handles[0])
    expect(preview().flags['my-first-flag'].targeting?.[0].query).toBe(
      'b eq 2 and a eq 1',
    )
  })

  it('ignores a drop into a different group', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Group' }))
    typeInto(screen.getAllByLabelText('Field')[0], 'a')
    typeInto(screen.getAllByLabelText('Value')[0], '1')
    typeInto(screen.getAllByLabelText('Field')[1], 'b')
    typeInto(screen.getAllByLabelText('Value')[1], '2')

    // The nested condition (index 0 of its group) dropped on the group itself
    // (index 1 of the outer list) would swap the outer items if it were accepted
    const nested = screen.getAllByRole('button', {
      name: /^Condition\. Drag/,
    })[1]
    dragOnto(nested, screen.getByRole('button', { name: /^Group\. Drag/ }))
    expect(preview().flags['my-first-flag'].targeting?.[0].query).toBe(
      'a eq 1 and (b eq 2)',
    )
  })
})

describe('Problem list', () => {
  it('names the problem in words and jumps to its input', () => {
    render(<YourCode />)
    typeInto(screen.getByLabelText('Flag name'), '')
    const list = screen.getByRole('list', { name: 'Problems to fix' })
    const problem = within(list).getByRole('button', {
      name: /Flag name is required.*Flag 1 › Name/,
    })

    fireEvent.click(problem)
    expect(document.activeElement).toBe(screen.getByLabelText('Flag name'))
  })

  it('jumps to the message when the problem has no input', () => {
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: /add rule/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove condition' }))
    fireEvent.click(screen.getByRole('button', { name: /Rule 1 › Conditions/ }))
    expect(document.activeElement?.id).toBe(
      'flags[0].rules[0].query.children-error',
    )
  })

  it('copies the config to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    render(<YourCode />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))

    expect(JSON.parse(writeText.mock.calls[0][0] as string)).toEqual(preview())
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy()
  })
})
