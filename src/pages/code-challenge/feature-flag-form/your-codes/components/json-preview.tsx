// Named import: the default export is the whole CJS module during server render
import { Editor } from '@monaco-editor/react'
import {
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CopyIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { useFlagForm } from '../form/form-hook'
import { asFlagValues } from '../form/form-options'
import { getFormIssues } from '../lib/form-issues'
import { toOutput } from '../lib/to-output'
import type { FlagFormValues } from '../schema/flag-schema'

const EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 13,
  tabSize: 2,
  wordWrap: 'on',
  automaticLayout: true,
} as const

/** Inputs use the field name as their id, so an issue can jump to its input. */
function focusField(fieldName: string) {
  // List-level errors (e.g. an empty group) have no input, only their message
  const element =
    document.getElementById(fieldName) ??
    document.getElementById(`${fieldName}-error`)
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element?.focus({ preventScroll: true })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className="text-slate-300 hover:bg-slate-800 hover:text-white"
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => setCopied(true),
          // Clipboard can be blocked (e.g. no permission); the editor text is still selectable
          () => setCopied(false),
        )
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

function PreviewPanel({ values }: { values: FlagFormValues }) {
  const json = useMemo(
    () => JSON.stringify(toOutput(values), null, 2),
    [values],
  )
  const issues = useMemo(() => getFormIssues(values), [values])
  const isValid = issues.length === 0

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
        <span className="font-mono text-xs text-slate-400">flags.json</span>
        <div className="flex items-center gap-2">
          <CopyButton text={json} />
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              isValid
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400',
            )}
          >
            {isValid ? (
              <CircleCheckIcon className="size-3.5" />
            ) : (
              <CircleAlertIcon className="size-3.5" />
            )}
            {isValid
              ? 'Valid'
              : `${issues.length} ${issues.length === 1 ? 'error' : 'errors'}`}
          </span>
        </div>
      </div>

      <Editor
        height="28rem"
        language="json"
        theme="vs-dark"
        value={json}
        options={EDITOR_OPTIONS}
        loading={
          <span className="text-sm text-slate-400">Loading preview…</span>
        }
      />

      {!isValid && (
        <ul
          aria-label="Problems to fix"
          className="max-h-48 divide-y divide-slate-800 overflow-y-auto border-t border-slate-800 text-xs"
        >
          {issues.map((issue) => (
            <li key={`${issue.fieldName}:${issue.message}`}>
              <button
                type="button"
                onClick={() => focusField(issue.fieldName)}
                className="grid w-full gap-0.5 px-4 py-2 text-left hover:bg-slate-900 focus-visible:bg-slate-900 focus-visible:outline-none"
              >
                <span className="text-rose-300">{issue.message}</span>
                <span className="text-slate-400">{issue.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function JsonPreview() {
  const form = useFlagForm()
  // The preview is the one place that needs every value, so only it subscribes to all of them
  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => <PreviewPanel values={asFlagValues(values)} />}
    </form.Subscribe>
  )
}
