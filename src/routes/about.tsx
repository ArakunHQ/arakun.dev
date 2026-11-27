import { createFileRoute, Link } from '@tanstack/react-router'
import { authors } from '#/blog-data'
import { Avatar } from '#/components/blog'
import { Eyebrow, InstallBand, PageHeader, Principle, useLatest } from '#/components/ui'
import type { Release } from '#/releases'
import { getReleases } from '#/releases'
import { innerPageHead } from '#/seo'
import { agents, pages, site } from '#/site'

const page = pages.about

export const Route = createFileRoute('/about')({
  loader: () => getReleases(),
  head: () => innerPageHead(page),
  component: About,
})

/**
 * The bios here are longer than the blog's. Photos, roles and links come from the blog
 * authors, so both pages show the same people the same way.
 */
const team = [
  {
    author: authors['karlo-aldrete'],
    place: 'Mexico',
    email: site.teamEmails['karlo-aldrete'],
    bio: 'Karlo started Arakun. He thinks software should work while you sleep. He has not tested this personally; he stays up to watch it. He shapes what Arakun does next and talks to the people who use it.',
  },
  {
    author: authors['rik-visser'],
    place: 'Netherlands',
    email: site.teamEmails['rik-visser'],
    bio: 'Rik is a software engineer. He builds much of Arakun: the Rust app, the website and the docs. He is Dutch, so he writes short sentences and says what he means. Every page on this site had to get past him.',
  },
]

const beliefs = [
  {
    num: 'Native',
    title: 'Native and fast',
    body: 'One Rust binary that draws its own window on the GPU. No web view, and no waiting.',
  },
  {
    num: 'Open',
    title: 'Open source',
    body: `Free under ${site.license}. Read the code and build it yourself. Nobody can lock you in.`,
  },
  {
    num: 'Agents',
    title: 'Any agent',
    body: 'Claude Code, Codex, Cursor and the rest. Use the agent you like; we do not pick for you.',
  },
  {
    num: 'Private',
    title: 'Your code stays yours',
    body: 'Arakun never sends your code, your prompts or the replies. Reports stay off until you say yes.',
  },
]

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' })
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The pace so far, from the releases on GitHub. Days are counted from the first release
 * to the newest, not to today, so the server and the browser always agree.
 * Undefined when GitHub could not be reached and only fallback releases are known.
 */
function paceOf(releases: Release[]) {
  const dates = releases
    .filter((release) => !release.prerelease)
    .map((release) => release.publishedAt)
    .filter((date) => date !== null)
    .sort()
  const first = dates.at(0)
  const last = dates.at(-1)
  if (!(first && last)) {
    return
  }
  const days = Math.floor((Date.parse(last) - Date.parse(first)) / DAY_MS) + 1
  return { releases: dates.length, days, last }
}

function About() {
  const releases = Route.useLoaderData()
  const latest = useLatest()
  const pace = paceOf(releases)
  const latestDate = pace ? day.format(new Date(pace.last)) : site.released

  return (
    <>
      <PageHeader {...page} />

      <section className="wrap section about-story" data-reveal="">
        <div className="stack">
          <Eyebrow label="Why" num="01" />
          <h2 className="h2">It got messy fast</h2>
        </div>
        <div className="about-prose">
          <p>
            We met online in October 2026, in the PostHog developer community. We both ran coding
            agents every day, and soon several at once. It got messy fast: terminal tabs everywhere,
            agents editing the same files, and every agent with its own app.
          </p>
          <p>
            We wanted one fast, native window where any agent works on its own git worktree. Open
            source, so nobody can lock you in. That became Arakun.
          </p>
        </div>
      </section>

      {pace ? (
        <section className="wrap" data-reveal="">
          <div className="about-stats">
            <div>
              <b>{pace.releases}</b>
              <span>releases</span>
            </div>
            <div>
              <b>{pace.days}</b>
              <span>{pace.days === 1 ? 'day' : 'days'} since v0.1.0</span>
            </div>
            <div>
              <b>{agents.length}</b>
              <span>agents supported</span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="wrap section" data-reveal="">
        <div className="stack">
          <Eyebrow label="Team" num="02" />
          <h2 className="h2">Who we are</h2>
        </div>
        <div className="about-team">
          {team.map(({ author, place, email, bio }) => (
            <article className="about-person" key={author.id}>
              <Avatar author={author} size="lg" />
              <div className="who">
                <h3>{author.name}</h3>
                <span className="mono-label">
                  {author.role} · {place}
                </span>
              </div>
              <p>{bio}</p>
              <div className="links">
                <a href={`mailto:${email}`}>{email}</a>
                {author.links.map((link) => (
                  <a href={link.url} key={link.url}>
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section about-split" data-reveal="">
        <div className="stack">
          <Eyebrow label="So far" num="03" />
          <h2 className="h2">The short history</h2>
        </div>
        <ol className="about-timeline">
          <li>
            <time>October 2026</time>
            <h3>We meet</h3>
            <p>Online, in the PostHog developer community.</p>
          </li>
          <li>
            <time dateTime="2026-11-14">November 14, 2026</time>
            <h3>The first commit</h3>
            <p>And v0.1.0 on GitHub the same day.</p>
          </li>
          <li data-now="">
            <time>{latestDate}</time>
            <h3>v{latest.version}</h3>
            <p>
              The newest release. See what changed in the <Link to="/changelog">changelog</Link>.
            </p>
          </li>
        </ol>
      </section>

      <section className="wrap section" data-reveal="">
        <div className="stack">
          <Eyebrow label="What we believe" num="04" />
          <h2 className="h2">Four things we will not trade</h2>
        </div>
        <div className="grid-4 about-beliefs">
          {beliefs.map((belief) => (
            <Principle key={belief.num} {...belief} />
          ))}
        </div>
      </section>

      <section className="wrap section about-cards" data-reveal="">
        <article className="about-card">
          <Eyebrow label="Open source" num="05" />
          <h2>Build it with us</h2>
          <p>
            All of Arakun is on GitHub under {site.license}. Report a bug, suggest a feature or send
            a pull request.
          </p>
          <div className="links">
            <a href={site.githubUrl}>Source on GitHub</a>
            <a href={site.issuesUrl}>Issues</a>
            <a href={site.contributingUrl}>Contributing guide</a>
            <a href={site.licenseUrl}>License</a>
          </div>
        </article>
        <article className="about-card">
          <Eyebrow label="Contact" num="06" />
          <h2>Talk to us</h2>
          <p>Questions about the app go to support. You can also write to Karlo or Rik directly.</p>
          <div className="links">
            <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
            {team.map(({ email }) => (
              <a href={`mailto:${email}`} key={email}>
                {email}
              </a>
            ))}
          </div>
        </article>
      </section>

      <InstallBand />
    </>
  )
}
