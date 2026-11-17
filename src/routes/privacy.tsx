import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageHeader } from '#/components/ui'
import { reopenConsent, useAnalytics } from '#/analytics'
import { pageMeta } from '#/seo'
import { pages, site } from '#/site'

const page = pages.privacy

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: `Privacy · ${site.name}` },
      ...pageMeta({ path: page.path, title: page.title, description: page.lead }),
    ],
  }),
  component: Privacy,
})

const mail = <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Privacy() {
  return (
    <>
      <PageHeader num={page.num} label={page.label} title={page.title} lead={page.lead} />
      <div className="wrap">
        <article className="prose privacy">
          <Section title="Who runs this site">
            <p>
              arakun.dev is run by {site.operator.name}
              {site.operator.address ? `, ${site.operator.address}` : ''}. Questions about your data go to {mail}.
            </p>
          </Section>

          <Section title="Without your consent">
            <p>Until you accept the cookie banner, the site sets no cookie and loads no analytics. It keeps two things in your browser's local storage, and they never leave it:</p>
            <ul>
              <li>your answer to the banner, so it does not ask again</li>
              <li>your light or dark theme</li>
            </ul>
            <p>
              Cloudflare runs the site. It sees each request, including your IP address, to deliver the page and keep the
              site safe from abuse.
            </p>
          </Section>

          <Section title="If you accept: analytics">
            <p>We use PostHog to learn which pages people read and where the site breaks. PostHog then collects:</p>
            <ul>
              <li>the pages you visit and the page that sent you here</li>
              <li>the links and buttons you click, but never what you type</li>
              <li>your browser, operating system, screen size and rough location (country and city)</li>
              <li>how fast pages load</li>
              <li>errors in the page</li>
            </ul>
            <p>
              PostHog stores a cookie with a random id, so it can tell one visit from the next. It uses your IP address
              to estimate your location and does not keep it. It does not record your screen, and it does not build a
              profile with your name or email: we never ask for them.
            </p>
            <p>We use this data only to improve the site. We do not sell it or use it for ads.</p>
          </Section>

          <Section title="Error reports from the server">
            <p>
              When the site's server fails, it reports the error to PostHog, with or without your consent: the address
              of the page without its query, the kind of request, and the error. It sets no cookie and does not send
              your IP address or browser. If you accepted analytics, the report carries your PostHog id, so we can see
              what led to the error.
            </p>
          </Section>

          <Section title="Why we may do this">
            <p>
              Analytics run on your consent (GDPR Art. 6(1)(a)). Server error reports run on our legitimate interest in
              keeping the site working (Art. 6(1)(f)).
            </p>
          </Section>

          <Section title="Where it is stored">
            <p>
              PostHog, Inc. stores the data on its servers in the United States, as our processor under a data
              processing agreement. For visitors in the EU, the UK and Switzerland, that agreement relies on PostHog's
              Data Privacy Framework certification and on the EU Standard Contractual Clauses.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>We keep analytics and error reports for one year, then PostHog deletes them. PostHog's cookie expires after a year.</p>
          </Section>

          <Section title="Your choices">
            <ul>
              <li>
                Change your answer at any time with <ConsentLink /> in the footer. Saying no stops PostHog and deletes its
                cookie.
              </li>
              <li>Ask us what we hold about you, or ask us to delete it, at {mail}.</li>
              <li>If you are in the EU or the UK, you can also complain to your data protection authority.</li>
            </ul>
          </Section>

          <p className="updated">Last updated November 17, 2026.</p>
        </article>
      </div>
    </>
  )
}

// A button where PostHog is on, so the sentence works as the control it describes.
function ConsentLink() {
  const { available } = useAnalytics()
  if (!available) return <>"Cookies"</>
  return (
    <button type="button" className="inline" onClick={reopenConsent}>
      Cookies
    </button>
  )
}
