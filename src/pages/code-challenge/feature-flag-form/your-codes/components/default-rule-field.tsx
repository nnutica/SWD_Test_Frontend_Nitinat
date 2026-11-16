import { FormSection } from './form-section'
import { ServeField } from './serve-field'

export function DefaultRuleField() {
  return (
    <FormSection
      title="Default"
      description="Served when no targeting rule matches."
    >
      <div className="rounded-xl border border-border p-4">
        <ServeField path="defaultRule" />
      </div>
    </FormSection>
  )
}
