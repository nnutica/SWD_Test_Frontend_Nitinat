import { describe, expect, it } from 'vitest'
import type { Flag } from '../schema/flag-schema'
import { DEFAULT_FLAG, DEFAULT_FORM_VALUES } from './defaults'
import { flagToOutput, toOutput } from './to-output'

const withValues = (overrides: Partial<Flag>): Flag => ({
  ...DEFAULT_FLAG,
  ...overrides,
})

describe('toOutput', () => {
  it('outputs the default flag like the GoFeatureFlag editor', () => {
    expect(JSON.parse(JSON.stringify(toOutput(DEFAULT_FORM_VALUES)))).toEqual({
      flags: {
        'my-first-flag': {
          variations: { Variation_1: true, Variation_2: false },
          defaultRule: { variation: 'Variation_1' },
        },
      },
    })
  })

  it('puts every flag side by side under "flags"', () => {
    const output = toOutput({
      flags: [DEFAULT_FLAG, { ...DEFAULT_FLAG, id: 'f2', name: 'new-flag-2' }],
    })
    expect(Object.keys(output.flags)).toEqual(['my-first-flag', 'new-flag-2'])
  })
})

describe('flagToOutput', () => {
  it('parses variation values by flag type', () => {
    const flag = flagToOutput(
      withValues({
        type: 'json',
        variations: [{ id: 'v1', name: 'on', value: '{"color":"red"}' }],
        defaultRule: { type: 'variation', variationId: 'v1', percentage: {} },
      }),
    )
    expect(flag.variations).toEqual({ on: { color: 'red' } })
  })

  it('keeps the raw text of an invalid value so the preview still shows it', () => {
    const flag = flagToOutput(
      withValues({
        type: 'number',
        variations: [{ id: 'v1', name: 'on', value: 'abc' }],
      }),
    )
    expect(flag.variations).toEqual({ on: 'abc' })
  })

  it('builds targeting with a query and a percentage by variation name', () => {
    const flag = flagToOutput(
      withValues({
        rules: [
          {
            id: 'r1',
            name: 'Beta users',
            query: {
              id: 'g1',
              kind: 'group',
              combinator: 'and',
              children: [
                {
                  id: 'c1',
                  kind: 'condition',
                  field: 'group',
                  operator: 'eq',
                  value: 'beta',
                },
              ],
            },
            serve: {
              type: 'percentage',
              variationId: 'variation-1',
              percentage: { 'variation-1': 30, 'variation-2': 70 },
            },
          },
        ],
      }),
    )
    expect(flag.targeting).toEqual([
      {
        name: 'Beta users',
        query: 'group eq "beta"',
        percentage: { Variation_1: 30, Variation_2: 70 },
      },
    ])
  })

  it('includes settings only when they differ from the default', () => {
    const flag = flagToOutput(
      withValues({ disabled: true, trackEvents: false, version: ' 1.0.0 ' }),
    )
    expect(flag.disable).toBe(true)
    expect(flag.trackEvents).toBe(false)
    expect(flag.version).toBe('1.0.0')
    expect(flagToOutput(DEFAULT_FLAG).metadata).toBeUndefined()
  })

  it('merges the description and key/value entries into metadata', () => {
    const flag = flagToOutput(
      withValues({
        description: 'New checkout',
        metadata: [{ id: 'm1', key: 'Age', value: '22' }],
      }),
    )
    expect(flag.metadata).toEqual({ description: 'New checkout', Age: '22' })
  })
})
