import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { step, Words } from '#/components/ui'
import { docs, groups } from '#/docs'
import { pageMeta } from '#/seo'
import { site } from '#/site'

export const Route = createFileRoute('/docs/$slug')({
  loader: ({ params }) => {
    const index = docs.findIndex((doc) => doc.slug === params.slug)
    if (index < 0) {
      throw notFound()
    }
    // Only plain data crosses the loader; the page body is looked up again in the component.
    return { index, slug: docs[index].slug, title: docs[index].title, summary: docs[index].summary }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? 'Docs'} · ${site.name} docs` },
      ...(loaderData
        ? pageMeta({
            path: `/docs/${loaderData.slug}`,
            title: loaderData.title,
            description: loaderData.summary,
          })
        : []),
    ],
  }),
  component: DocPage,
})

function DocPage() {
  const { index } = Route.useLoaderData()
  const doc = docs[index]
  const previous = docs[index - 1]
  const next = docs[index + 1]
  return (
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
          {doc.body}
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
    </div>
  )
}
