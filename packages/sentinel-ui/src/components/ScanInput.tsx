'use client'

import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '../cn'

/* Primary product action: terminal-style input strip.
   Mono prefix, hairline strip, plate-shadow submit. Generic across tools —
   the host app supplies validation and submit behavior. */
export const ScanInput: React.FC<{
  placeholder: string
  buttonLabel?: string
  pendingLabel?: string
  prefix?: string
  size?: 'default' | 'compact'
  className?: string
  autoFocus?: boolean
  /** Return an error string to block submit, or null to accept. */
  validate?: (value: string) => string | null
  onSubmit: (value: string) => void
}> = ({
  placeholder,
  buttonLabel = 'Scan',
  pendingLabel = 'Scanning',
  prefix,
  size = 'default',
  className,
  autoFocus = false,
  validate,
  onSubmit,
}) => {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (validate) {
      const validationError = validate(value)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    setError(null)
    setPending(true)
    onSubmit(value)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full', className)}
      role="search"
      aria-label={placeholder}
    >
      <div className="scan-strip">
        {prefix ? (
          <span
            aria-hidden="true"
            className="hidden select-none items-center border-r border-[color:var(--border)] px-3.5 font-[family-name:var(--font-mono)] text-[0.82rem] text-[color:var(--text-soft)] sm:flex"
          >
            {prefix}
          </span>
        ) : null}
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'scan-input-error' : undefined}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            if (error) setError(null)
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            'button button-primary m-1.5 shrink-0 disabled:opacity-60',
            size === 'compact' && 'min-h-0 px-3.5 py-2 text-[0.74rem]'
          )}
        >
          {pending ? (
            <span className="caret-blink">{pendingLabel}</span>
          ) : (
            <>
              {buttonLabel}
              <ArrowRight aria-hidden="true" size={14} />
            </>
          )}
        </button>
      </div>
      {error ? (
        <p
          id="scan-input-error"
          className="mt-2 font-[family-name:var(--font-mono)] text-[0.75rem] text-[color:var(--critical)]"
        >
          {error}
        </p>
      ) : null}
    </form>
  )
}
