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
    default: 'Home',
    template: '%s | FileSentinel',
  },
  description:
    'Drop a file. FileSentinel computes SHA-256, SHA-1, and MD5 hashes locally in your browser, verifies expected checksums, and flags suspicious traits. Nothing is uploaded.',
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
          brand={{ tag: 'FS', nameLead: 'File', nameAccent: 'Sentinel' }}
          navItems={[
            { href: '/', label: 'Checker' },
            { href: TOOL_URLS.hub, label: 'All tools', external: true },
          ]}
          footerName="FileSentinel"
          footerLinks={[
            { href: TOOL_URLS.hub, label: 'Sentinel Tools', external: true },
            { href: TOOL_URLS.link, label: 'LinkSentinel', external: true },
            { href: TOOL_URLS.repo, label: 'RepoSentinel', external: true },
          ]}
        >
          {children}
        </AppShell>
      </body>
    </html>
  )
}
