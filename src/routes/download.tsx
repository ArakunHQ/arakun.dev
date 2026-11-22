import { createFileRoute } from '@tanstack/react-router'
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

const platforms: {
  name: string
  downloads: Platform[]
  status: string
  tone: Tone
  note: string
}[] = [
  {
    name: 'Linux',
    downloads: ['Linux', 'Linux arm64'],
    status: 'Supported',
    tone: 'success',
    note: 'The main platform. x86_64 and arm64, on Wayland and X11.',
  },
  {
    name: 'Windows',
    downloads: ['Windows'],
    status: 'Beta',
    tone: 'attention',
    note: 'Windows 10 and 11, x86_64. No Dynamic Island yet.',
  },
  {
    name: 'macOS',
    downloads: ['macOS'],
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
            <div
              className="a"
              style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}
            >
              {platform.downloads.map((download) => (
                // One amber primary per view: only the main Linux build gets it.
                <DownloadButton
                  key={download}
                  platform={download}
                  tone={download === 'Linux' ? 'primary' : 'secondary'}
                />
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="wrap" style={{ paddingTop: 'var(--spacing-6)' }}>
        <article className="pc">
          <div className="h">
            <h2>Server</h2>
            <StatusPill label="Linux x86_64 · arm64" tone="draft" />
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
            <a className="btn" data-tone="secondary" href={`${site.docsUrl}/server`}>
              Set up the server
            </a>
            {latest.server.x86_64 ? (
              <a className="btn" data-tone="ghost" href={latest.server.x86_64}>
                Download arakun-server
              </a>
            ) : null}
            {latest.server.arm64 ? (
              <a className="btn" data-tone="ghost" href={latest.server.arm64}>
                Download arakun-server for arm64
              </a>
            ) : null}
          </div>
        </article>
      </section>

      <section className="wrap section" data-reveal="">
        <div className="stack" style={{ maxWidth: 720 }}>
          <h2 className="h2">After the install line</h2>
          <p className="lead">
            Versions, nightlies, uninstalling and the server are in the{' '}
            <a href={`${site.docsUrl}/install`}>install guide</a>.
          </p>
        </div>
        <div className="grid-3" style={{ marginTop: 'var(--spacing-12)' }}>
          <Principle
            body="The installer downloads the latest release, checks it against SHA256SUMS and installs it for your user. With minisign or OpenSSL 3 it also checks the release signature."
            num="Checked"
            title="Verified before it installs"
          />
          <Principle
            body="Every 6 hours a release asks GitHub for a newer one and installs it when you quit. Turn it off in Settings › General › Updates."
            num="Updates"
            title="Keeps itself up to date"
          />
          <Principle
            body="glibc 2.35 or newer (Ubuntu 22.04+, Debian 12+, Fedora 36+), a Vulkan driver, and Wayland or X11. Without a GPU, Mesa's software Vulkan driver works, only slower."
            num="Linux"
            title="What Linux needs"
          />
        </div>
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
