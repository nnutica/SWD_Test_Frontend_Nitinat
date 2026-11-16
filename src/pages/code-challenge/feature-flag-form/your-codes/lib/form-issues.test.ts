import { describe, expect, it } from 'vitest'
import { DEFAULT_FLAG, DEFAULT_FORM_VALUES } from './defaults'
import { getFormIssues, toFieldName } from './form-issues'

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

describe('getFormIssues', () => {
  it('returns nothing for valid values', () => {
    expect(getFormIssues(DEFAULT_FORM_VALUES)).toEqual([])
  })

  it('lists each problem with the field it belongs to', () => {
    expect(getFormIssues({ flags: [{ ...DEFAULT_FLAG, name: '' }] })).toEqual([
      { fieldName: 'flags[0].name', message: 'Flag name is required' },
    ])
  })
})
