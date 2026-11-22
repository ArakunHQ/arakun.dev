import { createFileRoute } from '@tanstack/react-router'
import { pageUrl } from '#/seo'
import { pages } from '#/site'

/** Every page search engines should index, at the URL its canonical link names. */
const sitemapPaths = () => ['/', ...Object.values(pages).map((page) => page.path)]

function sitemap() {
  const urls = sitemapPaths()
    .map((path) => `  <url><loc>${pageUrl(path)}</loc></url>`)
    .join('\n')
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: sitemap,
      HEAD: () => {
        const res = sitemap()
        return new Response(null, { status: res.status, headers: res.headers })
      },
    },
  },
})
