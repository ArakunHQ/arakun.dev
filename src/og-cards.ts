import { activeAuthors, activeCategories, authorPath, categoryPath, postPath, posts } from '#/blog'
import { pages, site } from '#/site'

// The plugin loads this file through Vite, so it gets the path rule from here rather than importing src itself.
export { ogImagePath } from '#/seo'

/**
 * One link preview card per page. The og plugin (vite/og.ts) renders each to
 * ogImagePath(path) at build time, and on request in dev. Routes point their
 * og:image at it with pageMeta (src/seo.ts). Only the plugin imports this file.
 */
export interface OgCard {
  /** Cover art from vite/og-art.ts, drawn instead of the large raccoon. */
  art?: string
  label: string
  line: string
  path: string
  title: string
}

const section = (...parts: string[]) => [new URL(site.url).host, ...parts].join(' · ')

export const ogCards: OgCard[] = [
  { path: '/', label: section(), title: site.name, line: site.line },
  ...Object.values(pages).map((page) => ({
    path: page.path,
    label: section(page.label),
    title: page.title,
    line: page.lead,
  })),
  ...posts.map((post) => ({
    path: postPath(post.slug),
    label: section(pages.blog.label, post.published),
    title: post.cardTitle ?? post.title,
    line: post.description,
    art: post.cover,
  })),
  ...activeCategories.map((category) => ({
    path: categoryPath(category.id),
    label: section(pages.blog.label),
    title: category.label,
    line: category.description,
  })),
  ...activeAuthors.map((author) => ({
    path: authorPath(author.id),
    label: section(pages.blog.label, author.role),
    title: author.name,
    line: author.bio,
  })),
]
