'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../cn'

export interface BrandConfig {
  /** Bracket wordmark tag, e.g. "ST", "RS", "FS". Rendered as [TAG]. */
  tag: string
  /** White part of the split wordmark, e.g. "Repo". */
  nameLead: string
  /** Blue part of the split wordmark, e.g. "Sentinel". */
  nameAccent: string
}

export interface NavItem {
  href: string
  label: string
  /** External links render as plain anchors and skip active-state logic. */
  external?: boolean
}

/* Fixed top chrome: bracket wordmark + mono uppercase nav.
   Border fades in once the page scrolls. */
export const SiteHeader: React.FC<{
  brand: BrandConfig
  navItems: NavItem[]
}> = ({ brand, navItems }) => {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200',
        scrolled
          ? 'border-[color:var(--border)] bg-[color:var(--bg)]/90 backdrop-blur-sm'
          : 'border-transparent'
      )}
    >
      <div className="sheet-wide flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-baseline gap-2 sm:gap-2.5"
          aria-label={`${brand.nameLead}${brand.nameAccent} home`}
        >
          <span className="font-[family-name:var(--font-mono)] text-sm font-bold tracking-[0.08em] text-[color:var(--accent)]">
            [{brand.tag}]
          </span>
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-[-0.01em] text-[color:var(--text)] sm:text-lg">
            {brand.nameLead}
            <span className="text-[color:var(--accent)]">
              {brand.nameAccent}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-7">
          {navItems.map((item) => {
            const active =
              !item.external &&
              (item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href))
            const linkClass = cn(
              'link-underline font-[family-name:var(--font-mono)] text-[0.68rem] uppercase tracking-[0.08em] sm:text-[0.78rem] sm:tracking-[0.12em]',
              active
                ? 'text-[color:var(--accent)]'
                : 'text-[color:var(--text-muted)]'
            )
            return item.external ? (
              <a key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={linkClass}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
