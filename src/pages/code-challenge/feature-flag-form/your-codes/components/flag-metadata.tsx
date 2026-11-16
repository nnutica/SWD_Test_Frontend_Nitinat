import { withForm } from '../form/form-hook'
import { flagFormOptions } from '../form/form-options'
import { FLAG_TYPES } from '../lib/variation-value'
import { FormSection } from './form-section'

const FLAG_TYPE_OPTIONS = FLAG_TYPES.map((type) => ({
  value: type,
  label: type,
}))

export const FlagMetadata = withForm({
  ...flagFormOptions,
  render: function Render({ form }) {
    return (
      <FormSection title="Flag">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <form.AppField name="name">
            {(field) => (
              <field.TextField label="Flag name" placeholder="my-first-flag" />
            )}
          </form.AppField>
          <form.AppField name="type">
            {(field) => (
              <field.SelectField label="Type" options={FLAG_TYPE_OPTIONS} />
            )}
          </form.AppField>
          <form.AppField name="version">
            {(field) => <field.TextField label="Version" placeholder="1.0.0" />}
          </form.AppField>
        </div>

        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label="Description"
              placeholder="What does this flag control?"
            />
          )}
        </form.AppField>

        <div className="grid gap-3 sm:grid-cols-2">
          <form.AppField name="disabled">
            {(field) => (
              <field.SwitchField
                label="Disable"
                description="Everyone gets the SDK default value"
              />
            )}
          </form.AppField>
          <form.AppField name="trackEvents">
            {(field) => (
              <field.SwitchField
                label="Track events"
                description="Send evaluation events to the exporter"
              />
            )}
          </form.AppField>
        </div>
      </FormSection>
    )
  },
})
