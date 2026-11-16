import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { useFieldContext } from '../../form/form-context'
import { FieldError, errorA11yProps, getErrorMessage } from './field-error'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  hideLabel?: boolean
  options: readonly SelectOption[]
  className?: string
}

export function SelectField({
  label,
  hideLabel,
  options,
  className,
}: SelectFieldProps) {
  const field = useFieldContext<string>()
  const error = getErrorMessage(field.state.meta.errors)

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={field.name} className={cn(hideLabel && 'sr-only')}>
        {label}
      </Label>
      <Select value={field.state.value} onValueChange={field.handleChange}>
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          className="w-full"
          {...errorA11yProps(field.name, error)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={`${field.name}-error`} message={error} />
    </div>
  )
}
