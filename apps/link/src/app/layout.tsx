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
    template: '%s | LinkSentinel',
  },
  description:
    'Paste any link. LinkSentinel traces redirects, grades security headers, inventories cookies and third-party scripts, and explains the risk in plain English.',
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
          brand={{ tag: 'LS', nameLead: 'Link', nameAccent: 'Sentinel' }}
          navItems={[
            { href: '/', label: 'Scanner' },
            { href: '/sample-report', label: 'Sample report' },
            { href: '/learn', label: 'Learn' },
            { href: TOOL_URLS.hub, label: 'All tools', external: true },
          ]}
          footerName="LinkSentinel"
          footerLinks={[
            { href: TOOL_URLS.hub, label: 'Sentinel Tools', external: true },
            {
              href: 'https://www.jeremymhayes.com',
              label: 'Portfolio',
              external: true,
            },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/privacy', label: 'Privacy Policy' },
          ]}
        >
          {children}
        </AppShell>
      </body>
    </html>
  )
}
