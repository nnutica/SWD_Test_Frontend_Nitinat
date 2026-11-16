/** First message from a field's errors (Zod issues or plain strings). */
export function getErrorMessage(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message)
    }
  }
  return undefined
}

interface FieldErrorProps {
  id: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null
  return (
    // tabIndex -1: the issue list can focus a message that has no input (e.g. an empty group)
    <p
      id={id}
      role="alert"
      tabIndex={-1}
      className="text-xs text-destructive outline-none"
    >
      {message}
    </p>
  )
}

/** Props that link an input to its error message for screen readers. */
export const errorA11yProps = (name: string, message?: string) => ({
  'aria-invalid': message ? true : undefined,
  'aria-describedby': message ? `${name}-error` : undefined,
})
