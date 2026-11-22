import type { Release } from '#/releases'
import { listReleases } from '#/releases'
import { pageDescription, pageUrl } from '#/seo'
import { agents, installCommands, pages, pillars, site } from '#/site'

const MARKDOWN_TYPES = new Set(['text/markdown', 'text/x-markdown'])
const HTML_TYPES = new Set(['text/html', 'application/xhtml+xml'])
const MARKDOWN_PATHS = new Set(['/', '/features', '/download', '/changelog', '/privacy'])

function parseQuality(params: string[]): number {
  for (const param of params) {
    const [key, value] = param.trim().split('=')
    if (key?.toLowerCase() === 'q' && value !== undefined) {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0
    }
  }
  return 1
}

/**
 * Whether an Accept header explicitly prefers Markdown over HTML (such as
 * `Accept: text/markdown` or `Accept: text/markdown, text/html;q=0.9`).
 * Respects RFC 9110 specificity (exact > type wildcard > global wildcard), so
 * `text/markdown;q=0.5, *` + `/*;q=1` still resolves to HTML.
 */
function maxQuality(entries: [string, number][], match: (type: string) => boolean): number | null {
  let best: number | null = null
  for (const [mediaType, q] of entries) {
    if (match(mediaType)) {
      best = best === null ? q : Math.max(best, q)
    }
  }
  return best
}

export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) {
    return false
  }
  const entries: [string, number][] = []
  for (const part of accept.split(',')) {
    const [rawType, ...params] = part.trim().split(';')
    const mediaType = rawType?.trim().toLowerCase()
    if (mediaType) {
      entries.push([mediaType, parseQuality(params)])
    }
  }

  const mdExact = maxQuality(entries, (t) => MARKDOWN_TYPES.has(t))
  if (mdExact === null || mdExact <= 0) {
    return false
  }
  const htmlQuality =
    maxQuality(entries, (t) => HTML_TYPES.has(t)) ??
    maxQuality(entries, (t) => t === 'text/*') ??
    maxQuality(entries, (t) => t === '*/*') ??
    0
  return mdExact >= htmlQuality
}

function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export function hasMarkdownPage(pathname: string): boolean {
  return MARKDOWN_PATHS.has(normalizePath(pathname))
}

const agentLinks = agents
  .map((agent) => `- [${agent.name}](${site.docsUrl}/${agent.slug}.md)`)
  .join('\n')

const staticBodies: Record<string, string> = {
  '/': `# ${site.name}

> ${site.description}

${site.name} is a native GPU-rendered Rust app (GPUI) for Linux, Windows and macOS, free and open source under ${site.license}.

## Install

- macOS and Linux: \`${installCommands.sh}\`
- Windows (PowerShell): \`${installCommands.powershell}\`
- Headless Linux server (arakun-server): \`${installCommands.server}\`

## Why ${site.name}

${pillars.map((pillar) => `- **${pillar.title}:** ${pillar.body}`).join('\n')}

## Supported agents

${agentLinks}

## Links

- [Features](${pageUrl('/features')})
- [Download](${pageUrl('/download')})
- [Changelog](${pageUrl('/changelog')})
- [Docs](${site.docsUrl}) ([llms.txt](${site.docsUrl}/llms.txt))
- [GitHub](${site.githubUrl})
`,
  '/features': `# ${pages.features.title}

> ${pageDescription(pages.features)}

${pillars.map((pillar) => `## ${pillar.title}\n\n${pillar.body}`).join('\n\n')}

## Supported agents

${agentLinks}

Full documentation: ${site.docsUrl} (${site.docsUrl}/llms.txt).
`,
  '/download': `# ${pages.download.title}

> ${pageDescription(pages.download)}

## One-line install

- macOS (Apple silicon) and Linux: \`${installCommands.sh}\`
- Windows (PowerShell): \`${installCommands.powershell}\`
- Linux server (arakun-server): \`${installCommands.server}\`

Latest releases and checksums: ${site.releasesUrl}
Install guide: ${site.docsUrl}/install.md
`,
  '/privacy': `# ${pages.privacy.title}

> ${pageDescription(pages.privacy)}

## Who runs this site

arakun.dev is run by ${site.operator.name}, ${site.operator.address}. ${site.operator.name} is also responsible for the reports the Arakun app sends. Questions about your data go to ${site.privacyEmail}.

## Without your consent

Until you accept the cookie banner, the site sets no cookie and loads no analytics. It keeps two things in local storage that never leave your browser: your banner choice and your light or dark theme. Cloudflare runs the site and sees each request, including your IP address, to deliver the page and prevent abuse.

## If you accept: analytics

PostHog collects pages visited and referrer, clicked links and buttons (never what you type), browser, OS, screen size, rough location (country and city), page load speed, and page errors. PostHog stores a cookie with a random id, uses your IP to estimate location without keeping it, does not record your screen, and builds no name/email profile. Data is never sold or used for ads.

## Error reports from the server

When the site server fails, it reports the URL path without query, request kind, and error to PostHog (with or without consent). No cookie, IP address, or browser is sent; if you accepted analytics, your PostHog id is included.

## In the Arakun app

The app sends nothing until you answer on first launch ("Send crash reports and usage counts?"). Both options stay off until you agree:

- **Crash reports:** error message and stack trace (with home folder replaced by \`~\` and paths, links, emails, and keys/tokens stripped). Agent errors include agent name and version, fixed error category, failed step, error/exit code, and whether the session folder still exists — never the error text.
- **Usage counts:** app launched, session started (agent name), agent turn finished, project added, environment created, built-in view opened, and browser tab opened.

Every report includes app version, OS, CPU architecture, and a random \`telemetry-id\` stored locally (not tied to any account; no prompts, replies, file contents, URLs, or project names).

## Feedback and surveys in the app

- **Feedback forms:** Send Feedback or error prompts send your written answers when you press Send, plus error category, agent name, and crash report link when applicable. Email is optional and used only to reply.
- **Surveys:** shown only with usage counts on, at most once per launch, fetched without your id.
- **Feedback from agents:** only with usage counts on, at most five times per hour per environment, with paths, links, emails, and tokens stripped before leaving your computer.
- Public GitHub issues created from feedback never include your email address or telemetry id.

## Legal basis, storage and retention

Site analytics, app crash reports, usage counts, feedback, and surveys rely on consent (GDPR Art. 6(1)(a)); server error reports rely on legitimate interest (Art. 6(1)(f)). Data is stored by PostHog, Inc. in the United States under a DPA (Data Privacy Framework + EU SCCs); public GitHub issues live on GitHub, Inc. servers in the United States. PostHog data and cookies are kept for one year; GitHub issues stay until deleted on request.

## Your choices

- Change site consent at any time via Cookies in the footer.
- Toggle Crash reports and Usage counts in Settings > Privacy in the app, or set \`DO_NOT_TRACK=1\` or \`ARAKUN_TELEMETRY=0\`.
- Delete \`telemetry-id\` to reset your id, or email ${site.privacyEmail} to inspect or delete data. EU/UK visitors may also complain to their data protection authority.

Last updated November 22, 2026. Full page: ${pageUrl('/privacy')}
`,
}

function formatRelease(release: Release): string {
  const date = release.publishedAt ? release.publishedAt.slice(0, 10) : ''
  const heading = date ? `## ${release.tag} (${date})` : `## ${release.tag}`
  const details = release.note
    ? release.note.changes.map(([area, change]) => `- **${area}:** ${change}`).join('\n')
    : release.body.trim() || 'This release has no written notes.'
  return `${heading}\n\n${details}\n\nGitHub: ${release.url}`
}

async function changelogMarkdown(): Promise<string> {
  const releases = await listReleases()
  const entries = releases.map(formatRelease).join('\n\n')
  return `# ${pages.changelog.title}\n\n> ${pageDescription(pages.changelog)}\n\n${entries}\n`
}

/** Markdown representation for core site pages, or null for non-page routes. */
export async function pageMarkdown(pathname: string): Promise<string | null> {
  const normalized = normalizePath(pathname)
  if (normalized === '/changelog') {
    return await changelogMarkdown()
  }
  return staticBodies[normalized] ?? null
}
