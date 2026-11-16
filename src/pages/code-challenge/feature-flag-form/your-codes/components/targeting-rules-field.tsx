import { PlusIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useFlagForm } from '../form/form-hook'
import type { FlagPath } from '../form/field-paths'
import { createRule } from '../lib/defaults'
import { FormSection } from './form-section'
import { RuleCard } from './rule-card'

export function TargetingRulesField({ flagPath }: { flagPath: FlagPath }) {
  const form = useFlagForm()

  return (
    <FormSection
      title="Target specific users"
      description="Rules are checked from top to bottom; the first match decides the variation."
    >
      <form.Field name={`${flagPath}.rules`} mode="array">
        {(rulesField) => {
          const rules = rulesField.state.value

          return (
            <div className="grid gap-4">
              {rules.length === 0 && (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No rules yet. Everyone gets the default variation.
                </p>
              )}

              {/* Index keys: field names are index-based, see NOTES.md */}
              {rules.map((_, index) => (
                <RuleCard
                  key={index}
                  flagPath={flagPath}
                  index={index}
                  onRemove={() => rulesField.removeValue(index)}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-self-start"
                onClick={() => {
                  const firstVariationId =
                    form.getFieldValue(`${flagPath}.variations`).at(0)?.id ?? ''
                  rulesField.pushValue(
                    createRule(rules.length + 1, firstVariationId),
                  )
                }}
              >
                <PlusIcon />
                Add rule
              </Button>
            </div>
          )
        }}
      </form.Field>
    </FormSection>
  )
}
