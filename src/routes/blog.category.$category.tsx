import { createFileRoute, notFound } from '@tanstack/react-router'
import { categoryPath, getCategory, postsInCategory } from '#/blog'
import { CategoryNav, PostGrid } from '#/components/blog'
import { InstallBand, PageHeader } from '#/components/ui'
import { pageHead } from '#/seo'
import { pages, site } from '#/site'

export const Route = createFileRoute('/blog/category/$category')({
  loader: ({ params }) => {
    const category = getCategory(params.category)
    if (!(category && postsInCategory(category.id).length)) {
      throw notFound()
    }
    return category
  },
  head: ({ loaderData: category }) =>
    category
      ? pageHead({
          path: categoryPath(category.id),
          tabTitle: `${category.label} · ${pages.blog.label} · ${site.name}`,
          title: `${category.label} posts`,
          description: category.description,
          trail: [
            { name: pages.blog.label, path: pages.blog.path },
            { name: category.label, path: categoryPath(category.id) },
          ],
        })
      : {},
  component: CategoryPage,
})

function CategoryPage() {
  const category = Route.useLoaderData()
  return (
    <>
      <PageHeader
        label={pages.blog.label}
        lead={category.description}
        num={pages.blog.num}
        title={category.label}
      />
      <CategoryNav current={category.id} />
      <section aria-label={`${category.label} posts`} className="wrap blog-section">
        <PostGrid posts={postsInCategory(category.id)} />
      </section>
      <div className="blog-end" />
      <InstallBand />
    </>
  )
}
