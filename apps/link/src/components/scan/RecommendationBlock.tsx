import React from 'react'
import type { Recommendation } from '@/lib/demoScan'
import { CodeSnippet } from '@sentinel/ui'

/* Numbered fix guidance with optional copy-ready snippet. */
export const RecommendationBlock: React.FC<{
  recommendation: Recommendation
  index: number
}> = ({ recommendation, index }) => (
  <article className="grid gap-4 border-t border-[color:var(--border)] py-6 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[3.5rem_1fr] md:gap-6">
    <span
      aria-hidden="true"
      className="outline-num text-[2.4rem] md:text-[3rem]"
    >
      {String(index + 1).padStart(2, '0')}
    </span>
    <div className="min-w-0">
      <h4 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.015em]">
        {recommendation.title}
      </h4>
      <p className="copy-sm mt-2 max-w-2xl">{recommendation.body}</p>
      {recommendation.snippet ? (
        <CodeSnippet
          className="mt-4 max-w-2xl"
          code={recommendation.snippet}
          label={recommendation.snippetLabel}
        />
      ) : null}
      {recommendation.platformSnippets?.length ? (
        <details className="group mt-3 max-w-2xl">
          <summary className="meta-label-plain cursor-pointer select-none list-none transition-colors duration-200 hover:text-[color:var(--accent)]">
            <span className="group-open:hidden">
              + Platform examples ({recommendation.platformSnippets.length})
            </span>
            <span className="hidden group-open:inline">
              − Platform examples
            </span>
          </summary>
          <div className="mt-3 grid gap-3">
            {recommendation.platformSnippets.map((snippet) => (
              <CodeSnippet
                key={snippet.label}
                code={snippet.code}
                label={snippet.label}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  </article>
)
