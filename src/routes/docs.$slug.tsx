import { use } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { AnchorProvider, TOCItem } from 'fumadocs-core/toc'
import { mdxComponents } from '#/components/mdx'
import { Words, step } from '#/components/ui'
import { docs, groups, loadBody } from '#/docs'
import { pageMeta } from '#/seo'
import { site } from '#/site'

export const Route = createFileRoute('/docs/$slug')({
  loader: async ({ params }) => {
    const index = docs.findIndex((doc) => doc.slug === params.slug)
    if (index < 0) throw notFound()
    // Fetch the page's chunk before it renders. Only plain data crosses the loader;
    // the page reads the compiled body from the same cache.
    await loadBody(docs[index].slug)
    return { index, slug: docs[index].slug, title: docs[index].title, summary: docs[index].summary }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Docs'} · ${site.name} docs` },
      ...(loaderData
        ? pageMeta({ path: `/docs/${loaderData.slug}`, title: loaderData.title, description: loaderData.summary })
        : []),
    ],
  }),
  component: DocPage,
})

function DocPage() {
  const { index } = Route.useLoaderData()
  const doc = docs[index]
  const { body: Body, toc } = use(loadBody(doc.slug))
  const previous = docs[index - 1]
  const next = docs[index + 1]
  return (
    <AnchorProvider toc={toc} single>
      <div className="wrap doc">
        <nav className="doc-nav" aria-label="Docs">
          <Link to="/docs" className="mono-label all">
            All docs
          </Link>
          {groups.map((group) => (
            <div key={group.title}>
              <span className="mono-label">{group.title}</span>
              {group.docs.map((item) => (
                <Link key={item.slug} to="/docs/$slug" params={{ slug: item.slug }}>
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
              <Link to="/docs/$slug" params={{ slug: previous.slug }}>
                <span className="mono-label">Previous</span>
                {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to="/docs/$slug" params={{ slug: next.slug }} className="n">
                <span className="mono-label">Next</span>
                {next.title}
              </Link>
            )}
          </footer>
        </article>

        {toc.length > 1 && (
          <nav className="doc-toc" aria-label="On this page" key={`toc-${doc.slug}`}>
            <span className="mono-label">On this page</span>
            {toc.map((item) => (
              <TOCItem key={item.url} href={item.url} data-depth={item.depth}>
                {item.title}
              </TOCItem>
            ))}
          </nav>
        )}
      </div>
    </AnchorProvider>
  )
}
