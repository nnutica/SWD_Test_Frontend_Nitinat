import { getBy, useStore } from '@tanstack/react-form'
import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { useFlagForm } from '../form/form-hook'
import type { GroupPath } from '../form/field-paths'
import { createCondition, createGroup } from '../lib/defaults'
import type { QueryNode } from '../schema/flag-schema'
import type { DragHandleProps } from '../hooks/use-drag-reorder'
import { ConditionRow } from './condition-row'
import { DragHandle } from './drag-handle'
import { FieldError, getErrorMessage } from './fields/field-error'
import { SortableList } from './sortable-list'

const COMBINATOR_OPTIONS = [
  { value: 'and', label: 'AND' },
  { value: 'or', label: 'OR' },
]

/** Same ids and kinds in the same order: typing inside a child doesn't count as a change. */
const sameStructure = (a: QueryNode[], b: QueryNode[]) =>
  a.length === b.length &&
  a.every((node, i) => node.id === b[i].id && node.kind === b[i].kind)

interface ConditionGroupProps {
  path: GroupPath
  depth: number
  /** Missing for a rule's top-level group, which can't be removed or moved. */
  onRemove?: () => void
  dragHandle?: DragHandleProps
}

/** A group of conditions and nested groups; renders itself for each nested group. */
export function ConditionGroup({
  path,
  depth,
  onRemove,
  dragHandle,
}: ConditionGroupProps) {
  const form = useFlagForm()
  const childrenPath = `${path}.children` as const
  // Re-render only when children are added, removed or reordered
  const children = useStore(
    form.store,
    (state) => getBy(state.values, childrenPath) as QueryNode[],
    sameStructure,
  )

  return (
    <form.Field name={childrenPath} mode="array">
      {(childrenField) => {
        // pushValue can't type an unknown[] field, so append with an updater instead
        const addNode = (node: QueryNode) =>
          childrenField.handleChange((prev: unknown) => [
            ...(prev as QueryNode[]),
            node,
          ])
        const error = getErrorMessage(childrenField.state.meta.errors)

        return (
          <div
            role="group"
            aria-label={depth === 0 ? 'Conditions' : 'Nested group'}
            className={cn(
              'grid gap-3 rounded-lg border p-3',
              depth % 2 === 0 ? 'bg-background' : 'bg-muted/40',
              error ? 'border-destructive/60' : 'border-border',
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              {dragHandle && <DragHandle label="Group" {...dragHandle} />}
              <form.AppField name={`${path}.combinator`}>
                {(field) => (
                  <field.SelectField
                    label="Match"
                    hideLabel
                    options={COMBINATOR_OPTIONS}
                    className="w-24"
                  />
                )}
              </form.AppField>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addNode(createCondition())}
              >
                <PlusIcon />
                Condition
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addNode(createGroup())}
              >
                <PlusIcon />
                Group
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label="Remove group"
                  onClick={onRemove}
                >
                  <XIcon />
                </Button>
              )}
            </div>

            {children.length > 0 && (
              <SortableList
                listId={childrenPath}
                count={children.length}
                onMove={(from, to) => childrenField.moveValue(from, to)}
                className="grid gap-2"
                renderItem={(index, handle) => {
                  const nodePath = `${path}.children[${index}]` as const
                  const remove = () => childrenField.removeValue(index)
                  return children[index].kind === 'group' ? (
                    <ConditionGroup
                      path={nodePath}
                      depth={depth + 1}
                      onRemove={remove}
                      dragHandle={handle}
                    />
                  ) : (
                    <ConditionRow
                      path={nodePath}
                      onRemove={remove}
                      dragHandle={handle}
                    />
                  )
                }}
              />
            )}

            <FieldError id={`${childrenPath}-error`} message={error} />
          </div>
        )
      }}
    </form.Field>
  )
}
