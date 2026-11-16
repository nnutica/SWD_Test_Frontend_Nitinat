// Full class names so Tailwind can find them when scanning the source
const VARIATION_COLORS = [
  'bg-emerald-400',
  'bg-orange-400',
  'bg-rose-500',
  'bg-sky-400',
  'bg-violet-400',
  'bg-amber-300',
]

/** Dot color for a variation, so it is easy to spot in serve selects too. */
export const variationColor = (index: number) =>
  VARIATION_COLORS[index % VARIATION_COLORS.length]
