import { configSchema } from '../schema/flag-schema'
import type { FlagFormValues } from '../schema/flag-schema'

export interface FormIssue {
  /** TanStack field name, also the id of its input. */
  fieldName: string
  /** Where the problem is, in words, e.g. "my-flag › Rule 1 › Condition 2 › Field". */
  label: string
  message: string
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  value: 'Value',
  field: 'Field',
  key: 'Key',
  children: 'Conditions',
  variations: 'Variations',
  variationId: 'Serve',
  percentage: 'Percentage',
  flags: 'Flags',
}

// Path parts that only exist for the data shape and mean nothing to a user
const SKIPPED = new Set(['query', 'serve'])

/** Zod path to a TanStack field name: ['flags', 0, 'name'] -> 'flags[0].name'. */
export function toFieldName(path: readonly PropertyKey[]): string {
  return path
    .map((key, index) => {
      if (typeof key === 'number') return `[${key}]`
      return index === 0 ? String(key) : `.${String(key)}`
    })
    .join('')
}

/** "Rule 2", "Group 1", or the flag/rule's own name when it has one. */
function itemLabel(list: string, index: number, item: unknown): string {
  const record = (item ?? {}) as { name?: string; kind?: string }
  const position = index + 1
  switch (list) {
    case 'flags':
      return record.name || `Flag ${position}`
    case 'rules':
      return record.name || `Rule ${position}`
    case 'children':
      return `${record.kind === 'group' ? 'Group' : 'Condition'} ${position}`
    case 'variations':
      return `Variation ${position}`
    case 'metadata':
      return `Metadata ${position}`
    default:
      return `${list} ${position}`
  }
}

/** Describe a Zod path in words, using the values to name flags, rules and groups. */
export function describePath(
  path: readonly PropertyKey[],
  values: FlagFormValues,
): string {
  const parts: string[] = []
  let node: unknown = values

  for (let i = 0; i < path.length; i++) {
    const key = String(path[i])
    node = (node as Record<string, unknown> | undefined)?.[key]
    const next = path[i + 1]

    if (typeof next === 'number') {
      const item = (node as unknown[] | undefined)?.[next]
      parts.push(itemLabel(key, next, item))
      node = item
      i++
    } else if (key === 'defaultRule') {
      parts.push('Default rule')
    } else if (!SKIPPED.has(key) && i === path.length - 1) {
      parts.push(FIELD_LABELS[key] ?? key)
    }
  }

  return parts.join(' › ')
}

/** Every validation problem in the form, for the summary next to the preview. */
export function getFormIssues(values: FlagFormValues): FormIssue[] {
  const result = configSchema.safeParse(values)
  if (result.success) return []
  return result.error.issues.map((issue) => ({
    fieldName: toFieldName(issue.path),
    label: describePath(issue.path, values),
    message: issue.message,
  }))
}
