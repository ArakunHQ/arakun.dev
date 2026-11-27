import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import type { FormEvent } from 'react'
import { useId, useState } from 'react'
import { Eyebrow, InstallBand, PageHeader, StatusPill } from '#/components/ui'
import { innerPageHead } from '#/seo'
import { pages, site } from '#/site'
import type { ProFeatureId } from '#/waitlist'
import { joinWaitlist, proFeatures } from '#/waitlist'

const page = pages.pro

export const Route = createFileRoute('/pro')({
  head: () => innerPageHead(page),
  component: Pro,
})

const free = [
  'Every agent, side by side, each on its own git worktree',
  'The arakun command, the Inbox and the Dynamic Island',
  'The phone remote on your network, over Tailscale or through the relay',
  `The whole app, open source under ${site.license}`,
]

function Pro() {
  return (
    <>
      <PageHeader {...page} />

      <section className="wrap" data-reveal="">
        <Waitlist />
      </section>

      <section className="wrap section" data-reveal="">
        <div className="stack">
          <Eyebrow label="What Pro adds" num="01" />
          <h2 className="h2">For when one computer is not enough</h2>
        </div>
        <div className="pro-features">
          {proFeatures.map((feature) => (
            <article className="pro-feature" key={feature.id}>
              <StatusPill label={feature.name} tone="accent" />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section about-split" data-reveal="">
        <div className="stack">
          <Eyebrow label="Still free" num="02" />
          <h2 className="h2">The app stays free</h2>
        </div>
        <div className="pro-free">
          <p>
            Pro pays for what runs on our servers. Everything on your own computer stays free and
            open source. Nothing moves behind a paywall.
          </p>
          <ul>
            {free.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <InstallBand note="Arakun Pro will run on top of the free app." />
    </>
  )
}

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

function Waitlist() {
  const send = useServerFn(joinWaitlist)
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [interests, setInterests] = useState<ProFeatureId[]>([])
  const id = useId()

  const toggle = (feature: ProFeatureId) =>
    setInterests((current) =>
      current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    )

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState({ kind: 'sending' })
    try {
      await send({
        data: {
          email: String(form.get('email') ?? ''),
          interests,
          website: String(form.get('website') ?? ''),
        },
      })
      setState({ kind: 'done' })
    } catch (error) {
      const message =
        error instanceof Error && error.message.startsWith('Enter')
          ? error.message
          : 'That did not work. Try again in a minute.'
      setState({ kind: 'error', message })
    }
  }

  if (state.kind === 'done') {
    return (
      <div aria-live="polite" className="pro-join" data-done="">
        <StatusPill label="On the list" tone="success" />
        <h2>Thanks. You are on the list.</h2>
        <p>
          We will write when Arakun Pro opens. Until then, the free app does a lot:{' '}
          <Link to="/download">download it</Link>.
        </p>
      </div>
    )
  }

  return (
    <form className="pro-join" onSubmit={onSubmit}>
      <h2>Join the waitlist</h2>
      <div className="row">
        <label className="sr-only" htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          autoComplete="email"
          id={`${id}-email`}
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <button
          className="btn"
          data-tone="primary"
          disabled={state.kind === 'sending'}
          type="submit"
        >
          {state.kind === 'sending' ? 'Joining…' : 'Join the waitlist'}
        </button>
      </div>
      {/* Hidden from people and screen readers. A bot that fills it in is ignored. */}
      <input
        aria-hidden="true"
        autoComplete="off"
        className="pro-trap"
        name="website"
        tabIndex={-1}
      />
      <fieldset>
        <legend className="mono-label">What do you want most? (optional)</legend>
        <div className="chips">
          {proFeatures.map((feature) => (
            <label className="chip" key={feature.id}>
              <input
                checked={interests.includes(feature.id)}
                onChange={() => toggle(feature.id)}
                type="checkbox"
              />
              <span>{feature.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.kind === 'error' ? (
        <p className="err" role="alert">
          {state.message}
        </p>
      ) : null}
      <p className="fine">
        We use your address only to tell you about Arakun Pro, and delete it when you ask. See{' '}
        <Link to="/privacy">privacy</Link>.
      </p>
    </form>
  )
}
