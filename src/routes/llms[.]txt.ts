import { createFileRoute } from '@tanstack/react-router'
import { pageDescription, pageUrl } from '#/seo'
import { agents, installCommands, pages, site } from '#/site'

// An index for AI tools and coding agents that look for /llms.txt (llmstxt.org). Built
// from src/site.ts, so it names the same pages, links and install lines as the site.
const body = `# ${site.name}

> ${site.description}

${site.name} is free and open source under ${site.license}. It runs on Linux, Windows and macOS. Install it with one line:

- macOS and Linux: \`${installCommands.sh}\`
- Windows (PowerShell): \`${installCommands.powershell}\`
- Headless Linux server (arakun-server): \`${installCommands.server}\`

## Supported agents

${agents.map((agent) => `- [${agent.name}](${site.docsUrl}/${agent.slug}.md)`).join('\n')}

## Pages

- [${site.name}](${pageUrl('/')}): ${site.line}
${Object.values(pages)
  .map((page) => `- [${page.label}](${pageUrl(page.path)}): ${pageDescription(page)}`)
  .join('\n')}

## Docs

- [${site.name} docs](${site.docsUrl}): install, sessions, agents, the arakun command and settings. The docs have their own index at ${site.docsUrl}/llms.txt.

## Source

- [GitHub](${site.githubUrl}): the source code, issues and releases.
`

const headers = {
  'content-type': 'text/markdown; charset=utf-8',
  'cache-control': 'public, max-age=3600',
}

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: () => new Response(body, { headers }),
      HEAD: () => new Response(null, { headers }),
    },
  },
})
