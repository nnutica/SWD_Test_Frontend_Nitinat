export const FLAG_TYPES = ['boolean', 'string', 'number', 'json'] as const

export type FlagType = (typeof FLAG_TYPES)[number]

type ParseResult = { ok: true; value: unknown } | { ok: false; error: string }

/** Turn the text typed in a variation input into a value of the flag's type. */
export function parseVariationValue(type: FlagType, raw: string): ParseResult {
  switch (type) {
    case 'boolean':
      if (raw === 'true' || raw === 'false') {
        return { ok: true, value: raw === 'true' }
      }
      return { ok: false, error: 'Must be true or false' }
    case 'number': {
      // Number('') is 0, so empty input needs its own check
      const value = Number(raw)
      if (raw.trim() !== '' && Number.isFinite(value)) {
        return { ok: true, value }
      }
      return { ok: false, error: 'Must be a number' }
    }
    case 'json':
      try {
        return { ok: true, value: JSON.parse(raw) }
      } catch {
        return { ok: false, error: 'Must be valid JSON' }
      }
    case 'string':
      return { ok: true, value: raw }
  }
}
