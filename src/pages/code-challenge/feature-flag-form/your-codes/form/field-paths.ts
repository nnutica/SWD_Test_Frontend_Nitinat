// Field paths, e.g. `flags[0].rules[1].query.children[2].children[0]`.
// TanStack accepts any key below the `unknown[]` children (see FlagFormState),
// so paths built from these types still type-check without casts.

export type FlagPath = `flags[${number}]`

type RulePath = `${FlagPath}.rules[${number}]`

type ChildPath =
  | `${RulePath}.query.children[${number}]`
  | `${RulePath}.query.children[${number}].${string}`

/** A rule's top-level query is always a group; nested groups live in children. */
export type GroupPath = `${RulePath}.query` | ChildPath

/** Conditions only ever live in a group's children. */
export type ConditionPath = ChildPath

/** Where a serve lives: the flag's default rule or one of its targeting rules. */
export type ServePath = `${FlagPath}.defaultRule` | `${RulePath}.serve`
