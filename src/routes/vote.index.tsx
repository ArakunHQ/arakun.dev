import { createFileRoute } from '@tanstack/react-router'
import { Demos } from '#/components/vote/Demos'
import { Answers, LiveDot, votes } from '#/components/vote/Poll'
import { OPTIONS, useLivePoll } from '#/live'
import voteCss from '#/vote.css?url'

/**
 * The audience poll for live talks: open arakun.dev/vote on a phone, pick the pain,
 * watch the bars move. When the speaker closes the poll every page switches to the
 * demo of the winner. The poll itself is the arakun-live Worker (live/README.md).
 */
export const Route = createFileRoute('/vote/')({
  head: () => ({
    meta: [
      { title: 'Live poll · Arakun' },
      { name: 'description', content: 'Which one hurts most with your coding agents today?' },
      // A page for the room, not for search.
      { name: 'robots', content: 'noindex' },
    ],
    links: [{ rel: 'stylesheet', href: voteCss }],
  }),
  component: Vote,
})

function Vote() {
  const { state, connection, error, vote } = useLivePoll()

  return (
    <div className="vote">
      <header className="vote-top">
        <a aria-label="Arakun home" className="vote-brand" href="/">
          <img alt="" height="24" src="/brand/app-icon.svg" width="24" />
          Arakun
        </a>
        <LiveDot connection={connection} />
      </header>

      {state === null && (
        <p className="vote-note" role="status">
          Loading the poll…
        </p>
      )}

      {state !== null && state.status !== 'closed' && (
        <section className="vote-poll">
          <span className="mono-label">Live poll</span>
          <h1>Which one hurts most with your coding agents today?</h1>
          <p className="vote-note" role="status">
            {note(state.status, state.mine !== null)}
          </p>
          <Answers onVote={vote} results={state.mine !== null} state={state} />
          <p className="vote-total">
            {state.mine === null ? ' ' : votes(state.total)}
            {error ? <span className="vote-error">{error}</span> : null}
          </p>
        </section>
      )}

      {state?.status === 'closed' && state.winner !== null && (
        <section className="vote-result">
          <span className="mono-label">The room picked</span>
          <p className="vote-picked">
            You picked #{state.winner} · {votes(state.counts[state.winner - 1] ?? 0)}
          </p>
          <h1>{OPTIONS[state.winner - 1]}</h1>
          <Demos winner={state.winner} />
          <details className="vote-final">
            <summary>All results · {votes(state.total)}</summary>
            <Answers results state={state} />
          </details>
        </section>
      )}
    </div>
  )
}

function note(status: 'waiting' | 'open', voted: boolean) {
  if (status === 'waiting') {
    return 'Voting opens in a moment.'
  }
  return voted
    ? 'Your vote is in. Change it until the poll closes.'
    : 'Tap one. You can change it until the poll closes.'
}
