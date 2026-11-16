import type {
  Flag,
  FlagFormValues,
  Serve,
  Variation,
} from '../schema/flag-schema'
import { groupToQuery } from './query-builder'
import { parseVariationValue } from './variation-value'

type ServeOutput =
  | { variation: string }
  | { percentage: Record<string, number> }

type TargetingOutput = { name: string; query: string } & ServeOutput

export interface FlagOutput {
  variations: Record<string, unknown>
  targeting?: TargetingOutput[]
  defaultRule: ServeOutput
  disable?: boolean
  trackEvents?: boolean
  version?: string
  metadata?: Record<string, string>
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

/** Description plus the free key/value entries, as GoFeatureFlag's `metadata`. */
function metadataToOutput(flag: Flag): Record<string, string> | undefined {
  const description = flag.description.trim()
  const metadata = {
    ...(description ? { description } : {}),
    ...Object.fromEntries(flag.metadata.map((e) => [e.key, e.value])),
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined
}

/** One flag in GoFeatureFlag's config format. */
export function flagToOutput(flag: Flag): FlagOutput {
  const variations = Object.fromEntries(
    flag.variations.map((v) => {
      const parsed = parseVariationValue(flag.type, v.value)
      // Keep the raw text while it is invalid so the preview still shows it
      return [v.name, parsed.ok ? parsed.value : v.value]
    }),
  )

  const targeting = flag.rules.map((rule) => ({
    name: rule.name,
    query: groupToQuery(rule.query),
    ...serveToOutput(rule.serve, flag.variations),
  }))
  const version = flag.version.trim()

  // Like the GoFeatureFlag editor, fields equal to their default are undefined,
  // and JSON.stringify drops undefined keys from the preview.
  return {
    variations,
    targeting: targeting.length > 0 ? targeting : undefined,
    defaultRule: serveToOutput(flag.defaultRule, flag.variations),
    disable: flag.disabled ? true : undefined,
    trackEvents: flag.trackEvents ? undefined : false,
    version: version || undefined,
    metadata: metadataToOutput(flag),
  }
}

/** Convert form values to the GoFeatureFlag config shown in the preview. */
export function toOutput(values: FlagFormValues): FlagConfigOutput {
  return {
    flags: Object.fromEntries(
      values.flags.map((flag) => [flag.name, flagToOutput(flag)]),
    ),
  }
}
