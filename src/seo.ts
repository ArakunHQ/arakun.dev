import type { pages } from '#/site'
import { site } from '#/site'

/** Where a page's preview card is served: / is /og/home.png, /features is /og/features.png. */
export const ogImagePath = (path: string) => `/og/${path === '/' ? 'home' : path.slice(1)}.png`

/** The one URL a page is known by: https, no www, no trailing slash except on the home page. */
export const pageUrl = (path: string) => `${site.url}${path}`

/**
 * The og: and twitter: tags that differ per page; the root route sets the rest.
 * The card itself comes from src/og-cards.ts: give a page a card there before
 * pointing its meta at it.
 */
export function pageMeta({
  path,
  title,
  description,
}: {
  path: string
  title: string
  description: string
}) {
  const image = `${site.url}${ogImagePath(path)}`
  return [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: pageUrl(path) },
    { property: 'og:image', content: image },
    { property: 'og:image:alt', content: `${title}: ${description}` },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}

type JsonLd = Record<string, unknown>

/** The app itself, for search results that show software. */
const app: JsonLd = {
  '@type': 'SoftwareApplication',
  name: site.name,
  description: site.description,
  url: site.url,
  image: `${site.url}/brand/icon-512.png`,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Linux, Windows, macOS',
  license: site.licenseUrl,
  downloadUrl: pageUrl('/download'),
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: pageUrl('/download'),
  },
}

export const softwareApplication: JsonLd = { '@context': 'https://schema.org', ...app }

/** The site, so search engines show its name rather than its domain. */
export const website: JsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
}

/** Home, then each step to the page. The last step is the page itself. */
function breadcrumbs(trail: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: site.name, path: '/' }, ...trail].map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: pageUrl(step.path),
    })),
  }
}

/**
 * Everything a page puts in its head: the tab title, the description search engines
 * show, the preview card, the canonical URL and structured data. Every route with a
 * page calls it, so no page goes out without a canonical or with the home description.
 */
export function pageHead({
  path,
  tabTitle,
  title,
  description,
  trail = [],
  jsonLd = [],
}: {
  path: string
  /** The <title>: what a search result and the browser tab show. */
  tabTitle: string
  /** The page's own title, for the preview card. */
  title: string
  description: string
  /** The breadcrumb steps between the home page and this page, this page last. */
  trail?: { name: string; path: string }[]
  jsonLd?: JsonLd[]
}) {
  const data = trail.length > 0 ? [...jsonLd, breadcrumbs(trail)] : jsonLd
  return {
    meta: [
      { title: tabTitle },
      { name: 'description', content: description },
      ...pageMeta({ path, title, description }),
    ],
    links: [{ rel: 'canonical', href: pageUrl(path) }],
    // \u003c keeps a "</script>" in a title from closing the tag early.
    scripts: data.map((item) => ({
      type: 'application/ld+json',
      children: JSON.stringify(item).replaceAll('<', '\\u003c'),
    })),
  }
}

/** The head of an inner page from src/site.ts: Home, then the page, in its breadcrumbs. */
export function innerPageHead(page: (typeof pages)[keyof typeof pages], jsonLd: JsonLd[] = []) {
  return pageHead({
    path: page.path,
    tabTitle: page.tab,
    title: page.title,
    description: page.lead,
    trail: [{ name: page.label, path: page.path }],
    jsonLd,
  })
}
