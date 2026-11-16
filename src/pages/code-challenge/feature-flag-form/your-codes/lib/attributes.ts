// Common user attributes offered in the condition "Field" input.
// Users can still type any attribute; these only make groups and roles easy to target.
export const SUGGESTED_ATTRIBUTES = [
  { name: 'role', hint: 'Role, e.g. admin, editor, viewer' },
  { name: 'group', hint: 'Group, e.g. beta, internal' },
  { name: 'email', hint: 'User email' },
  { name: 'country', hint: 'Country code, e.g. TH' },
  { name: 'plan', hint: 'Subscription plan, e.g. free, pro' },
  { name: 'targetingKey', hint: 'Unique user id' },
] as const

/** id of the shared <datalist>, rendered once and used by every Field input. */
export const ATTRIBUTE_LIST_ID = 'condition-attribute-suggestions'
