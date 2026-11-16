import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { useDragReorder } from '../hooks/use-drag-reorder'
import type { DragHandleProps } from '../hooks/use-drag-reorder'

interface SortableListProps {
  /** Unique per list (the array field name), so items only drop into their own list. */
  listId: string
  count: number
  onMove: (from: number, to: number) => void
  renderItem: (index: number, dragHandle: DragHandleProps) => ReactNode
  className?: string
}

/** A list whose items can be reordered by drag and drop or the keyboard. */
export function SortableList({
  listId,
  count,
  onMove,
  renderItem,
  className,
}: SortableListProps) {
  const { handleProps, itemProps, overIndex } = useDragReorder({
    listId,
    count,
    onMove,
  })

  return (
    <div className={className}>
      {/* Index keys: field names are index-based, see NOTES.md */}
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          {...itemProps(index)}
          className={cn(
            'rounded-lg transition-shadow',
            overIndex === index && 'ring-2 ring-primary/40',
          )}
        >
          {renderItem(index, handleProps(index))}
        </div>
      ))}
    </div>
  )
}
