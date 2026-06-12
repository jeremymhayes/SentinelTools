import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import {
  MetadataLabel,
  SectionEyebrow,
  ToolCard,
} from '@sentinel/ui'
import { TOOL_URLS } from '@sentinel/core'

const tools = [
  {
    tag: 'LS',
    name: 'LinkSentinel',
    tagline: 'URL privacy & security scanner',
    description:
      'Paste any link. Traces redirects, grades security headers, inventories cookies and third-party scripts, and explains the risk in plain English.',
    checks: ['Redirects', 'Headers', 'Cookies', 'Scripts'],
    href: TOOL_URLS.link,
  },
  {
    tag: 'RS',
    name: 'RepoSentinel',
    tagline: 'GitHub repository health scanner',
    description:
      'Point it at a public GitHub repository. Reads metadata, community files, dependency manifests, and risk indicators, then reports what it found. Read-only, nothing gets cloned.',
    checks: ['Metadata', 'Hygiene files', 'Dependencies', 'Risk indicators'],
    href: TOOL_URLS.repo,
  },
  {
    tag: 'FS',
    name: 'FileSentinel',
    tagline: 'Local file integrity checker',
    description:
      'Drop a file. Hashes are computed in your browser, so nothing is uploaded. Verify an expected checksum, inspect metadata, and flag suspicious traits.',
    checks: ['SHA-256', 'Hash compare', 'Metadata', 'Suspicious traits'],
    href: TOOL_URLS.file,
  },
]

const principles = [
  {
    title: 'Plain English over jargon',
    body: 'Every finding says what was checked, why it matters, and what to do about it. No acronym soup without an explanation attached.',
  },
  {
    title: 'Honest language',
    body: 'No tool here will ever call something "safe" or "virus-free". The strongest claim you will see is "no obvious issues detected by these checks". That is all a scan can honestly say.',
  },
  {
    title: 'Nothing leaves your machine without saying so',
    body: 'FileSentinel hashes locally in the browser. RepoSentinel only reads public GitHub data. Any future network lookup will ask first.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="pt-6 pb-16 sm:pt-10">
        <div className="sheet">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h1 className="anim-mask-line display-title-xl">
              <span className="mask-line">
                <span className="block" style={{ animationDelay: '0.08s' }}>
                  Check before
                </span>
              </span>
              <span className="mask-line">
                <span
                  className="display-em block"
                  style={{ animationDelay: '0.2s' }}
                >
                  you trust.
                </span>
              </span>
            </h1>
            <p
              className="anim-rise lede mx-auto mt-5 max-w-xl"
              style={{ animationDelay: '0.4s' }}
            >
              Practical security tools for links, repositories, and files.
              Run a scan, read the report in plain English. No accounts,
              nothing uploaded.
            </p>
            <div
              className="anim-rise mt-8 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: '0.55s' }}
            >
              <a href={TOOL_URLS.link} className="button button-primary">
                Open LinkSentinel
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
              <a href={TOOL_URLS.repo} className="button button-secondary">
                Open RepoSentinel
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
              <a href={TOOL_URLS.file} className="button button-secondary">
                Open FileSentinel
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TOOL INDEX ============ */}
      <section className="section-rule section-block" id="tools">
        <div className="sheet">
          <SectionEyebrow
            label="The suite"
            title={
              <>
                Three tools, <span className="display-em">one habit.</span>
              </>
            }
            index="01"
          >
            Each tool answers one question you should ask before clicking,
            cloning, or opening: what am I actually looking at?
          </SectionEyebrow>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.tag} {...tool} className="reveal" />
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRINCIPLES ============ */}
      <section className="section-band section-block">
        <div className="sheet">
          <SectionEyebrow
            label="How these tools talk"
            title={
              <>
                Findings, <span className="display-em">not verdicts.</span>
              </>
            }
            index="02"
          />
          <div className="mt-12 grid gap-px border border-[color:var(--border)] bg-[color:var(--border)] md:grid-cols-3">
            {principles.map((principle, i) => (
              <div
                key={principle.title}
                className="reveal flex flex-col gap-3 bg-[color:var(--bg)] p-6"
              >
                <MetadataLabel plain>
                  {String(i + 1).padStart(2, '0')}
                </MetadataLabel>
                <h3 className="heading-md">{principle.title}</h3>
                <p className="copy-sm">{principle.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
