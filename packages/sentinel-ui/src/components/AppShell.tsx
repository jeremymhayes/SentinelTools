import React from 'react'
import { SiteHeader, type BrandConfig, type NavItem } from './SiteHeader'
import { SiteFooter, type FooterLink } from './SiteFooter'

/* Shared chrome: fixed header, padded main, byline footer. */
export const AppShell: React.FC<{
  brand: BrandConfig
  navItems: NavItem[]
  footerName: string
  footerLinks?: FooterLink[]
  children: React.ReactNode
}> = ({ brand, navItems, footerName, footerLinks, children }) => (
  <>
    <SiteHeader brand={brand} navItems={navItems} />
    <main className="min-h-screen pb-20 pt-24">{children}</main>
    <SiteFooter appName={footerName} links={footerLinks} />
  </>
)
