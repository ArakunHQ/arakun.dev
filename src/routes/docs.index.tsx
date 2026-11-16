import { Link, createFileRoute } from '@tanstack/react-router'
import { InstallBand, PageHeader } from '#/components/ui'
import { groupSlug, groups } from '#/docs'
import { site } from '#/site'

export const Route = createFileRoute('/docs/')({
  head: () => ({ meta: [{ title: `Docs · ${site.name}` }] }),
  component: DocsIndex,
})

export const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function DocsIndex() {
  return (
    <>
      <PageHeader
        num="03"
        label="Docs"
        title="Learn Arakun"
        lead="Short pages, plain words. Start with the install, then give an agent its first task."
      />

      <section className="wrap docs" style={{ paddingTop: 'var(--spacing-16)' }}>
        {groups.map((group) => (
          <div key={group.title} id={groupSlug(group.title)}>
            <div className="grp mono-label">{group.title}</div>
            {group.docs.map((doc) => (
              <Link className="dr" key={doc.slug} to="/docs/$slug" params={{ slug: doc.slug }}>
                <div>
                  <h4>{doc.title}</h4>
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
