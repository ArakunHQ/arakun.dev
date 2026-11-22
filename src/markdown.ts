import { pageDescription, pageUrl } from '#/seo'
import { agents, installCommands, pages, pillars, site } from '#/site'

const MARKDOWN_TYPES = new Set(['text/markdown', 'text/x-markdown'])
const HTML_TYPES = new Set(['text/html', 'application/xhtml+xml'])

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
 * Plain wildcard headers stay on HTML.
 */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) {
    return false
  }
  let mdQuality = 0
  let htmlQuality = 0
  for (const part of accept.split(',')) {
    const [rawType, ...params] = part.trim().split(';')
    const mediaType = rawType?.trim().toLowerCase()
    if (!mediaType) {
      continue
    }
    const q = parseQuality(params)
    if (MARKDOWN_TYPES.has(mediaType)) {
      mdQuality = Math.max(mdQuality, q)
    } else if (HTML_TYPES.has(mediaType)) {
      htmlQuality = Math.max(htmlQuality, q)
    }
  }
  return mdQuality > 0 && mdQuality >= htmlQuality
}

const agentLinks = agents
  .map((agent) => `- [${agent.name}](${site.docsUrl}/${agent.slug}.md)`)
  .join('\n')

const pageBodies: Record<string, string> = {
  '/': `# ${site.name}

> ${site.description}

${site.name} is a native GPU-rendered Rust app (GPUI) for Linux, Windows and macOS, free and open source under ${site.license}.

## Install

- macOS and Linux: \`${installCommands.sh}\`
- Windows (PowerShell): \`${installCommands.powershell}\`
- Headless Linux server: \`${installCommands.server}\`

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

${pillars
  .map(
    (pillar) => `## ${pillar.title}

${pillar.body}`
  )
  .join('\n\n')}

## Supported agents

${agentLinks}

Full documentation: ${site.docsUrl} (${site.docsUrl}/llms.txt).
`,
  '/download': `# ${pages.download.title}

> ${pageDescription(pages.download)}

## One-line install

- macOS (Apple silicon) and Linux: \`${installCommands.sh}\`
- Windows (PowerShell): \`${installCommands.powershell}\`
- Linux server (\`arakun-server\`): \`${installCommands.server}\`

Latest releases and checksums: ${site.releasesUrl}
Install guide: ${site.docsUrl}/install.md
`,
  '/changelog': `# ${pages.changelog.title}

> ${pageDescription(pages.changelog)}

Browse releases on GitHub: ${site.releasesUrl}
HTML changelog: ${pageUrl('/changelog')}
`,
  '/privacy': `# ${pages.privacy.title}

> ${pageDescription(pages.privacy)}

Operator: ${site.operator.name}, ${site.operator.address}
Privacy contact: ${site.privacyEmail}
Full privacy page: ${pageUrl('/privacy')}
App telemetry docs: ${site.docsUrl}/crash-reports.md
`,
}

/** Markdown representation for core site pages, or null for non-page routes. */
export function pageMarkdown(pathname: string): string | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return pageBodies[normalized] ?? null
}
