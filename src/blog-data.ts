import { site } from './site'

// The blog's authors and categories. A post names them by id in its frontmatter
// (content/blog/<slug>.mdx); the build fails on an id that is not here.
// vite/blog.ts imports this file outside the app, so it uses relative imports only.

export interface AuthorLink {
  label: string
  url: string
}

export interface Author {
  /** A square image under public/, such as /blog/authors/<id>.png. Without one the page shows initials. */
  avatar?: string
  /** One or two plain sentences, shown under every post the author wrote and on their page. */
  bio: string
  id: string
  links: AuthorLink[]
  name: string
  /** What they do on Arakun, such as "Maintainer". */
  role: string
  /** "Person" for a human, "Organization" for a shared byline. Used for structured data. */
  type: 'Person' | 'Organization'
}

export interface Category {
  description: string
  id: string
  label: string
}

export const authors = {
  'arakun-team': {
    id: 'arakun-team',
    type: 'Organization',
    name: 'Arakun team',
    role: 'The people building Arakun',
    bio: 'We build Arakun, a native workspace for running coding agents side by side. We write here about what we measure, how the app is built, and why we made the calls we did.',
    avatar: '/brand/icon-512.png',
    links: [{ label: 'GitHub', url: site.githubOrgUrl }],
  },
} satisfies Record<string, Author>

export const categories = {
  benchmarks: {
    id: 'benchmarks',
    label: 'Benchmarks',
    description: 'Measured numbers: how Arakun compares on startup, memory, CPU and throughput.',
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    description: 'Where time and memory go in Arakun, and what we did about it.',
  },
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    description:
      'How Arakun is built: Rust, GPUI, terminals, the built-in browser and the agent bridge.',
  },
  product: {
    id: 'product',
    label: 'Product',
    description: 'What we ship, what we left out, and the reasons behind both.',
  },
} satisfies Record<string, Category>

export type AuthorId = keyof typeof authors
export type CategoryId = keyof typeof categories

const ACCENTS = /[\u0300-\u036f]/gu
const NOT_WORD = /[^a-z0-9]+/gu
const EDGE_DASHES = /^-+|-+$/gu

/** Turns heading text into the id its anchor link uses: "The short answer" is "the-short-answer". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(ACCENTS, '')
    .replace(NOT_WORD, '-')
    .replace(EDGE_DASHES, '')
}
