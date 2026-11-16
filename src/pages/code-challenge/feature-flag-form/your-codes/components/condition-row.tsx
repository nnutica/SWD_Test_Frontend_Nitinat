import { getBy, useStore } from '@tanstack/react-form'
import { MinusIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useFlagForm } from '../form/form-hook'
import type { ConditionPath } from '../form/field-paths'
import type { DragHandleProps } from '../hooks/use-drag-reorder'
import {
  OPERATOR_LABELS,
  OPERATOR_VALUES,
  isUnaryOperator,
} from '../lib/operators'
import type { Operator } from '../lib/operators'
import { DragHandle } from './drag-handle'

const OPERATOR_OPTIONS = OPERATOR_VALUES.map((value) => ({
  value,
  label: OPERATOR_LABELS[value],
}))

const valuePlaceholder = (operator: Operator) => {
  if (isUnaryOperator(operator)) return 'No value needed'
  if (operator === 'in') return 'a, b, c'
  return 'Value'
}

interface ConditionRowProps {
  path: ConditionPath
  onRemove: () => void
  dragHandle: DragHandleProps
}

export function ConditionRow({
  path,
  onRemove,
  dragHandle,
}: ConditionRowProps) {
  const form = useFlagForm()
  // Only the operator decides how the value input looks
  const operator = useStore(
    form.store,
    (state) => getBy(state.values, `${path}.operator`) as Operator,
  )

  return (
    <div className="flex items-start gap-2">
      <DragHandle label="Condition" {...dragHandle} />
      <div className="grid flex-1 items-start gap-2 sm:grid-cols-3">
        <form.AppField name={`${path}.field`}>
          {(field) => (
            <field.TextField label="Field" hideLabel placeholder="Field" />
          )}
        </form.AppField>
        <form.AppField name={`${path}.operator`}>
          {(field) => (
            <field.SelectField
              label="Operator"
              hideLabel
              options={OPERATOR_OPTIONS}
            />
          )}
        </form.AppField>
        <form.AppField name={`${path}.value`}>
          {(field) => (
            <field.TextField
              label="Value"
              hideLabel
              placeholder={valuePlaceholder(operator)}
              disabled={isUnaryOperator(operator)}
            />
          )}
        </form.AppField>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="mt-0.5"
        aria-label="Remove condition"
        onClick={onRemove}
      >
        <MinusIcon />
      </Button>
    </div>
  )
}
