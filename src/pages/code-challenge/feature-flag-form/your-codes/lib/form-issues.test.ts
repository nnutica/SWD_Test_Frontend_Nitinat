import { describe, expect, it } from 'vitest'
import type { FlagFormValues } from '../schema/flag-schema'
import { DEFAULT_FLAG, DEFAULT_FORM_VALUES } from './defaults'
import { describePath, getFormIssues, toFieldName } from './form-issues'

describe('toFieldName', () => {
  it('matches the field names used by TanStack Form', () => {
    expect(toFieldName(['flags'])).toBe('flags')
    expect(toFieldName(['flags', 0, 'variations', 1, 'name'])).toBe(
      'flags[0].variations[1].name',
    )
    expect(
      toFieldName(['flags', 0, 'rules', 0, 'query', 'children', 2, 'field']),
    ).toBe('flags[0].rules[0].query.children[2].field')
  })
})

describe('describePath', () => {
  const values: FlagFormValues = {
    flags: [
      {
        ...DEFAULT_FLAG,
        rules: [
          {
            id: 'r1',
            name: '',
            query: {
              id: 'g1',
              kind: 'group',
              combinator: 'and',
              children: [
                {
                  id: 'c1',
                  kind: 'condition',
                  field: 'a',
                  operator: 'eq',
                  value: '1',
                },
                { id: 'g2', kind: 'group', combinator: 'or', children: [] },
              ],
            },
            serve: {
              type: 'variation',
              variationId: 'variation-1',
              percentage: {},
            },
          },
        ],
      },
    ],
  }

  it('names flags, rules, conditions and groups in words', () => {
    expect(
      describePath(
        ['flags', 0, 'rules', 0, 'query', 'children', 0, 'field'],
        values,
      ),
    ).toBe('my-first-flag › Rule 1 › Condition 1 › Field')
    expect(
      describePath(
        ['flags', 0, 'rules', 0, 'query', 'children', 1, 'children'],
        values,
      ),
    ).toBe('my-first-flag › Rule 1 › Group 2 › Conditions')
  })

  it('describes serve and list-level problems', () => {
    expect(
      describePath(['flags', 0, 'defaultRule', 'percentage'], values),
    ).toBe('my-first-flag › Default rule › Percentage')
    expect(
      describePath(['flags', 0, 'rules', 0, 'serve', 'variationId'], values),
    ).toBe('my-first-flag › Rule 1 › Serve')
    expect(describePath(['flags', 0, 'variations', 1, 'name'], values)).toBe(
      'my-first-flag › Variation 2 › Name',
    )
  })

  it('falls back to a position when the flag has no name yet', () => {
    const unnamed = { flags: [{ ...DEFAULT_FLAG, name: '' }] }
    expect(describePath(['flags', 0, 'name'], unnamed)).toBe('Flag 1 › Name')
  })
})

describe('getFormIssues', () => {
  it('returns nothing for valid values', () => {
    expect(getFormIssues(DEFAULT_FORM_VALUES)).toEqual([])
  })

  it('lists each problem with the field it belongs to', () => {
    expect(getFormIssues({ flags: [{ ...DEFAULT_FLAG, name: '' }] })).toEqual([
      {
        fieldName: 'flags[0].name',
        label: 'Flag 1 › Name',
        message: 'Flag name is required',
      },
    ])
  })
})
