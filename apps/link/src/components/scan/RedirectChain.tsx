import React from 'react'
import { ArrowDown, Lock, LockOpen } from 'lucide-react'
import type { RedirectHop } from '@/lib/demoScan'
import { cn } from '@sentinel/ui'

/* Vertical hop trace: mono URLs, status codes, protocol locks.
   Insecure hops get the danger color — a scan-result context. */
export const RedirectChain: React.FC<{ hops: RedirectHop[] }> = ({ hops }) => (
  <ol className="grid gap-0">
    {hops.map((hop, i) => {
      const insecure = hop.protocol === 'http'
      const last = i === hops.length - 1
      return (
        <li key={hop.url + i} className="grid grid-cols-[auto_1fr] gap-x-4">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center border font-[family-name:var(--font-mono)] text-[0.65rem]',
                insecure
                  ? 'sev-critical border-[color:var(--sev)] text-[color:var(--sev)]'
                  : 'border-[color:var(--border-strong)] text-[color:var(--text-muted)]'
              )}
            >
              {String(i).padStart(2, '0')}
            </span>
            {!last ? (
              <span className="my-1 flex flex-1 flex-col items-center">
                <span className="w-px flex-1 bg-[color:var(--border)]" />
                <ArrowDown
                  aria-hidden="true"
                  size={11}
                  className="text-[color:var(--text-soft)]"
                />
              </span>
            ) : null}
          </div>

          <div className={cn('min-w-0', !last && 'pb-5')}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {insecure ? (
                <LockOpen
                  aria-label="Insecure HTTP"
                  size={13}
                  className="sev-critical shrink-0 text-[color:var(--sev)]"
                />
              ) : (
                <Lock
                  aria-label="HTTPS"
                  size={13}
                  className="sev-ok shrink-0 text-[color:var(--sev)]"
                />
              )}
              <code
                className={cn(
                  'truncate font-[family-name:var(--font-mono)] text-[0.85rem]',
                  insecure
                    ? 'sev-critical text-[color:var(--sev)]'
                    : 'text-[color:var(--text)]'
                )}
              >
                {hop.url}
              </code>
            </div>
            <p className="meta-label-plain mt-1.5">
              {hop.status} {hop.note ? `· ${hop.note}` : ''}
            </p>
          </div>
        </li>
      )
    })}
  </ol>
)
