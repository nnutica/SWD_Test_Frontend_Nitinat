import Header from '#/components/features/header'
import { AttributeSuggestions } from './components/attribute-suggestions'
import { FlagsField } from './components/flags-field'
import { JsonPreview } from './components/json-preview'
import { useAppForm } from './form/form-hook'
import { flagFormOptions } from './form/form-options'

function YourCode() {
  const form = useAppForm(flagFormOptions)

  return (
    <section>
      <Header
        title="Feature Flag Editor"
        subTitle="Build flags on the left and copy the GoFeatureFlag config from the preview."
      />

      {/* AppForm provides the form to every section through context */}
      <form.AppForm>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <FlagsField />
          <AttributeSuggestions />
          <aside className="lg:sticky lg:top-4">
            <JsonPreview />
          </aside>
        </div>
      </form.AppForm>
    </section>
  )
}

export default YourCode
