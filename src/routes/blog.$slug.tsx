import { bodies } from 'virtual:blog/bodies'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import type { MDXContent } from 'mdx/types'
import type { LazyExoticComponent } from 'react'
import { lazy, Suspense } from 'react'
import { getPost, postAuthors, postCategories, postPath, postTabTitle, relatedPosts } from '#/blog'
import { AuthorCard, Byline, CategoryChips, PostGrid, Toc } from '#/components/blog'
import { mdxComponents } from '#/components/blog-mdx'
import { InstallBand } from '#/components/ui'
import { blogPosting, pageHead } from '#/seo'
import { pages } from '#/site'

// Published posts only, one chunk each (vite/blog.ts), so neither a draft nor
// another post's text ships with this page.
const loaded = new Map<string, MDXContent>()
const lazyBodies = new Map<string, LazyExoticComponent<MDXContent>>()

/**
 * The loader fills `loaded`, so a page renders its body at once. A page the
 * browser hydrates from the server's HTML may not have run the loader there;
 * then the body loads lazily while React keeps the server's markup on screen.
 */
function bodyOf(slug: string): MDXContent | LazyExoticComponent<MDXContent> {
  const ready = loaded.get(slug)
  if (ready) {
    return ready
  }
  let body = lazyBodies.get(slug)
  if (!body) {
    body = lazy(bodies[slug] as () => Promise<{ default: MDXContent }>)
    lazyBodies.set(slug, body)
  }
  return body
}

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = getPost(params.slug)
    const load = post ? bodies[post.slug] : undefined
    if (!(post && load)) {
      throw notFound()
    }
    loaded.set(post.slug, (await load()).default)
    return post
  },
  head: ({ loaderData: post }) =>
    post
      ? pageHead({
          path: postPath(post.slug),
          tabTitle: postTabTitle(post.seoTitle ?? post.title),
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
          <Suspense>
            <Body components={mdxComponents} />
          </Suspense>
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
