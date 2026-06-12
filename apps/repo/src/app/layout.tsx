import React from 'react'
import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AppShell } from '@sentinel/ui'
import { TOOL_URLS } from '@sentinel/core'

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'RepoSentinel | GitHub Repository Health Scanner',
    template: '%s | RepoSentinel',
  },
  description:
    'Paste a public GitHub repository URL. RepoSentinel reads metadata, hygiene files, dependency manifests, and risk indicators — then explains what it found in plain English. Read-only, nothing is cloned.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      data-theme="dark"
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">
        <AppShell
          brand={{ tag: 'RS', nameLead: 'Repo', nameAccent: 'Sentinel' }}
          navItems={[
            { href: '/', label: 'Scanner' },
            { href: '/sample-report', label: 'Sample report' },
            { href: TOOL_URLS.hub, label: 'All tools', external: true },
          ]}
          footerName="RepoSentinel"
          footerLinks={[
            { href: TOOL_URLS.hub, label: 'Sentinel Tools', external: true },
            { href: TOOL_URLS.link, label: 'LinkSentinel', external: true },
            { href: TOOL_URLS.file, label: 'FileSentinel', external: true },
          ]}
        >
          {children}
        </AppShell>
      </body>
    </html>
  )
}
