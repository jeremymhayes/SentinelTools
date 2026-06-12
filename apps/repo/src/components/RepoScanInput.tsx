'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ScanInput } from '@sentinel/ui'
import { normalizeRepoInput } from '@/lib/normalize'

/* App-specific wrapper: validates owner/repo input, routes to /report. */
export const RepoScanInput: React.FC<{ autoFocus?: boolean }> = ({
  autoFocus = false,
}) => {
  const router = useRouter()

  return (
    <ScanInput
      autoFocus={autoFocus}
      prefix="github.com/"
      placeholder="owner/repo — e.g. vercel/next.js"
      validate={(value) => {
        try {
          normalizeRepoInput(value)
          return null
        } catch (error) {
          return error instanceof Error
            ? error.message
            : 'Enter a valid GitHub repository.'
        }
      }}
      onSubmit={(value) => {
        const ref = normalizeRepoInput(value)
        router.push(
          `/report?repo=${encodeURIComponent(`${ref.owner}/${ref.repo}`)}`
        )
      }}
    />
  )
}
