import { posts as allPosts } from 'virtual:blog/posts'
import type { Author, AuthorId, Category, CategoryId } from '#/blog-data'
import { authors, categories } from '#/blog-data'

export type { Author, Category } from '#/blog-data'
export { postTabTitle } from '#/blog-data'

export interface TocEntry {
  id: string
  text: string
}

/** A post's frontmatter, plus what the build works out from its text. See vite/blog.ts. */
export interface PostMeta {
  authors: AuthorId[]
  /** A shorter title for the link preview card, when the full one is too long for it. */
  cardTitle?: string
  categories: CategoryId[]
  /** Cover art for the post's card, by name (vite/og-art.ts). Without it the card shows the raccoon. */
  cover?: string
  description: string
  draft: boolean
  featured: boolean
  published: string
  readingMinutes: number
  /** A shorter title for search results and the tab, when the full one is too long for them. */
  seoTitle?: string
  slug: string
  title: string
  toc: TocEntry[]
  updated: string
}

/** Every published post, newest first. */
export const posts: PostMeta[] = allPosts

export const getPost = (slug: string) => posts.find((post) => post.slug === slug)
export const getAuthor = (id: string): Author | undefined => authors[id as AuthorId]
export const getCategory = (id: string): Category | undefined => categories[id as CategoryId]

export const postPath = (slug: string) => `/blog/${slug}`
export const authorPath = (id: string) => `/blog/author/${id}`
export const categoryPath = (id: string) => `/blog/category/${id}`

export const postAuthors = (post: PostMeta): Author[] => post.authors.map((id) => authors[id])
export const postCategories = (post: PostMeta): Category[] =>
  post.categories.map((id) => categories[id])

export const postsByAuthor = (id: string) =>
  posts.filter((post) => post.authors.includes(id as AuthorId))
export const postsInCategory = (id: string) =>
  posts.filter((post) => post.categories.includes(id as CategoryId))

/** Authors and categories with at least one post: the only ones that get a page. */
export const activeAuthors = Object.values(authors as Record<string, Author>).filter(
  (author) => postsByAuthor(author.id).length > 0
)
export const activeCategories = Object.values(categories as Record<string, Category>).filter(
  (category) => postsInCategory(category.id).length > 0
)

/** The post the overview leads with: the newest one marked featured, or else the newest. */
export const featuredPost = (): PostMeta | undefined =>
  posts.find((post) => post.featured) ?? posts[0]

/** Up to `count` other posts, the ones sharing the most categories first, then the newest. */
export function relatedPosts(post: PostMeta, count = 3): PostMeta[] {
  const shared = (other: PostMeta) =>
    other.categories.filter((id) => post.categories.includes(id)).length
  return posts
    .filter((other) => other.slug !== post.slug)
    .map((other) => ({ other, score: shared(other) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.other.published.localeCompare(a.other.published))
    .slice(0, count)
    .map(({ other }) => other)
}

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })
/** "November 22, 2026" from "2026-11-22". */
export const formatDay = (iso: string) => day.format(new Date(`${iso}T00:00:00Z`))
