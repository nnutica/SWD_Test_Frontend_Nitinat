import { formOptions, standardSchemaValidators } from '@tanstack/react-form'
import { DEFAULT_FORM_VALUES } from '../lib/defaults'
import { configSchema } from '../schema/flag-schema'
import type {
  Flag,
  FlagFormValues,
  QueryGroup,
  Rule,
} from '../schema/flag-schema'

type RuleState = Omit<Rule, 'query'> & {
  query: Omit<QueryGroup, 'children'> & { children: unknown[] }
}

/**
 * The form state as TanStack Form sees it. TanStack lists every possible field
 * name of the form type, which never ends for a self-referencing group (TS2589).
 * Typing group children as `unknown[]` stops that walk; nested paths are built
 * at runtime anyway, and Zod still validates the whole tree.
 */
export interface FlagFormState {
  flags: (Omit<Flag, 'rules'> & { rules: RuleState[] })[]
}

const defaultValues: FlagFormState = DEFAULT_FORM_VALUES

// Shared by useAppForm and useFlagForm so they agree on the form type
export const flagFormOptions = formOptions({
  defaultValues,
  validators: {
    // Wrapped in a function on purpose: the dev tools JSON.stringify form options,
    // and the self-referencing Zod schema crashes that. Errors still map to each field.
    onChange: ({ value }) =>
      standardSchemaValidators.validate(
        { value, validationSource: 'form' },
        configSchema,
      ),
  },
})

/** Form state only ever holds nodes made by lib/defaults, so it is the full type. */
export const asFlagValues = (state: FlagFormState) => state as FlagFormValues
