import { createFileRoute } from '@tanstack/react-router'
import { Markdown } from '#/components/Markdown'
import { InstallBand, PageHeader, StatusPill } from '#/components/ui'
import { notes } from '#/release-notes'
import { getReleases } from '#/releases'
import type { Release } from '#/releases'
import { pageMeta } from '#/seo'
import { pages, site } from '#/site'

const page = pages.changelog

/**
 * The changelog. Its releases come from GitHub: see `releases.ts` for how they
 * are read and cached, and `release-notes.ts` for the hand-written notes shown
 * in place of a release's GitHub notes.
 */
export const Route = createFileRoute('/changelog')({
  loader: () => getReleases(),
  head: () => ({
    meta: [
      { title: `Changelog · ${site.name}` },
      ...pageMeta({ path: page.path, title: page.title, description: page.lead }),
    ],
  }),
  component: Changelog,
})

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })

function ReleaseEntry({ release }: { release: Release }) {
  const note = notes[release.tag]
  // "Arakun v0.1.0" says nothing the version beside it doesn't: prefer the written title.
  const plainName = new RegExp(`^(${site.name}\\s+)?v?${release.tag.replace(/^v/, '')}$`, 'i').test(release.name)
  const title = plainName ? (note?.title ?? release.name) : release.name
  return (
    <article className="re" id={release.tag}>
      <div className="v">
        <span className="ver">{release.tag}</span>
        {release.publishedAt && <time className="d" dateTime={release.publishedAt}>{day.format(new Date(release.publishedAt))}</time>}
        {release.prerelease && <StatusPill tone="attention" label="Pre-release" />}
      </div>
      <div className="c">
        <h3>{title}</h3>
        {release.body ? (
          <Markdown source={release.body} />
        ) : note ? (
          <ul className="areas">
            {note.changes.map(([area, change]) => (
              <li key={area}>
                <b>{area}</b>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="none">This release has no written notes.</p>
        )}
        <a className="more mono-label" href={release.url}>
          {release.tag} on GitHub
        </a>
      </div>
    </article>
  )
}

function Changelog() {
  const releases = Route.useLoaderData()
  return (
    <>
      <PageHeader {...page} />

      <section className="wrap" style={{ paddingTop: 'var(--spacing-16)' }}>
        {releases.map((release) => (
          <ReleaseEntry key={release.tag} release={release} />
        ))}
        <p className="re-end">
          {releases.length === 1 ? 'That is the whole history so far.' : 'That is the whole history.'}
        </p>
      </section>

      <InstallBand />
    </>
  )
}
