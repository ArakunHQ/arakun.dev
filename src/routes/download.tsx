import { createFileRoute } from '@tanstack/react-router'
import { DownloadButton, InstallLine, PageHeader, Principle, StatusPill } from '#/components/ui'
import type { Tone } from '#/components/ui'
import { site } from '#/site'
import type { Platform } from '#/site'

export const Route = createFileRoute('/download')({
  head: () => ({ meta: [{ title: `Download · ${site.name}` }] }),
  component: Download,
})

const platforms: { name: string; download?: Platform; status: string; tone: Tone; note: string }[] = [
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
    status: 'Experimental',
    tone: 'draft',
    note: `Apple silicon. Little tested. Release v${site.version} has no macOS build.`,
  },
]

function Download() {
  return (
    <>
      <PageHeader
        num="02"
        label="Download"
        title="Install Arakun"
        lead={`One line in a terminal, or download the build for your platform. Free and open source under ${site.license}.`}
      />

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

      <section className="wrap grid-3" style={{ paddingTop: 'var(--spacing-16)', gap: 'var(--spacing-6)' }}>
        {platforms.map((platform) => (
          <article className="pc" key={platform.name}>
            <div className="h">
              <h3>{platform.name}</h3>
              <StatusPill tone={platform.tone} label={platform.status} />
            </div>
            <p>{platform.note}</p>
            <div className="a">
              {platform.download ? (
                // One amber primary per view: only the supported platform gets it.
                <DownloadButton platform={platform.download} tone={platform.name === 'Linux' ? 'primary' : 'secondary'} />
              ) : (
                <a className="btn" data-tone="secondary" href={site.sourceUrl}>
                  Build from source
                </a>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="wrap section grid-3" data-reveal="">
        <Principle
          num="Open"
          title={`Free under ${site.license}`}
          body="The source is on GitHub. Read it, build it, change it."
        />
        <Principle
          num="Native"
          title="A Rust app, not a web view"
          body="Arakun is rendered on the GPU. It opens fast and stays fast with many sessions running."
        />
        <Principle
          num="Agents"
          title="Bring your own agents"
          body="Arakun does not bundle Claude Code, Droid or OpenCode. Install the ones you want to use."
        />
      </section>
    </>
  )
}
