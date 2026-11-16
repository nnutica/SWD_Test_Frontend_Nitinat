import { GripVerticalIcon } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { DragHandleProps } from '../hooks/use-drag-reorder'

interface DragHandleComponentProps extends DragHandleProps {
  label: string
  className?: string
}

/** Grip to drag an item, or focus it and press ↑/↓ to move it. */
export function DragHandle({
  label,
  className,
  ...handleProps
}: DragHandleComponentProps) {
  return (
    // A div, not a <button>: Firefox can't start a drag from a button
    <div
      role="button"
      tabIndex={0}
      aria-label={`${label}. Drag, or use the arrow keys, to reorder`}
      aria-keyshortcuts="ArrowUp ArrowDown"
      className={cn(
        'flex h-8 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing',
        className,
      )}
      {...handleProps}
    >
      <GripVerticalIcon className="size-4" />
    </div>
  )
}
