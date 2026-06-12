import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { MetadataLabel } from './Primitives'
import { cn } from '../cn'

/* Suite card: mono tag, serif title, check inventory, hairline CTA.
   Used on the hub to present each Sentinel tool. */
export const ToolCard: React.FC<{
  tag: string
  name: string
  tagline: string
  description: string
  checks: string[]
  href: string
  status?: 'live' | 'preview'
  className?: string
}> = ({
  tag,
  name,
  tagline,
  description,
  checks,
  href,
  status = 'live',
  className,
}) => (
  <article className={cn('panel flex flex-col', className)}>
    <header className="panel-head">
      <MetadataLabel>[{tag}]</MetadataLabel>
      <span className="chip">{status === 'live' ? 'Live' : 'Preview'}</span>
    </header>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.015em]">
        {name}
      </h3>
      <p className="meta-label-plain mt-2">{tagline}</p>
      <p className="copy-sm mt-4">{description}</p>
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {checks.map((check) => (
          <li key={check} className="meta-label-plain flex items-center gap-2">
            <span
              aria-hidden="true"
              className="block h-1.5 w-1.5 bg-[color:var(--accent)]"
            />
            {check}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <a
          href={href}
          className="button button-secondary w-full"
        >
          Open {name}
          <ArrowUpRight aria-hidden="true" size={14} />
        </a>
      </div>
    </div>
  </article>
)
