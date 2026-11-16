import { z } from 'zod'
import { OPERATOR_VALUES, isUnaryOperator } from '../lib/operators'
import { FLAG_TYPES, parseVariationValue } from '../lib/variation-value'

const keySchema = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    // \S* (not \S+) so an empty value only gets the "required" error
    .regex(/^\S*$/, `${label} cannot contain spaces`)

export const conditionSchema = z
  .object({
    id: z.string(),
    kind: z.literal('condition'),
    field: keySchema('Field'),
    operator: z.enum(OPERATOR_VALUES),
    value: z.string(),
  })
  .refine((c) => isUnaryOperator(c.operator) || c.value.trim() !== '', {
    message: 'Value is required',
    path: ['value'],
  })

// A getter lets the schema refer to itself, so groups can nest without limit.
// TypeScript needs the explicit return type to resolve the self-reference.
export const groupSchema = z.object({
  id: z.string(),
  kind: z.literal('group'),
  combinator: z.enum(['and', 'or']),
  get children(): z.ZodArray<
    z.ZodDiscriminatedUnion<[typeof conditionSchema, typeof groupSchema]>
  > {
    return z
      .array(z.discriminatedUnion('kind', [conditionSchema, groupSchema]))
      .min(1, 'Add at least one condition or group')
  },
})

export const serveSchema = z.object({
  type: z.enum(['variation', 'percentage']),
  variationId: z.string(),
  // Keyed by variation id so renaming a variation keeps its percentage
  percentage: z.record(
    z.string(),
    z.number().min(0, 'Min is 0').max(100, 'Max is 100'),
  ),
})

export const variationSchema = z.object({
  id: z.string(),
  name: keySchema('Variation name'),
  value: z.string(),
})

export const metadataEntrySchema = z.object({
  id: z.string(),
  key: keySchema('Key'),
  value: z.string(),
})

export const ruleSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Rule name is required'),
  query: groupSchema,
  serve: serveSchema,
})

export const flagSchema = z
  .object({
    id: z.string(),
    name: keySchema('Flag name'),
    description: z.string(),
    version: z.string(),
    type: z.enum(FLAG_TYPES),
    disabled: z.boolean(),
    trackEvents: z.boolean(),
    variations: z.array(variationSchema).min(1, 'Add at least one variation'),
    rules: z.array(ruleSchema),
    defaultRule: serveSchema,
    metadata: z.array(metadataEntrySchema),
  })
  // Checks that need more than one field: unique names, value vs type, serve targets
  .superRefine((flag, ctx) => {
    const seenNames = new Set<string>()
    flag.variations.forEach((variation, index) => {
      if (seenNames.has(variation.name)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Variation name must be unique',
          path: ['variations', index, 'name'],
        })
      }
      seenNames.add(variation.name)

      const parsed = parseVariationValue(flag.type, variation.value)
      if (!parsed.ok) {
        ctx.addIssue({
          code: 'custom',
          message: parsed.error,
          path: ['variations', index, 'value'],
        })
      }
    })

    const variationIds = flag.variations.map((variation) => variation.id)
    flag.rules.forEach((rule, index) => {
      checkServe(rule.serve, variationIds, ['rules', index, 'serve'], ctx)
    })
    checkServe(flag.defaultRule, variationIds, ['defaultRule'], ctx)

    const seenKeys = new Set<string>()
    flag.metadata.forEach((entry, index) => {
      // The Description field already writes metadata.description
      const message =
        entry.key === 'description'
          ? 'Use the Description field instead'
          : seenKeys.has(entry.key)
            ? 'Key must be unique'
            : undefined
      if (message) {
        ctx.addIssue({
          code: 'custom',
          message,
          path: ['metadata', index, 'key'],
        })
      }
      seenKeys.add(entry.key)
    })
  })

/** The whole editor: one or more flags, like a GoFeatureFlag config file. */
export const configSchema = z
  .object({ flags: z.array(flagSchema).min(1, 'Add at least one flag') })
  .superRefine((config, ctx) => {
    const seenNames = new Set<string>()
    config.flags.forEach((flag, index) => {
      if (seenNames.has(flag.name)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Flag name must be unique',
          path: ['flags', index, 'name'],
        })
      }
      seenNames.add(flag.name)
    })
  })

function checkServe(
  serve: Serve,
  variationIds: string[],
  path: (string | number)[],
  ctx: z.RefinementCtx,
) {
  if (serve.type === 'variation') {
    if (!variationIds.includes(serve.variationId)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select a variation',
        path: [...path, 'variationId'],
      })
    }
    return
  }

  // Only count variations that still exist; round to avoid 33.3 + 33.3 + 33.4 float noise
  const total = variationIds.reduce(
    (sum, id) => sum + (serve.percentage[id] ?? 0),
    0,
  )
  const rounded = Math.round(total * 1000) / 1000
  if (rounded !== 100) {
    ctx.addIssue({
      code: 'custom',
      message: `Percentages must add up to 100 (now ${rounded})`,
      path: [...path, 'percentage'],
    })
  }
}

export type Condition = z.infer<typeof conditionSchema>
export type QueryGroup = z.infer<typeof groupSchema>
export type QueryNode = Condition | QueryGroup
export type Serve = z.infer<typeof serveSchema>
export type Variation = z.infer<typeof variationSchema>
export type Rule = z.infer<typeof ruleSchema>
export type MetadataEntry = z.infer<typeof metadataEntrySchema>
export type Flag = z.infer<typeof flagSchema>
export type FlagFormValues = z.infer<typeof configSchema>
