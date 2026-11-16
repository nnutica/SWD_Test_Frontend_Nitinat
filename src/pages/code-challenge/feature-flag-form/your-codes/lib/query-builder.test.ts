import { describe, expect, it } from 'vitest'
import type { Condition, QueryGroup, QueryNode } from '../schema/flag-schema'
import { conditionToQuery, formatValue, groupToQuery } from './query-builder'

const condition = (
  field: string,
  operator: Condition['operator'],
  value = '',
): Condition => ({ id: field, kind: 'condition', field, operator, value })

const group = (
  combinator: QueryGroup['combinator'],
  children: QueryNode[],
): QueryGroup => ({ id: 'g', kind: 'group', combinator, children })

describe('formatValue', () => {
  it('keeps numbers and booleans bare', () => {
    expect(formatValue('18')).toBe('18')
    expect(formatValue('-2.5')).toBe('-2.5')
    expect(formatValue('true')).toBe('true')
  })

  it('quotes strings and escapes quotes inside', () => {
    expect(formatValue('beta')).toBe('"beta"')
    expect(formatValue('say "hi"')).toBe('"say \\"hi\\""')
  })
})

describe('conditionToQuery', () => {
  it('builds a binary condition', () => {
    expect(conditionToQuery(condition('group', 'eq', 'beta'))).toBe(
      'group eq "beta"',
    )
    expect(conditionToQuery(condition('age', 'ge', '18'))).toBe('age ge 18')
  })

  it('builds a list for "in"', () => {
    expect(conditionToQuery(condition('country', 'in', 'TH, US,'))).toBe(
      'country in ["TH", "US"]',
    )
  })

  it('drops the value for "pr"', () => {
    expect(conditionToQuery(condition('email', 'pr', 'ignored'))).toBe(
      'email pr',
    )
  })

  it('wraps "not" around an equality', () => {
    expect(conditionToQuery(condition('role', 'not', 'admin'))).toBe(
      'not (role eq "admin")',
    )
  })
})

describe('groupToQuery', () => {
  it('joins children with the combinator and wraps nested groups', () => {
    const query = group('and', [
      condition('a', 'eq', '1'),
      group('or', [condition('b', 'eq', 'x'), condition('c', 'eq', 'y')]),
    ])
    expect(groupToQuery(query)).toBe('a eq 1 and (b eq "x" or c eq "y")')
  })

  it('handles deep nesting', () => {
    const query = group('or', [
      group('and', [group('or', [condition('a', 'pr')])]),
    ])
    expect(groupToQuery(query)).toBe('((a pr))')
  })

  it('skips empty groups instead of printing "()"', () => {
    const query = group('and', [condition('a', 'pr'), group('or', [])])
    expect(groupToQuery(query)).toBe('a pr')
  })
})
