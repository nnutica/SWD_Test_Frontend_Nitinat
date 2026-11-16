import { createFormHook } from '@tanstack/react-form'
import { SelectField } from '../components/fields/select-field'
import { SwitchField } from '../components/fields/switch-field'
import { TextField } from '../components/fields/text-field'
import { TextareaField } from '../components/fields/textarea-field'
import { fieldContext, formContext } from './form-context'

/** App-wide form hook: `form.AppField` exposes these inputs already wired to the field. */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField, SelectField, SwitchField },
  formComponents: {},
})
