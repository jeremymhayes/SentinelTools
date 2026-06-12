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
    default: 'Sentinel Tools | Practical Security Checks',
    template: '%s | Sentinel Tools',
  },
  description:
    'Practical security tools for links, repositories, and files. Scan a URL, audit a public GitHub repo, or verify a file. Plain-English reports, no accounts.',
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
          brand={{ tag: 'ST', nameLead: 'Sentinel', nameAccent: 'Tools' }}
          navItems={[
            { href: '/', label: 'Tools' },
            { href: '/about', label: 'About' },
            { href: TOOL_URLS.link, label: 'LinkSentinel', external: true },
          ]}
          footerName="Sentinel Tools"
          footerLinks={[
            {
              href: 'https://www.jeremymhayes.com',
              label: 'Portfolio',
              external: true,
            },
            { href: TOOL_URLS.link, label: 'LinkSentinel', external: true },
            { href: TOOL_URLS.repo, label: 'RepoSentinel', external: true },
            { href: TOOL_URLS.file, label: 'FileSentinel', external: true },
          ]}
        >
          {children}
        </AppShell>
      </body>
    </html>
  )
}
