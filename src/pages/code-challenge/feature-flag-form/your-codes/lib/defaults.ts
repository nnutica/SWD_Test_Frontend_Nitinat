import type {
  Condition,
  Flag,
  FlagFormValues,
  MetadataEntry,
  QueryGroup,
  Rule,
  Serve,
  Variation,
} from '../schema/flag-schema'

/** Stable id for React keys and for linking a serve to a variation. */
export const createId = () => crypto.randomUUID()

export const createCondition = (): Condition => ({
  id: createId(),
  kind: 'condition',
  field: '',
  operator: 'eq',
  value: '',
})

export const createGroup = (): QueryGroup => ({
  id: createId(),
  kind: 'group',
  combinator: 'and',
  children: [createCondition()],
})

export const createServe = (variationId: string): Serve => ({
  type: 'variation',
  variationId,
  percentage: {},
})

/** Whole-number split that always sums to 100; earlier variations get the remainder (34/33/33). */
export function evenSplit(variationIds: string[]): Record<string, number> {
  const base = Math.floor(100 / variationIds.length)
  const remainder = 100 - base * variationIds.length
  return Object.fromEntries(
    variationIds.map((id, index) => [id, base + (index < remainder ? 1 : 0)]),
  )
}

export const createVariation = (position: number): Variation => ({
  id: createId(),
  name: `Variation_${position}`,
  value: '',
})

export const createRule = (position: number, variationId: string): Rule => ({
  id: createId(),
  name: `Rule ${position}`,
  query: createGroup(),
  serve: createServe(variationId),
})

export const createMetadataEntry = (): MetadataEntry => ({
  id: createId(),
  key: '',
  value: '',
})

/** A new flag starts like GoFeatureFlag's: two boolean variations, serving the first. */
export function createFlag(position: number): Flag {
  const on = { id: createId(), name: 'Variation_1', value: 'true' }
  const off = { id: createId(), name: 'Variation_2', value: 'false' }
  return {
    id: createId(),
    name: `new-flag-${position}`,
    description: '',
    version: '',
    type: 'boolean',
    disabled: false,
    trackEvents: true,
    variations: [on, off],
    rules: [],
    defaultRule: createServe(on.id),
    metadata: [],
  }
}

// Fixed ids so the server and client render the same first state
export const DEFAULT_FLAG: Flag = {
  id: 'flag-1',
  name: 'my-first-flag',
  description: '',
  version: '',
  type: 'boolean',
  disabled: false,
  trackEvents: true,
  variations: [
    { id: 'variation-1', name: 'Variation_1', value: 'true' },
    { id: 'variation-2', name: 'Variation_2', value: 'false' },
  ],
  rules: [],
  defaultRule: createServe('variation-1'),
  metadata: [],
}

export const DEFAULT_FORM_VALUES: FlagFormValues = { flags: [DEFAULT_FLAG] }
