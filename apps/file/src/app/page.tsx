import React from 'react'
import { FileAnalyzer } from '@/components/FileAnalyzer'

export default function HomePage() {
  return (
    <div>
      <section className="pt-6 pb-16 sm:pt-10">
        <div className="sheet">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h1 className="anim-mask-line display-title-xl">
              <span className="mask-line">
                <span className="block" style={{ animationDelay: '0.08s' }}>
                  Verify a file without
                </span>
              </span>
              <span className="mask-line">
                <span
                  className="display-em block"
                  style={{ animationDelay: '0.2s' }}
                >
                  uploading it.
                </span>
              </span>
            </h1>

            <p
              className="anim-rise lede mx-auto mt-5 max-w-xl"
              style={{ animationDelay: '0.4s' }}
            >
              Drop any file. FileSentinel computes its hashes in your browser,
              verifies an expected checksum, and flags suspicious traits.
              Nothing leaves your machine.
            </p>
          </div>

          <div
            className="anim-rise mx-auto mt-10 w-full max-w-4xl"
            style={{ animationDelay: '0.55s' }}
          >
            <FileAnalyzer />
          </div>

          <p className="copy-sm mx-auto mt-8 max-w-xl text-center">
            FileSentinel is not an antivirus. It reports hashes, metadata, and
            suspicious indicators — it will never claim a file is
            &ldquo;clean&rdquo; or &ldquo;virus-free&rdquo;.
          </p>
        </div>
      </section>
    </div>
  )
}
