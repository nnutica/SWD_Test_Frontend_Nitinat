import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useFlagForm } from '../form/form-hook'
import type { FlagPath } from '../form/field-paths'
import { createMetadataEntry } from '../lib/defaults'
import { FormSection } from './form-section'

/** Free key/value pairs, written next to the description in `metadata`. */
export function MetadataField({ flagPath }: { flagPath: FlagPath }) {
  const form = useFlagForm()

  return (
    <FormSection title="Metadata" description="Add new metadata to your flag.">
      <form.Field name={`${flagPath}.metadata`} mode="array">
        {(metadataField) => {
          const entries = metadataField.state.value

          return (
            <div className="grid gap-3">
              {/* Index keys: field names are index-based, see NOTES.md */}
              {entries.map((_, index) => {
                const entryPath = `${flagPath}.metadata[${index}]` as const
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3"
                  >
                    <form.AppField name={`${entryPath}.key`}>
                      {(field) => (
                        <field.TextField
                          label={`Metadata ${index + 1} key`}
                          hideLabel
                          placeholder="Key"
                        />
                      )}
                    </form.AppField>
                    <form.AppField name={`${entryPath}.value`}>
                      {(field) => (
                        <field.TextField
                          label={`Metadata ${index + 1} value`}
                          hideLabel
                          placeholder="Value"
                        />
                      )}
                    </form.AppField>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="mt-0.5"
                      aria-label={`Remove metadata ${index + 1}`}
                      onClick={() => metadataField.removeValue(index)}
                    >
                      <MinusIcon />
                    </Button>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-self-start"
                onClick={() => metadataField.pushValue(createMetadataEntry())}
              >
                <PlusIcon />
                Add metadata
              </Button>
            </div>
          )
        }}
      </form.Field>
    </FormSection>
  )
}
