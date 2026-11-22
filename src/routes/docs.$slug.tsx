import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { AnchorProvider, TOCItem } from 'fumadocs-core/toc'
import { mdxComponents } from '#/components/mdx'
import { step, Words } from '#/components/ui'
import { docs, groups, loadBody, useBody } from '#/docs'
import { pageHead, techArticle } from '#/seo'
import { pages, site } from '#/site'

export const Route = createFileRoute('/docs/$slug')({
  loader: async ({ params }) => {
    const index = docs.findIndex((doc) => doc.slug === params.slug)
    if (index < 0) {
      throw notFound()
    }
    // Fetch the page's chunk before it renders. Only plain data crosses the loader;
    // the page reads the compiled body from the same cache.
    await loadBody(docs[index].slug)
    return { index, slug: docs[index].slug, title: docs[index].title, summary: docs[index].summary }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: `Docs · ${site.name}` }] }
    }
    const path = `/docs/${loaderData.slug}`
    return pageHead({
      path,
      tabTitle: `${loaderData.title} · ${site.name} docs`,
      title: loaderData.title,
      description: loaderData.summary,
      trail: [
        { name: pages.docs.label, path: pages.docs.path },
        { name: loaderData.title, path },
      ],
      jsonLd: [techArticle({ path, title: loaderData.title, description: loaderData.summary })],
    })
  },
  component: DocPage,
})

function DocPage() {
  const { index } = Route.useLoaderData()
  const doc = docs[index]
  const { body: Body, toc } = useBody(doc.slug)
  const previous = docs[index - 1]
  const next = docs[index + 1]
  return (
    <AnchorProvider single toc={toc}>
      <div className="wrap doc">
        <nav aria-label="Docs" className="doc-nav">
          <Link className="mono-label all" to="/docs">
            All docs
          </Link>
          {groups.map((group) => (
            <div key={group.title}>
              <span className="mono-label">{group.title}</span>
              {group.docs.map((item) => (
                <Link key={item.slug} params={{ slug: item.slug }} to="/docs/$slug">
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Keyed by slug so the entrance replays when moving between docs. */}
        <article className="prose" key={doc.slug}>
          <header>
            <span className="mono-label rise">{doc.group}</span>
            <h1>
              <Words text={doc.title} />
            </h1>
            <p className="lead rise" style={step(0, 300)}>
              {doc.summary}
            </p>
          </header>
          <div className="rise" style={step(1, 300)}>
            <Body components={mdxComponents} />
          </div>

          <footer className="doc-next">
            {previous ? (
              <Link params={{ slug: previous.slug }} to="/docs/$slug">
                <span className="mono-label">Previous</span>
                {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="n" params={{ slug: next.slug }} to="/docs/$slug">
                <span className="mono-label">Next</span>
                {next.title}
              </Link>
            ) : null}
          </footer>
        </article>

        {toc.length > 1 && (
          <nav aria-label="On this page" className="doc-toc" key={`toc-${doc.slug}`}>
            <span className="mono-label">On this page</span>
            {toc.map((item) => (
              <TOCItem data-depth={item.depth} href={item.url} key={item.url}>
                {item.title}
              </TOCItem>
            ))}
          </nav>
        )}
      </div>
    </AnchorProvider>
  )
}
