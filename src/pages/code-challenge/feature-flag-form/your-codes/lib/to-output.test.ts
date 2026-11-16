import { describe, expect, it } from 'vitest'
import type { FlagFormValues } from '../schema/flag-schema'
import { DEFAULT_FLAG_VALUES } from './defaults'
import { toOutput } from './to-output'

const withValues = (overrides: Partial<FlagFormValues>): FlagFormValues => ({
  ...DEFAULT_FLAG_VALUES,
  ...overrides,
})

describe('toOutput', () => {
  it('outputs the default flag like the GoFeatureFlag editor', () => {
    expect(JSON.parse(JSON.stringify(toOutput(DEFAULT_FLAG_VALUES)))).toEqual({
      flags: {
        'my-first-flag': {
          variations: { Variation_1: true, Variation_2: false },
          defaultRule: { variation: 'Variation_1' },
        },
      },
    })
  })

  it('parses variation values by flag type', () => {
    const output = toOutput(
      withValues({
        type: 'json',
        variations: [{ id: 'v1', name: 'on', value: '{"color":"red"}' }],
        defaultRule: { type: 'variation', variationId: 'v1', percentage: {} },
      }),
    )
    expect(output.flags['my-first-flag'].variations).toEqual({
      on: { color: 'red' },
    })
  })

  it('keeps the raw text of an invalid value so the preview still shows it', () => {
    const output = toOutput(
      withValues({
        type: 'number',
        variations: [{ id: 'v1', name: 'on', value: 'abc' }],
      }),
    )
    expect(output.flags['my-first-flag'].variations).toEqual({ on: 'abc' })
  })

  it('builds targeting with a query and a percentage by variation name', () => {
    const output = toOutput(
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
    expect(output.flags['my-first-flag'].targeting).toEqual([
      {
        name: 'Beta users',
        query: 'group eq "beta"',
        percentage: { Variation_1: 30, Variation_2: 70 },
      },
    ])
  })

  it('includes metadata only when it differs from the default', () => {
    const flag = toOutput(
      withValues({
        disabled: true,
        trackEvents: false,
        version: ' 1.0.0 ',
        description: 'New checkout',
      }),
    ).flags['my-first-flag']

    expect(flag.disable).toBe(true)
    expect(flag.trackEvents).toBe(false)
    expect(flag.version).toBe('1.0.0')
    expect(flag.metadata).toEqual({ description: 'New checkout' })
  })
})
