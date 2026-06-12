import React from 'react'
import { cn } from '../cn'

/* Mono uppercase metadata label. accent = blue plus-mark variant,
   plain = soft gray, no mark — for table headers and captions. */
export const MetadataLabel: React.FC<{
  children: React.ReactNode
  plain?: boolean
  className?: string
}> = ({ children, plain = false, className }) => (
  <span className={cn(plain ? 'meta-label-plain' : 'meta-label', className)}>
    {children}
  </span>
)

/* Section opener: mono eyebrow + display title + optional hollow numeral. */
export const SectionEyebrow: React.FC<{
  label: string
  title: React.ReactNode
  index?: string
  children?: React.ReactNode
  className?: string
}> = ({ label, title, index, children, className }) => (
  <div
    className={cn('reveal flex items-start justify-between gap-6', className)}
  >
    <div>
      <p className="meta-label">{label}</p>
      <h2 className="mt-5 heading-lg">{title}</h2>
      {children ? <div className="mt-4 copy-sm max-w-2xl">{children}</div> : null}
    </div>
    {index ? (
      <span aria-hidden="true" className="outline-num shrink-0">
        {index}
      </span>
    ) : null}
  </div>
)

/* Flat hairline panel with a titled rule header. The workhorse container
   for scan readouts. */
export const TechnicalPanel: React.FC<{
  title: string
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}> = ({ title, meta, children, className, id }) => (
  <section id={id} className={cn('panel', className)}>
    <header className="panel-head">
      <h3 className="meta-label !text-[color:var(--text)]">{title}</h3>
      {meta ? <div className="meta-label-plain">{meta}</div> : null}
    </header>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
)

/* Panel with accent corner registration ticks — for the highest-priority
   block on a page (hero input, overall score). */
export const BracketPanel: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <div className={cn('panel bracket-frame', className)}>{children}</div>
)

export const EmptyState: React.FC<{
  title: string
  detail: string
  action?: React.ReactNode
  className?: string
}> = ({ title, detail, action, className }) => (
  <div
    className={cn(
      'panel flex flex-col items-center gap-3 px-6 py-14 text-center',
      className
    )}
  >
    <span aria-hidden="true" className="outline-num text-[3rem]">
      ∅
    </span>
    <p className="meta-label-plain">{title}</p>
    <p className="copy-sm max-w-sm">{detail}</p>
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
)

/* Code window with traffic-light dots and a mono filename tab. */
export const CodeSnippet: React.FC<{
  code: string
  label?: string
  className?: string
}> = ({ code, label, className }) => (
  <div className={cn('panel overflow-hidden', className)}>
    <div className="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-2.5">
      <span aria-hidden="true" className="flex gap-1.5">
        <i className="block h-2 w-2 border border-[color:var(--border-strong)]" />
        <i className="block h-2 w-2 border border-[color:var(--border-strong)]" />
        <i className="block h-2 w-2 bg-[color:var(--accent)]" />
      </span>
      {label ? <span className="meta-label-plain">{label}</span> : null}
    </div>
    <pre className="overflow-x-auto px-4 py-4 font-[family-name:var(--font-mono)] text-[0.8rem] leading-relaxed text-[color:var(--text-muted)]">
      <code>{code}</code>
    </pre>
  </div>
)
