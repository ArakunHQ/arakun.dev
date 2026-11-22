import { createFileRoute } from '@tanstack/react-router'
import { Markdown } from '#/components/Markdown'
import { InstallBand, PageHeader, StatusPill } from '#/components/ui'
import type { Release } from '#/releases'
import { getReleases } from '#/releases'
import { innerPageHead } from '#/seo'
import { pages, site } from '#/site'

const page = pages.changelog

/**
 * The changelog. Its releases come from GitHub: see `releases.ts` for how they
 * are read and cached, and `release-notes.ts` for the hand-written notes shown
 * in place of a release's GitHub notes.
 */
export const Route = createFileRoute('/changelog')({
  loader: () => getReleases(),
  head: () => innerPageHead(page),
  component: Changelog,
})

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })
// Built from our own name only. A tag from GitHub never goes into a pattern: braces in it
// would make RegExp throw.
const NAME_PREFIX = new RegExp(`^${site.name}\\s+`, 'iu')
const LEADING_V = /^v/iu

/** True if a release name only repeats its tag, as in "Arakun v0.1.0", "v0.1.0" or "0.1.0". */
function repeatsTag(name: string, tag: string) {
  const version = (text: string) => text.replace(LEADING_V, '').toLowerCase()
  return version(name.replace(NAME_PREFIX, '')) === version(tag)
}

function ReleaseNotes({ release }: { release: Release }) {
  const { note } = release
  if (note) {
    return (
      <ul className="areas">
        {note.changes.map(([area, change], i) => (
          // Workers AI may name an area twice.
          // biome-ignore lint/suspicious/noArrayIndexKey: the list never changes order.
          <li key={`${i}-${area}`}>
            <b>{area}</b>
            <span>{change}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (release.body) {
    return <Markdown source={release.body} />
  }
  return <p className="none">This release has no written notes.</p>
}

function ReleaseEntry({ release }: { release: Release }) {
  const { note } = release
  // "Arakun v0.1.0" says nothing the version beside it doesn't: prefer the written title.
  const plainName = repeatsTag(release.name, release.tag)
  const title = plainName ? (note?.title ?? release.name) : release.name
  return (
    <article className="re" id={release.tag}>
      <div className="v">
        <span className="ver">{release.tag}</span>
        {release.publishedAt ? (
          <time className="d" dateTime={release.publishedAt}>
            {day.format(new Date(release.publishedAt))}
          </time>
        ) : null}
        {release.prerelease ? <StatusPill label="Pre-release" tone="attention" /> : null}
      </div>
      <div className="c">
        <h2>{title}</h2>
        <ReleaseNotes release={release} />
        {release.rewritten ? (
          <p className="by mono-label">Summarized by Workers AI from the GitHub notes</p>
        ) : null}
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
          {releases.length === 1
            ? 'That is the whole history so far.'
            : 'That is the whole history.'}
        </p>
      </section>

      <InstallBand />
    </>
  )
}
