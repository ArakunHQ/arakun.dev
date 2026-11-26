import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { authorPath, getAuthor, postsByAuthor } from '#/blog'
import { AuthorCard, PostGrid } from '#/components/blog'
import { InstallBand } from '#/components/ui'
import { blogAuthor, pageHead } from '#/seo'
import { pages, site } from '#/site'

export const Route = createFileRoute('/blog/author/$author')({
  loader: ({ params }) => {
    const author = getAuthor(params.author)
    if (!(author && postsByAuthor(author.id).length)) {
      throw notFound()
    }
    return author
  },
  head: ({ loaderData: author }) =>
    author
      ? pageHead({
          path: authorPath(author.id),
          tabTitle: `Posts by ${author.name} on the ${site.name} blog`,
          title: `Posts by ${author.name}`,
          description: author.bio,
          ogType: 'profile',
          trail: [
            { name: pages.blog.label, path: pages.blog.path },
            { name: author.name, path: authorPath(author.id) },
          ],
          jsonLd: [blogAuthor(author)],
        })
      : {},
  component: AuthorPage,
})

function AuthorPage() {
  const author = Route.useLoaderData()
  const list = postsByAuthor(author.id)
  return (
    <>
      <header className="ph wrap blog-head">
        <Link className="blog-back mono-label" to="/blog">
          ← Blog
        </Link>
        <AuthorCard author={author} heading="h1" />
      </header>
      <section aria-label={`Posts by ${author.name}`} className="wrap blog-section">
        <h2 className="mono-label blog-section-title">
          {list.length} {list.length === 1 ? 'post' : 'posts'}
        </h2>
        <PostGrid eagerFirst posts={list} />
      </section>
      <div className="blog-end" />
      <InstallBand />
    </>
  )
}
