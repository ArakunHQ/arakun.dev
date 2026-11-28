import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldAlert } from './icons'
import { Raccoon } from './Raccoon'
import { useFit } from './use-fit'

// The Dynamic Island as the app draws it (core/src/island.rs, src/shell/island.rs).
// Sizes are the app's, in a 480-wide scene scaled down to fit a phone.

type Status = 'working' | 'waiting' | 'error'
type Phase = 'busy' | 'card' | 'later' | 'opened' | 'running' | 'done' | 'denied'

const SCENE_W = 480
const MODEL = 'Opus 5.5'
const COMMAND = 'npx wrangler deploy'
/** The app drops a card under the island once a session waits on you. */
const CARD_AFTER_MS = 1100
/** The buttons on a card show only after it has been up this long (island.rs:113). */
const BUTTONS_AFTER_MS = 400

interface Row {
  cost: string
  doing: string
  elapsed: string
  model: string
  status: Status
}

const rows = (waiting: Status): Row[] => [
  { status: waiting, model: MODEL, doing: COMMAND, elapsed: '4:12', cost: '$1.84' },
  {
    status: 'error',
    model: 'GPT-5.5',
    doing: 'cargo test failed',
    elapsed: '12:41',
    cost: '$0.92',
  },
  {
    status: 'working',
    model: 'Sonnet 5.5',
    doing: 'Editing src/pricing.ts',
    elapsed: '0:58',
    cost: '$0.31',
  },
]

/** Island sizes per view (island.rs:433-446): dots are 7px with 6px gaps after x = 52. */
function islandSize(list: boolean, dots: number) {
  if (list) {
    return { w: 480, h: 40 + 3 * 34 + 6 }
  }
  return { w: 52 + dots * 7 + (dots - 1) * 6 + 16, h: 32 }
}

/** The bottom corners (island.rs:2447-2455). */
function bottomRadius(w: number, h: number) {
  const r = Math.min(Math.max(12 + (h - 32) * 0.2, 11), 30)
  return Math.min(r, h - Math.min(10, h / 2), w / 2)
}

export function IslandDemo() {
  const [phase, setPhase] = useState<Phase>('busy')
  const [list, setList] = useState(false)
  const [hot, setHot] = useState(false)
  const [run, setRun] = useState(0)
  const cardShown = useRef(0)
  const [stage, scale] = useFit<HTMLDivElement>(SCENE_W + 24)

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new run replays the scene.
  useEffect(() => {
    setPhase('busy')
    setList(false)
    setHot(false)
    const timer = setTimeout(() => {
      cardShown.current = Date.now()
      setPhase('card')
    }, CARD_AFTER_MS)
    return () => clearTimeout(timer)
  }, [run])

  useEffect(() => {
    if (phase !== 'running') {
      return
    }
    const timer = setTimeout(() => setPhase('done'), 2600)
    return () => clearTimeout(timer)
  }, [phase])

  const answered = phase === 'running' || phase === 'done' || phase === 'denied'
  const waiting: Status = answered ? 'working' : 'waiting'
  const sessions = rows(waiting)
  // The island lists active sessions in its sort order: waiting, error, working.
  const dots = sessions.map((row) => row.status)
  const size = islandSize(list && phase !== 'card', dots.length)
  const radius = bottomRadius(size.w, size.h)
  const card = phase === 'card'

  const reveal = () => {
    if (Date.now() - cardShown.current >= BUTTONS_AFTER_MS) {
      setHot(true)
    }
  }

  return (
    <div>
      <div className="isl-stage" ref={stage} style={{ '--fit': scale } as CSSProperties}>
        <div className="isl-scene" data-phase={phase} style={{ width: SCENE_W }}>
          <div className="isl-edge" />
          <button
            aria-expanded={list}
            aria-label={list ? 'Hide the sessions' : 'Show the sessions'}
            className="isl"
            data-list={list && !card ? '' : undefined}
            onClick={() => !card && setList((open) => !open)}
            onPointerEnter={(e) => e.pointerType === 'mouse' && !card && setList(true)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setList(false)}
            style={{ width: size.w, height: size.h, '--r': `${radius}px` } as CSSProperties}
            type="button"
          >
            <span className="isl-face">
              <Raccoon width={30} />
            </span>
            <span className="isl-dots">
              {dots.map((status, i) => (
                <i
                  data-status={status}
                  // biome-ignore lint/suspicious/noArrayIndexKey: a dot per session, in a fixed order.
                  key={i}
                  style={{ animationDelay: `${(-i / (2 * Math.PI)) * 1.6}s` }}
                />
              ))}
            </span>
            <span className="isl-list">
              <span className="isl-head">
                <b>3 agents</b>
                <span>$3.07 today</span>
              </span>
              {sessions.map((row) => (
                <span className="isl-row" key={row.model}>
                  <i data-status={row.status} />
                  <span className="m">{row.model}</span>
                  <span className="d">{row.doing}</span>
                  <span className="e">{row.elapsed}</span>
                  <span className="c">{row.cost}</span>
                </span>
              ))}
            </span>
          </button>

          {card && (
            <div
              className="isl-card"
              data-hot={hot ? '' : undefined}
              onPointerDown={reveal}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setHot(false)}
              onPointerMove={(e) => e.pointerType === 'mouse' && reveal()}
              style={{ top: size.h + 10 }}
            >
              <span className="isl-card-face">
                <Raccoon width={46} />
              </span>
              <span className="isl-card-text">
                <b>{MODEL} needs your decision</b>
                <span>{COMMAND}</span>
              </span>
              <span className="isl-card-actions">
                <button className="isl-later" onClick={() => setPhase('later')} type="button">
                  Later
                </button>
                <button className="isl-view" onClick={() => setPhase('opened')} type="button">
                  View
                  <ArrowRight size={13} />
                </button>
              </span>
            </div>
          )}

          {(phase === 'opened' ||
            phase === 'running' ||
            phase === 'done' ||
            phase === 'denied') && (
            <Session
              onAnswer={(allow) => setPhase(allow ? 'running' : 'denied')}
              phase={phase}
              top={size.h + 18}
            />
          )}
        </div>
      </div>

      <p aria-live="polite" className="demo-hint">
        {hint(phase, hot)}
        {(phase === 'later' || phase === 'done' || phase === 'denied') && (
          <button className="demo-replay" onClick={() => setRun((n) => n + 1)} type="button">
            Replay
          </button>
        )}
      </p>
    </div>
  )
}

function hint(phase: Phase, hot: boolean) {
  switch (phase) {
    case 'busy':
      return 'Three sessions run. Tap the island to see them.'
    case 'card':
      return hot ? 'View opens the session. Later lets it wait.' : 'One needs you. Tap the card.'
    case 'later':
      return 'The session keeps waiting, and its dot stays amber.'
    case 'opened':
      return 'Allow it, and the agent goes on.'
    case 'running':
      return 'Allowed. The dot turns green again.'
    case 'denied':
      return 'Denied. The agent goes on without it.'
    default:
      return 'Deployed. Nothing waits on you now.'
  }
}

/** The session the card opens, with the permission question the app shows (cards.rs:161-344). */
function Session({
  phase,
  top,
  onAnswer,
}: {
  phase: Phase
  top: number
  onAnswer: (allow: boolean) => void
}) {
  return (
    <div className="isl-session" style={{ top }}>
      <span className="isl-session-label">Opened the session</span>
      {phase === 'opened' ? (
        <div className="app-perm">
          <div className="app-perm-q">
            <ShieldAlert size={14} />
            <span>Allow run {COMMAND}?</span>
          </div>
          <code className="app-perm-cmd">{COMMAND}</code>
          <div className="app-perm-opts">
            <button
              className="app-btn"
              data-primary=""
              onClick={() => onAnswer(true)}
              type="button"
            >
              Allow<i>1</i>
            </button>
            <button className="app-btn" onClick={() => onAnswer(true)} type="button">
              Always allow<i>2</i>
            </button>
            <button className="app-btn" onClick={() => onAnswer(false)} type="button">
              Deny<i>3</i>
            </button>
            <span className="app-perm-keys">Enter allow · Esc deny</span>
          </div>
        </div>
      ) : (
        <div className="app-tool" data-state={phase}>
          <span>{toolVerb(phase)}</span>
          <code>{COMMAND}</code>
          {phase === 'running' && <i className="app-spin" />}
        </div>
      )}
    </div>
  )
}

const toolVerb = (phase: Phase) => {
  if (phase === 'running') {
    return 'Running'
  }
  return phase === 'denied' ? 'Denied' : 'Ran'
}
