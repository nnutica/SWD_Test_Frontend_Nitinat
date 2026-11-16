import { XIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useFlagForm } from '../form/form-hook'
import type { FlagPath } from '../form/field-paths'
import { ConditionGroup } from './condition-group'
import { ServeField } from './serve-field'

interface RuleCardProps {
  flagPath: FlagPath
  index: number
  onRemove: () => void
}

export function RuleCard({ flagPath, index, onRemove }: RuleCardProps) {
  const form = useFlagForm()
  const rulePath = `${flagPath}.rules[${index}]` as const

  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <form.AppField name={`${rulePath}.name`}>
          {(field) => <field.TextField label="Rule name" className="flex-1" />}
        </form.AppField>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-6"
          aria-label={`Remove rule ${index + 1}`}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>

      <ConditionGroup path={`${rulePath}.query`} depth={0} />
      <ServeField path={`${rulePath}.serve`} flagPath={flagPath} />
    </article>
  )
}
