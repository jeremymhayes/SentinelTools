import type { Metadata } from 'next'
import ScanPage from '../scan/page'

export const metadata: Metadata = {
  title: 'Sample report',
}

export default async function SampleReportPage() {
  return ScanPage({ searchParams: Promise.resolve({}) })
}
