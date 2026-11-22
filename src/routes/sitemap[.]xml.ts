import { createFileRoute } from '@tanstack/react-router'
import {
  activeAuthors,
  activeCategories,
  authorPath,
  categoryPath,
  postPath,
  posts,
  postsByAuthor,
  postsInCategory,
} from '#/blog'
import { getReleases } from '#/releases'
import { pageUrl } from '#/seo'
import { pages, site } from '#/site'

/** The newer of two dates written as YYYY-MM-DD; ISO dates sort as text. */
const newer = (a: string, b: string | undefined) => (b && b > a ? b : a)

const lastUpdate = (list: { updated: string }[]) =>
  list.reduce((latest, post) => newer(latest, post.updated), '')

/**
 * Every page search engines should index, at the URL its canonical link names, with
 * the day it last changed. The changelog and the download page change with each
 * release, so a newer release moves their date.
 */
async function sitemapEntries() {
  const releases = await getReleases()
  const lastRelease = releases
    .map((release) => release.publishedAt?.slice(0, 10))
    .filter((date) => date !== undefined)
    .sort()
    .at(-1)
  const withReleases = new Set<string>([pages.changelog.path, pages.download.path])
  return [
    { path: '/', updated: site.updated },
    ...Object.values(pages).map((page) => ({
      path: page.path,
      updated: withReleases.has(page.path) ? newer(page.updated, lastRelease) : page.updated,
    })),
    ...posts.map((post) => ({
      path: postPath(post.slug),
      updated: post.updated,
    })),
    // A list page changes when its newest post does.
    ...activeCategories.map((category) => ({
      path: categoryPath(category.id),
      updated: lastUpdate(postsInCategory(category.id)),
    })),
    ...activeAuthors.map((author) => ({
      path: authorPath(author.id),
      updated: lastUpdate(postsByAuthor(author.id)),
    })),
  ]
}

async function sitemap() {
  const urls = (await sitemapEntries())
    .map(
      ({ path, updated }) => `  <url><loc>${pageUrl(path)}</loc><lastmod>${updated}</lastmod></url>`
    )
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
      HEAD: async () => {
        const res = await sitemap()
        return new Response(null, { status: res.status, headers: res.headers })
      },
    },
  },
})
