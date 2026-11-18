import { createFileRoute, Link } from '@tanstack/react-router'
import type { Tone } from '#/components/ui'
import {
  DownloadButton,
  InstallLine,
  PageHeader,
  Principle,
  StatusPill,
  useLatest,
} from '#/components/ui'
import { innerPageHead, softwareApplication } from '#/seo'
import type { Platform } from '#/site'
import { pages, site } from '#/site'

const page = pages.download

export const Route = createFileRoute('/download')({
  head: () => innerPageHead(page, [softwareApplication]),
  component: Download,
})

const platforms: { name: string; download?: Platform; status: string; tone: Tone; note: string }[] =
  [
    {
      name: 'Linux',
      download: 'Linux',
      status: 'Supported',
      tone: 'success',
      note: 'The main platform. x86_64, on Wayland and X11.',
    },
    {
      name: 'Windows',
      download: 'Windows',
      status: 'Beta',
      tone: 'attention',
      note: 'Windows 10 and 11, x86_64. No Dynamic Island yet.',
    },
    {
      name: 'macOS',
      download: 'macOS',
      status: 'Beta',
      tone: 'attention',
      note: 'Apple silicon. Signed and notarized by Apple. No browser in release builds yet.',
    },
  ]

function Download() {
  const latest = useLatest()
  return (
    <>
      <PageHeader {...page} />

      <section className="wrap installs">
        <div>
          <span className="mono-label">macOS and Linux</span>
          <InstallLine />
        </div>
        <div>
          <span className="mono-label">Windows · PowerShell</span>
          <InstallLine shell="powershell" />
        </div>
      </section>

      <section
        className="wrap grid-3"
        style={{ paddingTop: 'var(--spacing-16)', gap: 'var(--spacing-6)' }}
      >
        {platforms.map((platform) => (
          <article className="pc" key={platform.name}>
            <div className="h">
              <h2>{platform.name}</h2>
              <StatusPill label={platform.status} tone={platform.tone} />
            </div>
            <p>{platform.note}</p>
            <div className="a">
              {platform.download ? (
                // One amber primary per view: only the supported platform gets it.
                <DownloadButton
                  platform={platform.download}
                  tone={platform.name === 'Linux' ? 'primary' : 'secondary'}
                />
              ) : (
                <a className="btn" data-tone="secondary" href={site.sourceUrl}>
                  Build from source
                </a>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="wrap" style={{ paddingTop: 'var(--spacing-6)' }}>
        <article className="pc">
          <div className="h">
            <h2>Server</h2>
            <StatusPill label="Linux x86_64" tone="draft" />
          </div>
          <p>
            Arakun without a window, for a VPS or a build box with no display. Pair your devices and
            follow its sessions from anywhere.
          </p>
          {/* As in the install lines above: as wide as the command, not the card. */}
          <div style={{ alignSelf: 'flex-start', maxWidth: '100%' }}>
            <InstallLine shell="server" />
          </div>
          <div className="a" style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
            <Link
              className="btn"
              data-tone="secondary"
              params={{ slug: 'server' }}
              to="/docs/$slug"
            >
              Set up the server
            </Link>
            {latest.server ? (
              <a className="btn" data-tone="ghost" href={latest.server}>
                Download arakun-server
              </a>
            ) : null}
          </div>
        </article>
      </section>

      <section className="wrap section grid-3" data-reveal="">
        <Principle
          body="The source is on GitHub. Read it, build it, change it."
          num="Open"
          title={`Free under ${site.license}`}
        />
        <Principle
          body="Arakun is rendered on the GPU. It opens fast and stays fast with many sessions running."
          num="Native"
          title="A Rust app, not a web view"
        />
        <Principle
          body="Arakun does not bundle Claude Code, Droid, OpenCode or Codex. Install the ones you want to use."
          num="Agents"
          title="Bring your own agents"
        />
      </section>
    </>
  )
}
