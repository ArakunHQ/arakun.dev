import { createFileRoute, Link } from '@tanstack/react-router'
import { posts } from '#/blog'
import { InstallBand, PageHeader } from '#/components/ui'
import { innerPageHead } from '#/seo'
import { pages } from '#/site'

const page = pages.blog
const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })

export const Route = createFileRoute('/blog/')({
  head: () => innerPageHead(page),
  component: BlogIndex,
})

function BlogIndex() {
  return (
    <>
      <PageHeader {...page} />

      <section className="wrap blog-list">
        {posts.map((post) => (
          <article className="blog-card" key={post.slug}>
            <div className="blog-meta mono-label">
              <time dateTime={post.published}>
                {day.format(new Date(`${post.published}T00:00:00Z`))}
              </time>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h2>
              <Link params={{ slug: post.slug }} to="/blog/$slug">
                {post.title}
              </Link>
            </h2>
            <p className="lead">{post.description}</p>
            <Link className="more mono-label" params={{ slug: post.slug }} to="/blog/$slug">
              Read article
            </Link>
          </article>
        ))}
      </section>

      <InstallBand />
    </>
  )
}
