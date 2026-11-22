import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import type { BenchChart } from '#/blog'
import { getPost, postPath } from '#/blog'
import { InstallBand } from '#/components/ui'
import { blogPosting, pageHead } from '#/seo'
import { pages, site } from '#/site'

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPost(params.slug)
    if (!post) {
      throw notFound()
    }
    return post
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {}
    }
    return pageHead({
      path: postPath(loaderData.slug),
      tabTitle: `${loaderData.title} · ${site.name}`,
      title: loaderData.title,
      description: loaderData.description,
      trail: [
        { name: pages.blog.label, path: pages.blog.path },
        { name: loaderData.title, path: postPath(loaderData.slug) },
      ],
      jsonLd: [blogPosting(loaderData)],
    })
  },
  component: BlogPostPage,
})

function Chart({ chart }: { chart: BenchChart }) {
  return (
    <figure className="bench-chart">
      <figcaption>
        <span className="bench-chart-title">{chart.title}</span>
        <span className="bench-chart-sub mono-label">{chart.subtitle}</span>
      </figcaption>
      <div className="bench-bars">
        {chart.rows.map((row) => {
          const pct = Math.max(4, Math.min(100, (row.value / chart.max) * 100))
          return (
            <div
              className="bench-row"
              data-highlight={row.highlight ? 'true' : undefined}
              key={row.label}
            >
              <div className="bench-row-head">
                <span className="bench-label">
                  {row.label}
                  {row.note ? <span className="bench-note"> · {row.note}</span> : null}
                </span>
                <span className="bench-val">{row.valueLabel}</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function BlogPostPage() {
  const post = Route.useLoaderData()
  return (
    <>
      <header className="ph">
        <div className="wrap blog-head">
          <Link className="blog-back mono-label" to="/blog">
            ← Blog
          </Link>
          <div className="blog-meta mono-label">
            <time dateTime={post.published}>
              {day.format(new Date(`${post.published}T00:00:00Z`))}
            </time>
            <span>{post.readingMinutes} min read</span>
            <span>{post.author}</span>
          </div>
          <h1>{post.title}</h1>
          <p className="lead">{post.description}</p>
        </div>
      </header>

      <div className="wrap">
        <article className="prose blog-post">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.chart ? <Chart chart={section.chart} /> : null}
              {section.table ? (
                <div className="bench-table-wrap">
                  <table className="bench-table">
                    <thead>
                      <tr>
                        {section.table.headers.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, i) =>
                            i === 0 ? (
                              <th key={cell} scope="row">
                                {cell}
                              </th>
                            ) : (
                              // biome-ignore lint/suspicious/noArrayIndexKey: table columns are positional and fixed.
                              <td key={`${row[0]}-${i}`}>{cell}</td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.code ? (
                <pre className="blog-code">
                  <code>{section.code}</code>
                </pre>
              ) : null}
            </section>
          ))}
        </article>
      </div>

      <InstallBand />
    </>
  )
}
