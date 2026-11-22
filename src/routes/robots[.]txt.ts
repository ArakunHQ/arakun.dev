import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/site'

// Cloudflare puts its content signals above this. The Sitemap line is ours: it is how
// crawlers find the sitemap.
const body = `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
Sitemap: ${site.docsUrl}/sitemap.xml
`

const headers = {
  'content-type': 'text/plain; charset=utf-8',
  'cache-control': 'public, max-age=3600',
}

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => new Response(body, { headers }),
      HEAD: () => new Response(null, { headers }),
    },
  },
})
