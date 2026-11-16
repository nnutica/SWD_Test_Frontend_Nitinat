import { getBy, useStore } from '@tanstack/react-form'
import { PercentIcon } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { useFlagForm } from '../form/form-hook'
import type { FlagPath, ServePath } from '../form/field-paths'
import { evenSplit } from '../lib/defaults'
import { variationColor } from '../lib/variation-colors'
import type { Serve, Variation } from '../schema/flag-schema'
import {
  FieldError,
  errorA11yProps,
  getErrorMessage,
} from './fields/field-error'

// Not a valid variation id, so it can share the select with the variations
const PERCENTAGE_OPTION = '__percentage__'

type VariationOption = Pick<Variation, 'id' | 'name'>

/** Re-render serve fields only when a variation is added, removed or renamed. */
const sameVariations = (a: VariationOption[], b: VariationOption[]) =>
  a.length === b.length &&
  a.every((v, i) => v.id === b[i].id && v.name === b[i].name)

const variationLabel = (variation: VariationOption, index: number) =>
  variation.name || `Variation ${index + 1}`

function VariationDot({ index }: { index: number }) {
  return (
    <span
      aria-hidden
      className={cn('size-2.5 shrink-0 rounded-full', variationColor(index))}
    />
  )
}

interface PercentageInputsProps {
  path: ServePath
  variations: VariationOption[]
}

function PercentageInputs({ path, variations }: PercentageInputsProps) {
  const form = useFlagForm()

  return (
    <form.Field name={`${path}.percentage`}>
      {(field) => {
        const percentage = field.state.value
        const total = variations.reduce(
          (sum, v) => sum + (percentage[v.id] ?? 0),
          0,
        )
        const error = getErrorMessage(field.state.meta.errors)

        return (
          <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3">
            {variations.map((variation, index) => {
              // The first input carries the field name so the error list can focus it
              const inputId =
                index === 0 ? field.name : `${field.name}.${variation.id}`
              return (
                <div
                  key={variation.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_7rem] items-center gap-3"
                >
                  <VariationDot index={index} />
                  <Label htmlFor={inputId} className="truncate font-normal">
                    {variationLabel(variation, index)}
                  </Label>
                  <div className="relative">
                    <Input
                      id={inputId}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={100}
                      step="any"
                      value={percentage[variation.id] ?? 0}
                      onChange={(e) => {
                        // Clamp instead of erroring: 0-100 is the only sensible range
                        const next = Math.min(
                          100,
                          Math.max(0, e.target.valueAsNumber || 0),
                        )
                        field.handleChange({
                          ...percentage,
                          [variation.id]: next,
                        })
                      }}
                      onBlur={field.handleBlur}
                      className="pr-7 text-right"
                      {...errorA11yProps(field.name, error)}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span
                className={cn(
                  'font-medium tabular-nums',
                  error
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400',
                )}
              >
                {Math.round(total * 1000) / 1000}%
              </span>
            </div>
            <FieldError id={`${field.name}-error`} message={error} />
          </div>
        )
      }}
    </form.Field>
  )
}

interface ServeFieldProps {
  path: ServePath
  /** The flag whose variations can be served. */
  flagPath: FlagPath
}

/** Pick one variation or split traffic by percentage, like GoFeatureFlag's "Serve". */
export function ServeField({ path, flagPath }: ServeFieldProps) {
  const form = useFlagForm()
  const variations = useStore(
    form.store,
    (state) =>
      (getBy(state.values, `${flagPath}.variations`) as Variation[]).map(
        ({ id, name }) => ({ id, name }),
      ),
    sameVariations,
  )
  const type = useStore(
    form.store,
    (state) => getBy(state.values, `${path}.type`) as Serve['type'],
  )

  return (
    <div className="grid gap-3">
      <form.Field name={`${path}.variationId`}>
        {(field) => {
          const error =
            type === 'variation'
              ? getErrorMessage(field.state.meta.errors)
              : undefined
          const exists = variations.some((v) => v.id === field.state.value)
          // An empty value shows the placeholder, e.g. after the variation was removed
          const selected =
            type === 'percentage'
              ? PERCENTAGE_OPTION
              : exists
                ? field.state.value
                : ''

          return (
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <Label htmlFor={field.name}>Serve</Label>
                <Select
                  value={selected}
                  onValueChange={(value) => {
                    if (value === PERCENTAGE_OPTION) {
                      // Start from an even split rather than an instant "0%" error,
                      // but keep numbers the user already typed
                      const ids = variations.map((v) => v.id)
                      const current = form.getFieldValue(`${path}.percentage`)
                      if (ids.every((id) => !current[id])) {
                        form.setFieldValue(`${path}.percentage`, evenSplit(ids))
                      }
                      form.setFieldValue(`${path}.type`, 'percentage')
                      return
                    }
                    form.setFieldValue(`${path}.type`, 'variation')
                    field.handleChange(value)
                  }}
                >
                  <SelectTrigger
                    id={field.name}
                    className="w-full sm:w-64"
                    {...errorA11yProps(field.name, error)}
                  >
                    <SelectValue placeholder="Select a variation" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="top">
                    <SelectGroup>
                      <SelectLabel>Variation</SelectLabel>
                      {variations.map((variation, index) => (
                        <SelectItem key={variation.id} value={variation.id}>
                          <VariationDot index={index} />
                          {variationLabel(variation, index)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectItem value={PERCENTAGE_OPTION}>
                      <PercentIcon className="text-sky-500" />a percentage
                      rollout
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FieldError id={`${field.name}-error`} message={error} />
            </div>
          )
        }}
      </form.Field>

      {type === 'percentage' && (
        <PercentageInputs path={path} variations={variations} />
      )}
    </div>
  )
}
