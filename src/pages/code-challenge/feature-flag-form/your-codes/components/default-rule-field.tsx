import type { FlagPath } from '../form/field-paths'
import { FormSection } from './form-section'
import { ServeField } from './serve-field'

export function DefaultRuleField({ flagPath }: { flagPath: FlagPath }) {
  return (
    <FormSection
      title="Default"
      description="Served when no targeting rule matches."
    >
      <div className="rounded-xl border border-border p-4">
        <ServeField path={`${flagPath}.defaultRule`} flagPath={flagPath} />
      </div>
    </FormSection>
  )
}
