import { createFileRoute } from '@tanstack/react-router'
import {
  AppShot,
  Eyebrow,
  FeatureCard,
  InstallBand,
  PageHeader,
  Principle,
  SessionRow,
} from '#/components/ui'
import { innerPageHead } from '#/seo'
import { pages, sessions, site } from '#/site'

const page = pages.features

// Half the page beside its text, so a smaller capture is enough.
const TOUR_SIZES = '(min-width: 1280px) 640px, (min-width: 900px) 55vw, 100vw'

/** A closer look at three parts of the app, each with a real capture in both themes. */
const tour = [
  {
    shot: 'diff',
    label: 'Review',
    title: 'Read every change before it lands',
    body: "A session's diff opens in a tab, next to the files it changed. Commit, open a pull request or merge from the same panel. The session's agent can write the commit message.",
  },
  {
    shot: 'palette',
    label: 'Palette',
    title: 'One palette for everything',
    body: 'Ctrl+K finds sessions, files, pull requests and what agents remember, and runs every command with its shortcut beside it. Ctrl+Enter asks an agent instead.',
  },
  {
    shot: 'customize',
    label: 'Customize',
    title: 'Make it yours, and watch it change',
    body: 'Seven color schemes in dark and light, more contrast and colorblind diff colors. The Customize panel opens beside your work, so you see each change at once.',
  },
] as const

export const Route = createFileRoute('/features')({
  head: () => innerPageHead(page),
  component: Features,
})

function Features() {
  return (
    <>
      <PageHeader {...page} />

      <section className="wrap" style={{ paddingTop: 'var(--spacing-16)' }}>
        <AppShot eager />
      </section>

      <section className="wrap section tour">
        {tour.map((row, i) => (
          <div className="tour-row" data-reveal="" key={row.shot}>
            <div className="stack">
              <Eyebrow label={row.label} num={`0${i + 1}`} />
              <h2 className="h2">{row.title}</h2>
              <p className="lead">{row.body}</p>
            </div>
            <AppShot name={row.shot} sizes={TOUR_SIZES} />
          </div>
        ))}
      </section>

      <section className="wrap section cards" data-reveal="">
        <FeatureCard
          body="Agents work on separate branches in separate folders, so they don't step on each other."
          label="Worktrees"
          title="Each task gets its own worktree"
        >
          <div className="term">
            <i>$ </i>
            <b>git worktree list</b>
            {'\n'}~/code/relay a41c9e2 [main]
            {'\n'}~/code/relay/env/brave-otter 7f03b1d <u>[env/brave-otter]</u>
            {'\n'}~/code/relay/env/quiet-heron 2c8e554 [env/quiet-heron]
            {'\n'}~/code/relay/env/slow-lynx e19a0b7 [env/slow-lynx]
            {'\n'}~/code/relay/env/pale-finch 5d77f30 [env/pale-finch]
          </div>
        </FeatureCard>
        <FeatureCard
          body="An agent can open pages, read terminals, run the project check and leave review drafts."
          label="The arakun command"
          title="Agents can use the app"
        >
          <div className="term">
            <i>$ </i>
            <b>arakun browse</b> -s <u>localhost:5173</u>
            {'\n'}
            <i>$ </i>
            <b>arakun logs</b> 2 --until compiled
            {'\n'}
            <i>$ </i>
            <b>arakun check</b>
          </div>
        </FeatureCard>
        <FeatureCard
          body="You hear when a session finishes, fails or needs an answer. Agent, place and result."
          label="Inbox · Dynamic Island · phone remote"
          title="Know what they are doing"
        >
          <div className="feed">
            {sessions
              .filter((session) => session.tone !== 'attention')
              .map((session) => (
                <SessionRow key={session.text} {...session} />
              ))}
          </div>
        </FeatureCard>
        <FeatureCard
          body="Arakun Black is the default. Light mode is the same screen on white."
          label="Themes"
          title="Black or white"
        >
          <AppShot theme="opposite" />
        </FeatureCard>
      </section>

      <section className="wrap section grid-3" data-reveal="">
        <Principle
          body="Arakun is rendered on the GPU. It opens fast and stays fast with many sessions running."
          num="Native"
          title="A Rust app, not a web view"
        />
        <Principle
          body="arakun-server runs sessions on a build box or a VPS with no display. The app and your phone follow them from anywhere."
          num="Server"
          title="Agents that keep working"
        />
        <Principle
          body="The source is on GitHub. Linux is supported. Windows and macOS are in beta."
          num="Open"
          title={`Free under ${site.license}`}
        />
      </section>

      <InstallBand />
    </>
  )
}
