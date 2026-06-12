import React from 'react'
import type { Metadata } from 'next'
import { SectionEyebrow, TechnicalPanel } from '@sentinel/ui'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <div className="sheet pt-6 sm:pt-10">
      <SectionEyebrow
        label="About"
        title={
          <>
            Small tools for a<span className="display-em"> careful web.</span>
          </>
        }
      >
        Sentinel Tools is a suite of focused, single-purpose security
        utilities built by Jeremy Hayes. Each one does a narrow job well and
        reports honestly about what it can and cannot see.
      </SectionEyebrow>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <TechnicalPanel title="What these tools are">
          <p className="copy-sm">
            Quick first-pass checks. LinkSentinel inspects URLs before you
            click. RepoSentinel reads the public surface of a GitHub
            repository before you clone. FileSentinel verifies files on your
            own machine before you open them. All three produce plain-English
            reports with an explainable score.
          </p>
        </TechnicalPanel>
        <TechnicalPanel title="What these tools are not">
          <p className="copy-sm">
            Not an antivirus, not a penetration test, not a guarantee. A
            passing report means no obvious issues were detected by these
            checks — nothing more. Treat the reports as one input to your own
            judgment, not a substitute for it.
          </p>
        </TechnicalPanel>
      </div>
    </div>
  )
}
