import type { FlagFormValues, Serve, Variation } from '../schema/flag-schema'
import { groupToQuery } from './query-builder'
import { parseVariationValue } from './variation-value'

type ServeOutput =
  | { variation: string }
  | { percentage: Record<string, number> }

type TargetingOutput = { name: string; query: string } & ServeOutput

interface FlagOutput {
  variations: Record<string, unknown>
  targeting?: TargetingOutput[]
  defaultRule: ServeOutput
  disable?: boolean
  trackEvents?: boolean
  version?: string
  metadata?: { description: string }
}

export interface FlagConfigOutput {
  flags: Record<string, FlagOutput>
}

/** Map variation ids back to names, which is what GoFeatureFlag uses. */
export function serveToOutput(
  serve: Serve,
  variations: Variation[],
): ServeOutput {
  if (serve.type === 'variation') {
    const selected = variations.find((v) => v.id === serve.variationId)
    return { variation: selected?.name ?? '' }
  }
  return {
    percentage: Object.fromEntries(
      variations.map((v) => [v.name, serve.percentage[v.id] ?? 0]),
    ),
  }
}

/** Convert form values to the GoFeatureFlag config shown in the preview. */
export function toOutput(values: FlagFormValues): FlagConfigOutput {
  const variations = Object.fromEntries(
    values.variations.map((v) => {
      const parsed = parseVariationValue(values.type, v.value)
      // Keep the raw text while it is invalid so the preview still shows it
      return [v.name, parsed.ok ? parsed.value : v.value]
    }),
  )

  const targeting = values.rules.map((rule) => ({
    name: rule.name,
    query: groupToQuery(rule.query),
    ...serveToOutput(rule.serve, values.variations),
  }))
  const version = values.version.trim()
  const description = values.description.trim()

  // Like the GoFeatureFlag editor, fields equal to their default are undefined,
  // and JSON.stringify drops undefined keys from the preview.
  const flag: FlagOutput = {
    variations,
    targeting: targeting.length > 0 ? targeting : undefined,
    defaultRule: serveToOutput(values.defaultRule, values.variations),
    disable: values.disabled ? true : undefined,
    trackEvents: values.trackEvents ? undefined : false,
    version: version || undefined,
    metadata: description ? { description } : undefined,
  }

  return { flags: { [values.name]: flag } }
}
