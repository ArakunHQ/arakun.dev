import { docs } from '#/docs'
import { pages, site } from '#/site'

// The plugin loads this file through Vite, so it gets the path rule from here rather than importing src itself.
export { ogImagePath } from '#/seo'

/**
 * One link preview card per page. The og plugin (vite/og.ts) renders each to
 * ogImagePath(path) at build time, and on request in dev. Routes point their
 * og:image at it with pageMeta (src/seo.ts). Only the plugin imports this file.
 */
export type OgCard = { path: string; label: string; title: string; line: string }

const section = (...parts: string[]) => [new URL(site.url).host, ...parts].join(' · ')

export const ogCards: OgCard[] = [
  { path: '/', label: section(), title: site.name, line: site.line },
  ...Object.values(pages).map((page) => ({
    path: page.path,
    label: section(page.label),
    title: page.title,
    line: page.lead,
  })),
  ...docs.map((doc) => ({
    path: `/docs/${doc.slug}`,
    label: section('Docs', doc.group),
    title: doc.title,
    line: doc.summary,
  })),
]
