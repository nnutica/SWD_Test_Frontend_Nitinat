import { useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent } from 'react'

// Only one drag runs at a time, and dataTransfer can't be read during dragover,
// so the list and index being dragged are kept here
let activeDrag: { listId: string; from: number } | null = null

interface DragReorderOptions {
  /** Unique per list (the array field name), so items only drop into their own list. */
  listId: string
  count: number
  onMove: (from: number, to: number) => void
}

/** Reorder a list with the HTML5 drag API or the arrow keys, starting from a handle. */
export function useDragReorder({ listId, count, onMove }: DragReorderOptions) {
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const handles = useRef(new Map<number, HTMLElement>())

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= count) return
    onMove(from, to)
    // Items are keyed by index, so the handle now at `to` belongs to the moved item
    requestAnimationFrame(() => handles.current.get(to)?.focus())
  }

  const isOwnDrag = () => activeDrag?.listId === listId

  const handleProps = (index: number) => ({
    draggable: true,
    ref: (element: HTMLElement | null) => {
      if (element) handles.current.set(index, element)
      else handles.current.delete(index)
    },
    onDragStart: (e: DragEvent<HTMLElement>) => {
      e.stopPropagation()
      activeDrag = { listId, from: index }
      e.dataTransfer.effectAllowed = 'move'
      // Firefox only starts a drag when some data is set
      e.dataTransfer.setData('text/plain', '')
      // Show the whole row being dragged, not just the small handle
      const row = e.currentTarget.closest('[data-drag-item]')
      if (row) e.dataTransfer.setDragImage(row, 16, 16)
    },
    onDragEnd: () => {
      activeDrag = null
      setOverIndex(null)
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      move(index, e.key === 'ArrowUp' ? index - 1 : index + 1)
    },
  })

  const itemProps = (index: number) => ({
    'data-drag-item': true,
    onDragOver: (e: DragEvent<HTMLElement>) => {
      // Not calling preventDefault refuses the drop, e.g. a condition over another group
      if (!isOwnDrag()) return
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
      setOverIndex(index)
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      // Moving onto a child element also fires dragleave; only clear when really leaving
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
      setOverIndex((current) => (current === index ? null : current))
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (!activeDrag || !isOwnDrag()) return
      e.preventDefault()
      e.stopPropagation()
      const { from } = activeDrag
      activeDrag = null
      setOverIndex(null)
      move(from, index)
    },
  })

  return { handleProps, itemProps, overIndex }
}

export type DragHandleProps = ReturnType<
  ReturnType<typeof useDragReorder>['handleProps']
>
