import { getBy, useStore } from '@tanstack/react-form'
import { Trash2Icon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useFlagForm } from '../form/form-hook'
import type { FlagPath } from '../form/field-paths'
import { DefaultRuleField } from './default-rule-field'
import { FlagDetails } from './flag-details'
import { MetadataField } from './metadata-field'
import { TargetingRulesField } from './targeting-rules-field'
import { VariationsField } from './variations-field'

/** Kept apart so typing the flag name re-renders only this heading. */
function FlagTitle({ flagPath, index }: { flagPath: FlagPath; index: number }) {
  const form = useFlagForm()
  const name = useStore(
    form.store,
    (state) => getBy(state.values, `${flagPath}.name`) as string,
  )
  return (
    <h2 className="truncate text-lg font-bold tracking-tight">
      {name || `Flag ${index + 1}`}
    </h2>
  )
}

interface FlagCardProps {
  flagPath: FlagPath
  index: number
  /** Missing when this is the only flag, which can't be removed. */
  onRemove?: () => void
}

export function FlagCard({ flagPath, index, onRemove }: FlagCardProps) {
  return (
    <article className="grid gap-8 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <FlagTitle flagPath={flagPath} index={index} />
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={onRemove}
          >
            <Trash2Icon />
            Remove flag
          </Button>
        )}
      </header>

      <FlagDetails flagPath={flagPath} />
      <VariationsField flagPath={flagPath} />
      <TargetingRulesField flagPath={flagPath} />
      <DefaultRuleField flagPath={flagPath} />
      <MetadataField flagPath={flagPath} />
    </article>
  )
}
