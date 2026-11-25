import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { reopenConsent, useAnalytics } from '#/analytics'
import { PageHeader } from '#/components/ui'
import { innerPageHead } from '#/seo'
import { pages, site } from '#/site'

const page = pages.privacy

export const Route = createFileRoute('/privacy')({
  head: () => innerPageHead(page),
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
      <PageHeader label={page.label} lead={page.lead} num={page.num} title={page.title} />
      <div className="wrap">
        <article className="prose privacy">
          <Section title="Who runs this site">
            <p>
              arakun.dev is run by {site.operator.name}, {site.operator.address}.{' '}
              {site.operator.name} is also responsible for the reports the Arakun app sends.
              Questions about your data go to {mail}.
            </p>
          </Section>

          <Section title="Without your consent">
            <p>
              Until you accept the cookie banner, the site sets no cookie and loads no analytics. It
              keeps two things in your browser's local storage, and they never leave it:
            </p>
            <ul>
              <li>your answer to the banner, so it does not ask again</li>
              <li>your light or dark theme</li>
            </ul>
            <p>
              Cloudflare runs the site. It sees each request, including your IP address, to deliver
              the page and keep the site safe from abuse.
            </p>
          </Section>

          <Section title="If you accept: analytics">
            <p>
              We use PostHog to learn which pages people read and where the site breaks. PostHog
              then collects:
            </p>
            <ul>
              <li>the pages you visit and the page that sent you here</li>
              <li>the links and buttons you click, but never what you type</li>
              <li>
                your browser, operating system, screen size and rough location (country and city)
              </li>
              <li>how fast pages load</li>
              <li>errors in the page</li>
            </ul>
            <p>
              PostHog stores a cookie with a random id, so it can tell one visit from the next. It
              uses your IP address to estimate your location and does not keep it. It does not
              record your screen, and it does not build a profile with your name or email: we never
              ask for them.
            </p>
            <p>We use this data only to improve the site. We do not sell it or use it for ads.</p>
          </Section>

          <Section title="Error reports from the server">
            <p>
              When the site's server fails, it reports the error to PostHog, with or without your
              consent: the address of the page without its query, the kind of request, and the
              error. It sets no cookie and does not send your IP address or browser. If you accepted
              analytics, the report carries your PostHog id, so we can see what led to the error.
            </p>
          </Section>

          <Section title="In the Arakun app">
            <p>
              The app can send crash reports and usage counts to the same PostHog project. It sends
              nothing until you answer. On first launch it asks "Send crash reports and usage
              counts?". Closing the question answers nothing, and the app asks again the next time
              it starts.
            </p>
            <p>You choose each of these on its own. Both stay off until you agree:</p>
            <ul>
              <li>
                <strong>Crash reports:</strong> when the app crashes, the error message and the
                place in the code where it happened (the stack trace). Before the message leaves
                your computer, the app replaces your home folder with <code>~</code> and removes
                paths, links, email addresses and anything that looks like a key or token. When an
                agent stops with an error, the report holds the agent's name and version number
                (only the number), a fixed category such as "rate limited" or "not signed in", the
                step that failed (such as starting the agent or a turn), the agent's error code or
                exit code, and whether the session's folder still exists. It never holds the error's
                text.
              </li>
              <li>
                <strong>Usage counts:</strong> app launched, session started (with the agent's
                name), agent turn finished, project added, environment created, a built-in view
                opened (with its name) and a browser tab opened.
              </li>
            </ul>
            <p>
              Every report carries the app's version, your operating system and its CPU
              architecture. The app never sends your prompts, the agents' replies, file contents,
              URLs or project names.
            </p>
            <p>
              Reports carry a random id, kept in a file named <code>telemetry-id</code> in the app's
              data folder. It is not tied to any account. PostHog builds no profile from it, and it
              does not keep your IP address or use it to find your location. If you delete the file,
              the app makes a new id. The <a href={`${site.docsUrl}/crash-reports`}>docs</a> say
              where the folder is.
            </p>
          </Section>

          <Section title="Feedback and surveys in the app">
            <p>
              You can tell us about a bug, a missing feature or something that is hard to use. Each
              of these sends only what is described here:
            </p>
            <ul>
              <li>
                <strong>Feedback forms:</strong> Send Feedback, or "Tell us what happened" after an
                agent error or after the app quit unexpectedly. When you press Send, the app sends
                your answers as you wrote them, even with crash reports and usage counts off.
                Pressing Send is your yes. After an error, the answer also holds the error's
                category, the agent's name and a link to the crash report, if one was sent.
              </li>
              <li>
                <strong>Your email:</strong> the feedback form asks for an email address so we can
                reply. It is optional. We use it only to answer your feedback.
              </li>
              <li>
                <strong>Surveys:</strong> short questions we write in PostHog. The app shows them
                only with usage counts on, at most once per launch. It fetches them in a request
                without your id. Whether you answer or close a survey is sent too, so we know how
                many people answer.
              </li>
              <li>
                <strong>Feedback from agents:</strong> an agent running in the app can report a
                problem in Arakun itself, only with usage counts on and at most five times an hour
                per environment. It sends the kind of report, its text and the agent's name. Before
                the text leaves your computer, the app removes paths, links, email addresses and
                anything that looks like a key or token. A notice tells you, and the Inbox shows the
                full text.
              </li>
            </ul>
            <p>
              Each answer carries the app's version, your operating system and the id in{' '}
              <code>telemetry-id</code>. It never holds your prompts, the agents' replies, file
              contents or project names, unless you write them into your answer.
            </p>
            <p>
              A bug, feature or usability report may become a public issue in the app's GitHub
              repository, so we can track it in the open. The issue holds the text with paths,
              links, email addresses and keys removed, the kind of report, the app's version and
              your operating system. It never holds your email address or your id.
            </p>
            <p>
              We handle support and feedback in PostHog. We may use AI, such as PostHog's AI
              features, to sort, summarize and help answer what you send. The AI sees the answer and
              what it carries, as described above. It makes no decision about you on its own: a
              person reads the result.
            </p>
            <p>
              We may copy feedback into Linear, the tool we use to plan our work, so we can follow
              it up. That copy holds your answer and, if you gave it, your email address.
            </p>
          </Section>

          <Section title="Why we may do this">
            <p>
              Analytics on the site, the app's crash reports and usage counts, and feedback and
              survey answers run on your consent (GDPR Art. 6(1)(a)). Server error reports run on
              our legitimate interest in keeping the site working (Art. 6(1)(f)).
            </p>
          </Section>

          <Section title="Where it is stored">
            <p>
              PostHog, Inc. stores the data from the site and the app on its servers in the United
              States, as our processor under a data processing agreement. For visitors in the EU,
              the UK and Switzerland, that agreement relies on PostHog's Data Privacy Framework
              certification and on the EU Standard Contractual Clauses.
            </p>
            <p>
              Reports that become a GitHub issue are public on GitHub, Inc.'s servers in the United
              States, and anyone can read them.
            </p>
            <p>
              Linear Orbit, Inc. stores the feedback we copy into Linear on its servers in the
              United States, as our processor under a data processing agreement that relies on the
              EU Standard Contractual Clauses.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              We keep the site's analytics and error reports, and the app's reports, feedback and
              survey answers, for one year. Then PostHog deletes them. A GitHub issue and feedback
              in Linear stay until we delete them; ask us and we will. PostHog's cookie expires
              after a year.
            </p>
          </Section>

          <Section title="Your choices">
            <ul>
              <li>
                Change your answer at any time with <ConsentLink /> in the footer. Saying no stops
                PostHog and deletes its cookie.
              </li>
              <li>
                In the app, change your answer at any time in Settings › Privacy, with the Crash
                reports and Usage counts switches. With usage counts off, the app shows no surveys
                and agents cannot send feedback.
              </li>
              <li>
                Set <code>DO_NOT_TRACK=1</code> or <code>ARAKUN_TELEMETRY=0</code> to turn both off
                and block all feedback. The app then does not ask.
              </li>
              <li>
                Delete <code>telemetry-id</code> to start again with a new id.
              </li>
              <li>
                Ask us what we hold about you, or ask us to delete it, at {mail}. For the app's
                reports, send us the id in <code>telemetry-id</code>, so we can find them.
              </li>
              <li>
                If you are in the EU or the UK, you can also complain to your data protection
                authority.
              </li>
            </ul>
          </Section>

          <p className="updated">Last updated November 25, 2026.</p>
        </article>
      </div>
    </>
  )
}

// A button where PostHog is on, so the sentence works as the control it describes.
function ConsentLink() {
  const { available } = useAnalytics()
  if (!available) {
    return <>"Cookies"</>
  }
  return (
    <button className="inline" onClick={reopenConsent} type="button">
      Cookies
    </button>
  )
}
