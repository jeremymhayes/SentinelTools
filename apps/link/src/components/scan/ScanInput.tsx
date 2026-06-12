'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ScanInput as SharedScanInput } from '@sentinel/ui'
import { normalizeScanUrl } from '@/lib/scanner/normalize'

/* LinkSentinel wrapper around the shared terminal-style input:
   URL validation + route to /report. Same export name and path as the
   original local component, so page imports stay unchanged. */
export const ScanInput: React.FC<{
  size?: 'default' | 'compact'
  className?: string
  autoFocus?: boolean
}> = ({ size = 'default', className, autoFocus = false }) => {
  const router = useRouter()

  return (
    <SharedScanInput
      size={size}
      className={className}
      autoFocus={autoFocus}
      prefix="https://"
      placeholder={
        size === 'compact'
          ? 'scan another url…'
          : 'paste any link — e.g. example-shop.io/checkout'
      }
      validate={(value) => {
        try {
          normalizeScanUrl(value)
          return null
        } catch (error) {
          return error instanceof Error ? error.message : 'Enter a valid URL.'
        }
      }}
      onSubmit={(value) => {
        const target = normalizeScanUrl(value)
        router.push(`/report?url=${encodeURIComponent(target.toString())}`)
      }}
    />
  )
}
