import { createFileRoute } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useEffect, useId, useState } from 'react'
import { Answers, LiveDot, votes } from '#/components/vote/Poll'
import type { PollState } from '#/live'
import { liveEndpoint, useLivePoll } from '#/live'
import voteCss from '#/vote.css?url'

/**
 * The speaker's controls for /vote, made for a phone: open, close, reset. The token is
 * the arakun-live Worker's ADMIN_TOKEN secret; the Worker checks it, this page only
 * keeps it in localStorage so it is typed once.
 */
export const Route = createFileRoute('/vote/admin')({
  head: () => ({
    meta: [{ title: 'Poll admin · Arakun' }, { name: 'robots', content: 'noindex' }],
    links: [{ rel: 'stylesheet', href: voteCss }],
  }),
  component: Admin,
})

const TOKEN_KEY = 'live-admin-token'
const RESET_ARM_MS = 3000

type Action = 'open' | 'close' | 'reset'

function Admin() {
  const { state, connection } = useLivePoll()
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState<Action | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resetArmed, setResetArmed] = useState(false)

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY) ?? '')
    } catch {
      setToken('')
    }
  }, [])

  useEffect(() => {
    if (!resetArmed) {
      return
    }
    const timer = setTimeout(() => setResetArmed(false), RESET_ARM_MS)
    return () => clearTimeout(timer)
  }, [resetArmed])

  const saveToken = (value: string) => {
    setToken(value)
    try {
      if (value) {
        localStorage.setItem(TOKEN_KEY, value)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch {
      // Storage blocked: the token holds for this page only.
    }
  }

  const act = async (action: Action) => {
    if (action === 'reset' && !resetArmed) {
      setResetArmed(true)
      return
    }
    setResetArmed(false)
    setBusy(action)
    setMessage(null)
    try {
      const response = await fetch(liveEndpoint(`/admin/${action}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = (await response.json()) as PollState | { error: string }
      if ('error' in body) {
        setMessage(body.error)
        if (response.status === 401) {
          saveToken('')
        }
      } else {
        setMessage(done(action))
      }
    } catch {
      setMessage('Could not reach the poll.')
    } finally {
      setBusy(null)
    }
  }

  if (token === null) {
    return null
  }

  return (
    <div className="vote vote-admin">
      <header className="vote-top">
        <a className="vote-brand" href="/vote">
          <img alt="" height="24" src="/brand/app-icon.svg" width="24" />
          Poll admin
        </a>
        <LiveDot connection={connection} />
      </header>

      {token ? (
        <>
          <section className="admin-status">
            <span className="admin-state" data-status={state?.status}>
              {state ? state.status : '…'}
            </span>
            <span>{votes(state?.total ?? 0)}</span>
            <span>{pages(state?.online ?? 0)}</span>
            {state?.winner ? <span>Winner #{state.winner}</span> : null}
          </section>

          <div className="admin-actions">
            <button
              className="admin-btn"
              data-action="open"
              disabled={busy !== null}
              onClick={() => act('open')}
              type="button"
            >
              Open
            </button>
            <button
              className="admin-btn"
              data-action="close"
              disabled={busy !== null}
              onClick={() => act('close')}
              type="button"
            >
              Close
            </button>
            <button
              className="admin-btn"
              data-action="reset"
              data-armed={resetArmed ? '' : undefined}
              disabled={busy !== null}
              onClick={() => act('reset')}
              type="button"
            >
              {resetArmed ? 'Tap again to reset' : 'Reset'}
            </button>
          </div>
          <p className="vote-note" role="status">
            {message ?? 'Close shows every page the demo that won. Reset clears the votes.'}
          </p>

          {state ? <Answers results state={state} /> : null}

          <button className="admin-forget" onClick={() => saveToken('')} type="button">
            Forget the token
          </button>
        </>
      ) : (
        <TokenForm onSave={saveToken} />
      )}
    </div>
  )
}

const pages = (n: number) => `${n} ${n === 1 ? 'page' : 'pages'} open`

function done(action: Action) {
  if (action === 'open') {
    return 'The poll is open.'
  }
  return action === 'close' ? 'Closed. Every page shows the winner.' : 'Reset. The votes are gone.'
}

function TokenForm({ onSave }: { onSave: (token: string) => void }) {
  const id = useId()
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSave(value.trim())
    }
  }
  return (
    <form className="admin-token" onSubmit={submit}>
      <label htmlFor={id}>Admin token</label>
      <input
        autoCapitalize="off"
        autoComplete="off"
        id={id}
        onChange={(e) => setValue(e.target.value)}
        type="password"
        value={value}
      />
      <button className="admin-btn" data-action="open" type="submit">
        Save
      </button>
      <p className="vote-note">
        The ADMIN_TOKEN secret of the arakun-live Worker. It stays in this browser.
      </p>
    </form>
  )
}
