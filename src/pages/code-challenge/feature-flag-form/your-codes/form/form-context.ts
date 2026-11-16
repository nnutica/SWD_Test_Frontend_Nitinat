import { createFormHookContexts } from '@tanstack/react-form'

// Kept apart from form-hook.ts so field components can import it without a cycle
export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts()
