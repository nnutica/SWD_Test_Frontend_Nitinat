import { getBy } from '@tanstack/react-form'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { useFlagForm } from '../form/form-hook'
import type { FlagPath } from '../form/field-paths'
import { createVariation } from '../lib/defaults'
import { variationColor } from '../lib/variation-colors'
import type { FlagType } from '../lib/variation-value'
import { FieldError, getErrorMessage } from './fields/field-error'
import { FormSection } from './form-section'

const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
]

const VALUE_PLACEHOLDER: Record<FlagType, string> = {
  boolean: '',
  string: 'blue',
  number: '42',
  json: '{ "color": "blue" }',
}

const ROW_GRID =
  'grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3'

export function VariationsField({ flagPath }: { flagPath: FlagPath }) {
  const form = useFlagForm()

  return (
    <FormSection
      title="Variations"
      description="The values this flag can return."
    >
      {/* Array mode re-renders this list only when items are added or removed */}
      <form.Field name={`${flagPath}.variations`} mode="array">
        {(variationsField) => {
          const variations = variationsField.state.value
          const listError = getErrorMessage(variationsField.state.meta.errors)

          return (
            <div className="grid gap-3">
              <div
                aria-hidden
                className={cn(
                  ROW_GRID,
                  'text-xs font-medium text-muted-foreground',
                )}
              >
                <span className="w-2.5" />
                <span>Name</span>
                <span>Value</span>
                <span className="w-7" />
              </div>

              {/* Index keys: field names are index-based, see NOTES.md */}
              {variations.map((_, index) => {
                const variationPath =
                  `${flagPath}.variations[${index}]` as const
                return (
                  <div key={index} className={ROW_GRID}>
                    <span
                      className={cn(
                        'mt-2.75 size-2.5 rounded-full',
                        variationColor(index),
                      )}
                    />
                    <form.AppField name={`${variationPath}.name`}>
                      {(field) => (
                        <field.TextField
                          label={`Variation ${index + 1} name`}
                          hideLabel
                        />
                      )}
                    </form.AppField>

                    {/* Only the value input depends on the type, so only it re-renders when the type changes */}
                    <form.Subscribe
                      selector={(state) =>
                        getBy(state.values, `${flagPath}.type`) as FlagType
                      }
                    >
                      {(type) => (
                        <form.AppField name={`${variationPath}.value`}>
                          {(field) => {
                            const label = `Variation ${index + 1} value`
                            if (type === 'boolean') {
                              return (
                                <field.SelectField
                                  label={label}
                                  hideLabel
                                  options={BOOLEAN_OPTIONS}
                                />
                              )
                            }
                            if (type === 'json') {
                              return (
                                <field.TextareaField
                                  label={label}
                                  hideLabel
                                  monospace
                                  placeholder={VALUE_PLACEHOLDER.json}
                                />
                              )
                            }
                            return (
                              <field.TextField
                                label={label}
                                hideLabel
                                placeholder={VALUE_PLACEHOLDER[type]}
                                inputMode={
                                  type === 'number' ? 'decimal' : undefined
                                }
                              />
                            )
                          }}
                        </form.AppField>
                      )}
                    </form.Subscribe>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="mt-0.5"
                      aria-label={`Remove variation ${index + 1}`}
                      disabled={variations.length === 1}
                      onClick={() => variationsField.removeValue(index)}
                    >
                      <MinusIcon />
                    </Button>
                  </div>
                )
              })}

              <FieldError
                id={`${variationsField.name}-error`}
                message={listError}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-self-start"
                onClick={() =>
                  variationsField.pushValue(
                    createVariation(variations.length + 1),
                  )
                }
              >
                <PlusIcon />
                Add variation
              </Button>
            </div>
          )
        }}
      </form.Field>
    </FormSection>
  )
}
