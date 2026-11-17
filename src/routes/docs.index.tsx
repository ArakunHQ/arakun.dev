import { createFileRoute, Link } from '@tanstack/react-router'
import { InstallBand, PageHeader } from '#/components/ui'
import { groupSlug, groups } from '#/docs'
import { pageMeta } from '#/seo'
import { pages, site } from '#/site'

const page = pages.docs

export const Route = createFileRoute('/docs/')({
  head: () => ({
    meta: [
      { title: `Docs · ${site.name}` },
      ...pageMeta({ path: page.path, title: page.title, description: page.lead }),
    ],
  }),
  component: DocsIndex,
})

export const Arrow = () => (
  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
)

function DocsIndex() {
  return (
    <>
      <PageHeader {...page} />

      <section className="wrap docs" style={{ paddingTop: 'var(--spacing-16)' }}>
        {groups.map((group) => (
          <div id={groupSlug(group.title)} key={group.title}>
            <div className="grp mono-label">{group.title}</div>
            {group.docs.map((doc) => (
              <Link className="dr" key={doc.slug} params={{ slug: doc.slug }} to="/docs/$slug">
                <div>
                  <h2>{doc.title}</h2>
                  <p>{doc.summary}</p>
                </div>
                <Arrow />
              </Link>
            ))}
          </div>
        ))}
      </section>

      <InstallBand />
    </>
  )
}
