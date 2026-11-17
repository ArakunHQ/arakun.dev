import { createFileRoute } from '@tanstack/react-router'
import { HeroRaccoon } from '#/components/HeroRaccoon'
import {
  AppShot,
  DownloadButton,
  Eyebrow,
  InstallBand,
  InstallLine,
  Principle,
  SessionRow,
  step,
  useLatest,
  useVisitorPlatform,
  Words,
} from '#/components/ui'
import { pillars, sessions, site } from '#/site'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const platform = useVisitorPlatform()
  const latest = useLatest()
  return (
    <>
      <section className="hero">
        <div className="sky" />
        <div className="lit" />
        <div className="copy wrap">
          <span className="mono-label eyebrow rise">Native app · Linux, Windows, macOS</span>
          <h1 className="display">
            <Words text={site.line} />
          </h1>
          <p className="sub rise" style={step(0, 480)}>
            Claude Code, Droid, OpenCode and Workers AI work side by side. Each task gets its own
            git worktree, so agents don't step on each other.
          </p>
          <div className="cta rise" style={step(1, 480)}>
            <DownloadButton platform={platform} />
            <InstallLine />
          </div>
          <span className="meta rise" style={step(2, 480)}>
            v{latest.version} · {site.license} · Windows and macOS in beta
          </span>
        </div>
        <div className="peek">
          <HeroRaccoon />
        </div>
      </section>

      <section className="wrap section" data-reveal="">
        <div className="stack" style={{ maxWidth: 720 }}>
          <Eyebrow label="The app" num="01" />
          <h2 className="h2">Many agents. One calm window.</h2>
          <p className="lead">
            Pick an agent and a model, write the task, and start. Arakun makes the worktree, runs
            the session and keeps the diff ready for review.
          </p>
        </div>
        <div style={{ marginTop: 'var(--spacing-12)' }}>
          <AppShot />
        </div>
      </section>

      <section className="wrap section grid-4" data-reveal="">
        {pillars.map((pillar, i) => (
          <Principle key={pillar.title} num={`0${i + 1}`} {...pillar} />
        ))}
      </section>

      <section className="wrap section split" data-reveal="">
        <div className="stack">
          <Eyebrow label="While you are away" num="02" />
          <h2 className="h2">It tells you what happened. Then it stops.</h2>
          <p className="lead" style={{ maxWidth: 480 }}>
            Every message names the agent, the place and the result. You get it in the Dynamic
            Island, in the Inbox and on your phone.
          </p>
        </div>
        <div className="feed">
          {sessions.map((session) => (
            <SessionRow key={session.text} {...session} />
          ))}
        </div>
      </section>

      <InstallBand note="Linux supported · Windows and macOS in beta" />
    </>
  )
}
