import { createFormHook } from '@tanstack/react-form'
import { SelectField } from '../components/fields/select-field'
import { SwitchField } from '../components/fields/switch-field'
import { TextField } from '../components/fields/text-field'
import { TextareaField } from '../components/fields/textarea-field'
import { fieldContext, formContext } from './form-context'
import { flagFormOptions } from './form-options'

/** App-wide form hook: `form.AppField` exposes these inputs already wired to the field. */
export const { useAppForm, withForm, useTypedAppFormContext } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField, SelectField, SwitchField },
  formComponents: {},
})

/** Typed form from context, for nested parts (rules, groups) that would otherwise need `form` passed down every level. */
export const useFlagForm = () => useTypedAppFormContext(flagFormOptions)
