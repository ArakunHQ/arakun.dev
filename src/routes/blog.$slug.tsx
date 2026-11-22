import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import type { MDXContent } from 'mdx/types'
import { getPost, postAuthors, postCategories, postPath, relatedPosts } from '#/blog'
import { AuthorCard, Byline, CategoryChips, PostGrid, Toc } from '#/components/blog'
import { mdxComponents } from '#/components/blog-mdx'
import { InstallBand } from '#/components/ui'
import { blogPosting, pageHead } from '#/seo'
import { pages, site } from '#/site'

// The article bodies, compiled from content/blog/*.mdx by vite/blog.ts. Only this
// route imports them, so the overview never loads a post's text.
const bodies = import.meta.glob<MDXContent>('/content/blog/*.mdx', {
  eager: true,
  import: 'default',
})
const bodyOf = (slug: string) => bodies[`/content/blog/${slug}.mdx`]

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPost(params.slug)
    if (!(post && bodyOf(post.slug))) {
      throw notFound()
    }
    return post
  },
  head: ({ loaderData: post }) =>
    post
      ? pageHead({
          path: postPath(post.slug),
          tabTitle: `${post.title} · ${site.name}`,
          title: post.title,
          description: post.description,
          ogType: 'article',
          trail: [
            { name: pages.blog.label, path: pages.blog.path },
            { name: post.title, path: postPath(post.slug) },
          ],
          jsonLd: [blogPosting(post)],
        })
      : {},
  component: BlogPostPage,
})

function BlogPostPage() {
  const post = Route.useLoaderData()
  const Body = bodyOf(post.slug)
  const related = relatedPosts(post)
  return (
    <>
      <div aria-hidden="true" className="read-progress" />
      <header className="ph wrap blog-head">
        <Link className="blog-back mono-label" to="/blog">
          ← Blog
        </Link>
        <CategoryChips categories={postCategories(post)} />
        <h1>{post.title}</h1>
        <p className="lead">{post.description}</p>
        <Byline post={post} showUpdated />
      </header>

      <div className="wrap blog-layout">
        <article className="prose blog-post">
          {Body ? <Body components={mdxComponents} /> : null}
        </article>
        <aside className="blog-aside">
          <Toc entries={post.toc} />
        </aside>
      </div>

      <footer className="wrap blog-foot">
        <h2 className="mono-label blog-section-title">Written by</h2>
        <div className="author-list">
          {postAuthors(post).map((author) => (
            <AuthorCard author={author} key={author.id} />
          ))}
        </div>
        {related.length ? (
          <section aria-label="Related posts" className="blog-related">
            <h2 className="mono-label blog-section-title">Keep reading</h2>
            <PostGrid posts={related} />
          </section>
        ) : null}
      </footer>

      <InstallBand />
    </>
  )
}
