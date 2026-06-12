import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { EmptyState } from '@sentinel/ui'
import { analyzeRepo, type RepoReport } from '@/lib/analyze'
import { GitHubError } from '@/lib/github'
import { normalizeRepoInput, type RepoRef } from '@/lib/normalize'
import { RepoReportView } from '@/components/RepoReportView'

export const metadata: Metadata = {
  title: 'Report',
}

export const dynamic = 'force-dynamic'

function ErrorState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="sheet pt-6 sm:pt-10">
      <EmptyState
        title={title}
        detail={detail}
        action={
          <Link href="/" className="button button-secondary">
            Back to scanner
          </Link>
        }
      />
    </div>
  )
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>
}) {
  const { repo: repoParam } = await searchParams

  if (!repoParam) {
    return (
      <ErrorState
        title="No repository specified"
        detail="Enter a public GitHub repository to generate a report."
      />
    )
  }

  /* input validation — distinct from API failures */
  let ref: RepoRef
  try {
    ref = normalizeRepoInput(repoParam)
  } catch (error) {
    return (
      <ErrorState
        title="Not a valid GitHub repository address"
        detail={
          error instanceof Error
            ? error.message
            : 'Use the form owner/repo or a full GitHub repository URL.'
        }
      />
    )
  }

  let report: RepoReport
  try {
    report = await analyzeRepo(ref)
  } catch (error) {
    if (error instanceof GitHubError) {
      if (error.status === 404) {
        return (
          <ErrorState title="Repository not found" detail={error.message} />
        )
      }
      if (error.status === 403 || error.status === 429) {
        return (
          <ErrorState title="GitHub rate limit reached" detail={error.message} />
        )
      }
      return <ErrorState title="GitHub API error" detail={error.message} />
    }
    /* fetch/network-level failure (DNS, timeout, offline) */
    return (
      <ErrorState
        title="Could not reach GitHub"
        detail="The GitHub API did not respond. Check your network connection and try again — no scan was performed."
      />
    )
  }

  return <RepoReportView report={report} />
}
