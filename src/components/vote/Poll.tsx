import type { Connection, Option, PollState } from '#/live'
import { OPTIONS } from '#/live'

const percent = (count: number, total: number) => (total ? Math.round((count / total) * 100) : 0)

export const votes = (n: number) => `${n} ${n === 1 ? 'vote' : 'votes'}`

/** The four answers. Before a vote they are buttons; after it, live bars you can still tap. */
export function Answers({
  state,
  onVote,
  results,
}: {
  state: PollState
  onVote?: (option: Option) => void
  results: boolean
}) {
  const open = state.status === 'open' && onVote !== undefined
  return (
    <ol className="answers" data-results={results ? '' : undefined}>
      {OPTIONS.map((label, i) => {
        const option = (i + 1) as Option
        const count = state.counts[i] ?? 0
        const share = percent(count, state.total)
        const mine = state.mine === option
        return (
          <li key={label}>
            <button
              aria-pressed={onVote ? mine : undefined}
              className="answer"
              data-mine={mine ? '' : undefined}
              data-winner={state.winner === option ? '' : undefined}
              disabled={!open}
              onClick={() => onVote?.(option)}
              type="button"
            >
              {results ? <span className="bar" style={{ width: `${share}%` }} /> : null}
              <span className="num">{option}</span>
              <span className="label">{label}</span>
              {results ? (
                <span className="count">
                  <b>{share}%</b>
                  <span>{count}</span>
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function LiveDot({ connection }: { connection: Connection }) {
  const label = {
    connecting: 'Connecting',
    live: 'Live',
    polling: 'Reconnecting',
  }[connection]
  return (
    <span className="live-dot" data-connection={connection}>
      <i />
      {label}
    </span>
  )
}
