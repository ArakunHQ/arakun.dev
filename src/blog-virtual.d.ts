// Built by vite/blog.ts from content/blog/*.mdx.

declare module 'virtual:blog/posts' {
  export const posts: import('./blog').PostMeta[]
}

declare module 'virtual:blog/markdown' {
  /** Each post as plain Markdown, by slug. */
  export const markdown: Record<string, string>
}
