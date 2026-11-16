import Header from '#/components/features/header'
import { FlagMetadata } from './components/flag-metadata'
import { JsonPreview } from './components/json-preview'
import { TargetingRulesField } from './components/targeting-rules-field'
import { VariationsField } from './components/variations-field'
import { useAppForm } from './form/form-hook'
import { flagFormOptions } from './form/form-options'

function YourCode() {
  const form = useAppForm(flagFormOptions)

  return (
    <section>
      <Header
        title="Feature Flag Editor"
        subTitle="Build a flag on the left and copy the GoFeatureFlag config from the preview."
      />

      {/* AppForm provides the form to nested rules and groups through context */}
      <form.AppForm>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <div className="grid gap-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <FlagMetadata form={form} />
            <VariationsField form={form} />
            <TargetingRulesField form={form} />
          </div>

          <aside className="lg:sticky lg:top-4">
            <JsonPreview form={form} />
          </aside>
        </div>
      </form.AppForm>
    </section>
  )
}

export default YourCode
