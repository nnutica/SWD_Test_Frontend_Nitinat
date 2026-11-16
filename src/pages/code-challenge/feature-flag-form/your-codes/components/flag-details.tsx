import { useFlagForm } from '../form/form-hook'
import type { FlagPath } from '../form/field-paths'
import { FLAG_TYPES } from '../lib/variation-value'

const FLAG_TYPE_OPTIONS = FLAG_TYPES.map((type) => ({
  value: type,
  label: type,
}))

/** Name, type, version, description and the on/off switches of one flag. */
export function FlagDetails({ flagPath }: { flagPath: FlagPath }) {
  const form = useFlagForm()

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <form.AppField name={`${flagPath}.name`}>
          {(field) => (
            <field.TextField label="Flag name" placeholder="my-first-flag" />
          )}
        </form.AppField>
        <form.AppField name={`${flagPath}.type`}>
          {(field) => (
            <field.SelectField label="Type" options={FLAG_TYPE_OPTIONS} />
          )}
        </form.AppField>
        <form.AppField name={`${flagPath}.version`}>
          {(field) => <field.TextField label="Version" placeholder="1.0.0" />}
        </form.AppField>
      </div>

      <form.AppField name={`${flagPath}.description`}>
        {(field) => (
          <field.TextareaField
            label="Description"
            placeholder="What does this flag control?"
          />
        )}
      </form.AppField>

      <div className="grid gap-3 sm:grid-cols-2">
        <form.AppField name={`${flagPath}.disabled`}>
          {(field) => (
            <field.SwitchField
              label="Disable"
              description="Everyone gets the SDK default value"
            />
          )}
        </form.AppField>
        <form.AppField name={`${flagPath}.trackEvents`}>
          {(field) => (
            <field.SwitchField
              label="Track events"
              description="Send evaluation events to the exporter"
            />
          )}
        </form.AppField>
      </div>
    </div>
  )
}
