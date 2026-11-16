import { describe, expect, it } from 'vitest'
import { DEFAULT_FLAG_VALUES } from './defaults'
import { getFormIssues, toFieldName } from './form-issues'

describe('toFieldName', () => {
  it('matches the field names used by TanStack Form', () => {
    expect(toFieldName(['name'])).toBe('name')
    expect(toFieldName(['variations', 1, 'name'])).toBe('variations[1].name')
    expect(toFieldName(['rules', 0, 'query', 'children', 2, 'field'])).toBe(
      'rules[0].query.children[2].field',
    )
  })
})

describe('getFormIssues', () => {
  it('returns nothing for valid values', () => {
    expect(getFormIssues(DEFAULT_FLAG_VALUES)).toEqual([])
  })

  it('lists each problem with the field it belongs to', () => {
    expect(getFormIssues({ ...DEFAULT_FLAG_VALUES, name: '' })).toEqual([
      { fieldName: 'name', message: 'Flag name is required' },
    ])
  })
})
