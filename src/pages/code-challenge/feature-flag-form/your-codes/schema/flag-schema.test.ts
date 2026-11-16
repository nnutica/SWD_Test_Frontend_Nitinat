import { describe, expect, it } from 'vitest'
import { DEFAULT_FLAG } from '../lib/defaults'
import { configSchema, flagSchema } from './flag-schema'
import type { Flag, QueryGroup } from './flag-schema'

/** Map each error path to its message, e.g. { "variations.1.name": "..." }. */
function errorsOf(values: Flag) {
  const result = flagSchema.safeParse(values)
  if (result.success) return {}
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  )
}

const withValues = (overrides: Partial<Flag>): Flag => ({
  ...DEFAULT_FLAG,
  ...overrides,
})

describe('flagSchema', () => {
  it('accepts the default values', () => {
    expect(errorsOf(DEFAULT_FLAG)).toEqual({})
  })

  it('rejects an empty flag name or one with spaces', () => {
    expect(errorsOf(withValues({ name: '' })).name).toBe(
      'Flag name is required',
    )
    expect(errorsOf(withValues({ name: 'my flag' })).name).toBe(
      'Flag name cannot contain spaces',
    )
  })

  it('rejects duplicate variation names and values of the wrong type', () => {
    const errors = errorsOf(
      withValues({
        variations: [
          { id: 'v1', name: 'on', value: 'yes' },
          { id: 'v2', name: 'on', value: 'false' },
        ],
        defaultRule: { type: 'variation', variationId: 'v1', percentage: {} },
      }),
    )
    expect(errors['variations.0.value']).toBe('Must be true or false')
    expect(errors['variations.1.name']).toBe('Variation name must be unique')
  })

  it('still runs cross-field checks while other fields are invalid', () => {
    const errors = errorsOf(
      withValues({
        name: '',
        defaultRule: { type: 'variation', variationId: 'gone', percentage: {} },
      }),
    )
    expect(errors.name).toBeDefined()
    expect(errors['defaultRule.variationId']).toBe('Select a variation')
  })

  it('requires percentages to add up to 100', () => {
    const errors = errorsOf(
      withValues({
        defaultRule: {
          type: 'percentage',
          variationId: 'variation-1',
          percentage: { 'variation-1': 60, 'variation-2': 30 },
        },
      }),
    )
    expect(errors['defaultRule.percentage']).toBe(
      'Percentages must add up to 100 (now 90)',
    )
  })

  it('accepts decimal percentages that sum to 100', () => {
    const errors = errorsOf(
      withValues({
        variations: [
          { id: 'a', name: 'a', value: 'true' },
          { id: 'b', name: 'b', value: 'true' },
          { id: 'c', name: 'c', value: 'false' },
        ],
        defaultRule: {
          type: 'percentage',
          variationId: 'a',
          percentage: { a: 33.3, b: 33.3, c: 33.4 },
        },
      }),
    )
    expect(errors).toEqual({})
  })

  it('validates conditions at any depth and reports their path', () => {
    const query: QueryGroup = {
      id: 'g1',
      kind: 'group',
      combinator: 'and',
      children: [
        {
          id: 'g2',
          kind: 'group',
          combinator: 'or',
          children: [
            {
              id: 'c1',
              kind: 'condition',
              field: '',
              operator: 'eq',
              value: '',
            },
            { id: 'g3', kind: 'group', combinator: 'and', children: [] },
          ],
        },
      ],
    }
    const errors = errorsOf(
      withValues({
        rules: [
          {
            id: 'r1',
            name: 'Rule 1',
            query,
            serve: {
              type: 'variation',
              variationId: 'variation-1',
              percentage: {},
            },
          },
        ],
      }),
    )
    const base = 'rules.0.query.children.0.children'
    expect(errors[`${base}.0.field`]).toBe('Field is required')
    expect(errors[`${base}.0.value`]).toBe('Value is required')
    expect(errors[`${base}.1.children`]).toBe(
      'Add at least one condition or group',
    )
  })

  it('does not require a value for the "pr" operator', () => {
    const errors = errorsOf(
      withValues({
        rules: [
          {
            id: 'r1',
            name: 'Rule 1',
            query: {
              id: 'g1',
              kind: 'group',
              combinator: 'and',
              children: [
                {
                  id: 'c1',
                  kind: 'condition',
                  field: 'email',
                  operator: 'pr',
                  value: '',
                },
              ],
            },
            serve: {
              type: 'variation',
              variationId: 'variation-1',
              percentage: {},
            },
          },
        ],
      }),
    )
    expect(errors).toEqual({})
  })
})

describe('flag metadata', () => {
  it('requires unique keys and keeps "description" for its own field', () => {
    const errors = errorsOf(
      withValues({
        metadata: [
          { id: 'm1', key: 'team', value: 'checkout' },
          { id: 'm2', key: 'team', value: 'growth' },
          { id: 'm3', key: 'description', value: 'x' },
          { id: 'm4', key: '', value: '' },
        ],
      }),
    )
    expect(errors).toEqual({
      'metadata.1.key': 'Key must be unique',
      'metadata.2.key': 'Use the Description field instead',
      'metadata.3.key': 'Key is required',
    })
  })
})

describe('configSchema', () => {
  it('requires every flag name to be unique', () => {
    const result = configSchema.safeParse({
      flags: [DEFAULT_FLAG, { ...DEFAULT_FLAG, id: 'flag-2' }],
    })
    expect(
      result.error?.issues.map((i) => [i.path.join('.'), i.message]),
    ).toEqual([['flags.1.name', 'Flag name must be unique']])
  })
})
