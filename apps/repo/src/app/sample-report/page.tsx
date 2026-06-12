import React from 'react'
import type { Metadata } from 'next'
import { demoReport } from '@/lib/demoReport'
import { RepoReportView } from '@/components/RepoReportView'

export const metadata: Metadata = {
  title: 'Sample report',
  description:
    'Example RepoSentinel output for a fictional repository — static demo data, no GitHub API request involved.',
}

export default function SampleReportPage() {
  return <RepoReportView report={demoReport} sample />
}
