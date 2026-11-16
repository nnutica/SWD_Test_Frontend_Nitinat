import { flagSchema } from '../schema/flag-schema'
import type { FlagFormValues } from '../schema/flag-schema'

export interface FormIssue {
  fieldName: string
  message: string
}

/** Zod path to a TanStack field name: ['variations', 1, 'name'] -> 'variations[1].name'. */
export function toFieldName(path: readonly PropertyKey[]): string {
  return path
    .map((key, index) => {
      if (typeof key === 'number') return `[${key}]`
      return index === 0 ? String(key) : `.${String(key)}`
    })
    .join('')
}

/** Every validation problem in the form, for the summary next to the preview. */
export function getFormIssues(values: FlagFormValues): FormIssue[] {
  const result = flagSchema.safeParse(values)
  if (result.success) return []
  return result.error.issues.map((issue) => ({
    fieldName: toFieldName(issue.path),
    message: issue.message,
  }))
}
