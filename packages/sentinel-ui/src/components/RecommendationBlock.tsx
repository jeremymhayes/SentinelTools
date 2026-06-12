import React from 'react'
import { CodeSnippet } from './Primitives'

export interface Recommendation {
  title: string
  body: string
  snippet?: string
  snippetLabel?: string
}

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
    </div>
  </article>
)
