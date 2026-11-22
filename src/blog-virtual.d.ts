// Built by vite/blog.ts from content/blog/*.mdx.

declare module 'virtual:blog/posts' {
  export const posts: import('./blog').PostMeta[]
}

declare module 'virtual:blog/bodies' {
  /** Loads each published post's article body, by slug. */
  export const bodies: Record<string, () => Promise<{ default: import('mdx/types').MDXContent }>>
}

declare module 'virtual:blog/markdown' {
  /** Each post as plain Markdown, by slug. */
  export const markdown: Record<string, string>
}
