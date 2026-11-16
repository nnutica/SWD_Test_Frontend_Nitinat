import type { ComponentProps } from 'react'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'
import { useFieldContext } from '../../form/form-context'
import { FieldError, errorA11yProps, getErrorMessage } from './field-error'

interface TextFieldProps extends Pick<
  ComponentProps<'input'>,
  'placeholder' | 'inputMode' | 'className'
> {
  label: string
  hideLabel?: boolean
}

export function TextField({
  label,
  hideLabel,
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>()
  const error = getErrorMessage(field.state.meta.errors)

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={field.name} className={cn(hideLabel && 'sr-only')}>
        {label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        {...errorA11yProps(field.name, error)}
        {...inputProps}
      />
      <FieldError id={`${field.name}-error`} message={error} />
    </div>
  )
}
