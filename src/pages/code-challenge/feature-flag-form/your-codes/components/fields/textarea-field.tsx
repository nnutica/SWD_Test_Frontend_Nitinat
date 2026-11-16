import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'
import { useFieldContext } from '../../form/form-context'
import { FieldError, errorA11yProps, getErrorMessage } from './field-error'

interface TextareaFieldProps {
  label: string
  hideLabel?: boolean
  placeholder?: string
  className?: string
  monospace?: boolean
}

export function TextareaField({
  label,
  hideLabel,
  placeholder,
  className,
  monospace,
}: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const error = getErrorMessage(field.state.meta.errors)

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={field.name} className={cn(hideLabel && 'sr-only')}>
        {label}
      </Label>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        placeholder={placeholder}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className={cn('min-h-16', monospace && 'font-mono text-xs')}
        {...errorA11yProps(field.name, error)}
      />
      <FieldError id={`${field.name}-error`} message={error} />
    </div>
  )
}
