import type { Condition, QueryGroup } from '../schema/flag-schema'

/** Numbers and booleans go in bare; everything else is a quoted string. */
export function formatValue(raw: string): string {
  const value = raw.trim()
  if (value === 'true' || value === 'false' || /^-?\d+(\.\d+)?$/.test(value)) {
    return value
  }
  // JSON.stringify adds the quotes and escapes any quote inside the value
  return JSON.stringify(value)
}

export function conditionToQuery(condition: Condition): string {
  const field = condition.field.trim()

  switch (condition.operator) {
    case 'pr':
      return `${field} pr`
    case 'in': {
      const items = condition.value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map(formatValue)
      return `${field} in [${items.join(', ')}]`
    }
    case 'not':
      return `not (${field} eq ${formatValue(condition.value)})`
    default:
      return `${field} ${condition.operator} ${formatValue(condition.value)}`
  }
}

/** Build the query string for a group; nested groups are wrapped in parentheses. */
export function groupToQuery(group: QueryGroup): string {
  return group.children
    .map((node) => {
      if (node.kind === 'condition') return conditionToQuery(node)
      const inner = groupToQuery(node)
      return inner ? `(${inner})` : ''
    })
    .filter(Boolean)
    .join(` ${group.combinator} `)
}
