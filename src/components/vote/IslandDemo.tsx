import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldAlert } from './icons'
import { Raccoon } from './Raccoon'
import type { Step } from './story'
import { Stage, StoryBar, useStory } from './story'
import { useFit } from './use-fit'

// The Dynamic Island as the app draws it (core/src/island.rs, src/shell/island.rs).
// Sizes are the app's, in a 480-wide scene scaled down to fit a phone.

type Status = 'working' | 'waiting' | 'error'
type Phase = 'idle' | 'busy' | 'card' | 'later' | 'opened' | 'running' | 'done' | 'denied'

const SCENE_W = 480
const MODEL = 'Opus 5.5'
const COMMAND = 'npx wrangler deploy'
/** The buttons on a card show only after it has been up this long (island.rs:113). */
const BUTTONS_AFTER_MS = 400
/** How long the card takes to melt back into the island. */
const MELT_MS = 420

const BEATS = [
  'Three agents work, a dot each',
  'One needs you, and the island says so',
  'View opens it, right where it waits',
  'Allow, and it goes on',
]

const BEAT: Record<Phase, number> = {
  idle: 0,
  busy: 0,
  card: 1,
  later: 1,
  opened: 2,
  running: 3,
  done: 3,
  denied: 3,
}

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
function islandSize(view: 'idle' | 'busy' | 'list', dots: number) {
  if (view === 'list') {
    return { w: 480, h: 40 + 3 * 34 + 6 }
  }
  if (view === 'idle') {
    return { w: 54, h: 30 }
  }
  return { w: 52 + dots * 7 + (dots - 1) * 6 + 16, h: 32 }
}

/** The bottom corners (island.rs:2447-2455). */
function bottomRadius(w: number, h: number) {
  const r = Math.min(Math.max(12 + (h - 32) * 0.2, 11), 30)
  return Math.min(r, h - Math.min(10, h / 2), w / 2)
}

export function IslandDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [list, setList] = useState(false)
  const [hot, setHot] = useState(false)
  const [melting, setMelting] = useState(false)
  const cardShown = useRef(0)
  const meltTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // The card (440) sets the width a phone has to fit; the wider list may clip a little.
  const [fit, scale] = useFit<HTMLDivElement>(452)

  useEffect(() => {
    if (phase !== 'running') {
      return
    }
    const timer = setTimeout(() => setPhase('done'), 2600)
    return () => clearTimeout(timer)
  }, [phase])

  useEffect(() => () => clearTimeout(meltTimer.current), [])

  const showCard = () => {
    cardShown.current = Date.now()
    setHot(false)
    setPhase('card')
  }

  /** The card melts back into the island, then the next phase shows. */
  const leaveCard = (next: Phase) => {
    setMelting(true)
    clearTimeout(meltTimer.current)
    meltTimer.current = setTimeout(() => {
      setMelting(false)
      setHot(false)
      setPhase(next)
    }, MELT_MS)
  }

  const story = useStory({
    reset: () => {
      clearTimeout(meltTimer.current)
      setMelting(false)
      setList(false)
      setHot(false)
      setPhase('idle')
    },
    finish: () => setPhase('done'),
    steps: [
      { wait: 700, do: () => setPhase('busy') },
      // The amber dot blinks for a while before the card drops.
      { wait: 1500, do: showCard },
      { to: '.isl-card', act: 'hover', wait: 900, do: () => setHot(true), after: 500 },
      { to: '.isl-view', act: 'tap', wait: 650, do: () => leaveCard('opened'), after: 700 },
      {
        to: '.app-perm .app-btn[data-primary]',
        act: 'tap',
        wait: 1100,
        do: () => setPhase('running'),
        after: 2900,
        leave: true,
      },
    ] satisfies Step[],
  })

  const answered = phase === 'running' || phase === 'done' || phase === 'denied'
  const waiting: Status = answered ? 'working' : 'waiting'
  const sessions = rows(waiting)
  // The island lists active sessions in its sort order: waiting, error, working.
  const dots = sessions.map((row) => row.status)
  const card = phase === 'card'
  let view: 'idle' | 'busy' | 'list' = 'busy'
  if (phase === 'idle') {
    view = 'idle'
  } else if (list && !card) {
    view = 'list'
  }
  const size = islandSize(view, dots.length)
  const radius = bottomRadius(size.w, size.h)

  const reveal = () => {
    if (Date.now() - cardShown.current >= BUTTONS_AFTER_MS) {
      setHot(true)
    }
  }

  return (
    <div>
      <Stage bind={story.bind} className="isl-outer" ghost={story.ghost}>
        <div className="isl-stage" ref={fit} style={{ '--fit': scale } as CSSProperties}>
          <div className="isl-scene" data-phase={phase} style={{ width: SCENE_W }}>
            <div className="isl-edge" />
            <button
              aria-expanded={list}
              aria-label={list ? 'Hide the sessions' : 'Show the sessions'}
              className="isl"
              data-list={view === 'list' ? '' : undefined}
              data-view={view}
              onClick={() => {
                if (phase === 'idle') {
                  setPhase('busy')
                } else if (!card) {
                  setList((open) => !open)
                }
              }}
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
                    style={{ '--i': i } as CSSProperties}
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

            {card ? (
              <div
                className="isl-card"
                data-hot={hot ? '' : undefined}
                data-melting={melting ? '' : undefined}
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
                  <button className="isl-later" onClick={() => leaveCard('later')} type="button">
                    Later
                  </button>
                  <button className="isl-view" onClick={() => leaveCard('opened')} type="button">
                    View
                    <ArrowRight size={13} />
                  </button>
                </span>
              </div>
            ) : null}

            {phase === 'opened' || answered ? (
              <Session
                onAnswer={(allow) => setPhase(allow ? 'running' : 'denied')}
                phase={phase}
                top={size.h + 18}
              />
            ) : null}
          </div>
        </div>
      </Stage>
      <StoryBar
        auto={story.auto}
        beats={BEATS}
        current={BEAT[phase]}
        onReplay={story.replay}
        reduced={story.reduced}
      />
    </div>
  )
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
          {phase === 'running' ? <i className="app-spin" /> : null}
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
