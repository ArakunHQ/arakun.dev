import { createFileRoute } from '@tanstack/react-router'
import { featuredPost, posts } from '#/blog'
import { CategoryNav, FeaturedPost, PostGrid } from '#/components/blog'
import { InstallBand, PageHeader } from '#/components/ui'
import { innerPageHead } from '#/seo'
import { pages } from '#/site'

const page = pages.blog

export const Route = createFileRoute('/blog/')({
  head: () => innerPageHead(page),
  component: BlogIndex,
})

function BlogIndex() {
  const featured = featuredPost()
  const rest = posts.filter((post) => post !== featured)
  return (
    <>
      <PageHeader {...page} />
      <CategoryNav />
      {featured ? <FeaturedPost post={featured} /> : null}
      {rest.length ? (
        <section aria-label="More posts" className="wrap blog-section">
          <h2 className="mono-label blog-section-title">More posts</h2>
          <PostGrid posts={rest} />
        </section>
      ) : null}
      <div className="blog-end" />
      <InstallBand />
    </>
  )
}
