// Field paths inside a rule's query, e.g. `rules[0].query.children[1].children[0]`.
// TanStack accepts any key below the `unknown[]` children (see FlagFormState),
// so paths built from these types still type-check without casts.

type ChildPath =
  | `rules[${number}].query.children[${number}]`
  | `rules[${number}].query.children[${number}].${string}`

/** A rule's top-level query is always a group; nested groups live in children. */
export type GroupPath = `rules[${number}].query` | ChildPath

/** Conditions only ever live in a group's children. */
export type ConditionPath = ChildPath

/** Where a serve lives: the default rule or a targeting rule. */
export type ServePath = 'defaultRule' | `rules[${number}].serve`
