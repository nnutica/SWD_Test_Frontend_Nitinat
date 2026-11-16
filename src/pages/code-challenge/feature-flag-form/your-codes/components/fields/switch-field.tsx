import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { useFieldContext } from '../../form/form-context'

interface SwitchFieldProps {
  label: string
  description?: string
}

export function SwitchField({ label, description }: SwitchFieldProps) {
  const field = useFieldContext<boolean>()

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
      <div className="grid gap-0.5">
        <Label htmlFor={field.name}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
      />
    </div>
  )
}
