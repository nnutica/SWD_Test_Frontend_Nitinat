import { PlusIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useFlagForm } from '../form/form-hook'
import { createFlag } from '../lib/defaults'
import { FlagCard } from './flag-card'

/** Every flag in the config, plus "Add another flag" like GoFeatureFlag. */
export function FlagsField() {
  const form = useFlagForm()

  return (
    <form.Field name="flags" mode="array">
      {(flagsField) => {
        const flags = flagsField.state.value

        return (
          <div className="grid gap-6">
            {/* Index keys: field names are index-based, see NOTES.md */}
            {flags.map((_, index) => (
              <FlagCard
                key={index}
                flagPath={`flags[${index}]`}
                index={index}
                onRemove={
                  flags.length > 1
                    ? () => flagsField.removeValue(index)
                    : undefined
                }
              />
            ))}

            <Button
              type="button"
              variant="outline"
              className="justify-self-start"
              onClick={() => flagsField.pushValue(createFlag(flags.length + 1))}
            >
              <PlusIcon />
              Add another flag
            </Button>
          </div>
        )
      }}
    </form.Field>
  )
}
