import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Each demo plays itself as a short loop, so nobody has to find out where to tap.
 * A fake pointer (a finger ring on a phone) does the hover, tap or hold on screen.
 * Touching or hovering the demo stops the loop and hands it to the viewer; after a
 * few seconds without input the loop starts over.
 */

export interface Step {
  /** What the pointer does once there. A press stays down until the step ends. */
  act?: 'tap' | 'press' | 'hover'
  /** Time from the action to the next step. */
  after?: number
  do?: () => void
  /** The pointer leaves once the action has shown. */
  leave?: boolean
  /** A selector inside the stage; the pointer moves there first. */
  to?: string
  /** Time from the start of the step to the action. */
  wait?: number
}

export interface Ghost {
  act: Step['act'] | 'move'
  /** Goes up on every action, so the ring plays again. */
  n: number
  shown: boolean
  x: number
  y: number
}

const LOOP_PAUSE_MS = 2200
const IDLE_MS = 5000
const FIRST_STEP_MS = 400
const LEAVE_MS = 650

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const change = () => setReduced(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  return reduced
}

export function useStory({
  steps,
  reset,
  finish,
}: {
  steps: Step[]
  /** Puts the scene back at its start. */
  reset: () => void
  /** Puts the scene at its end, for reduced motion. */
  finish: () => void
}) {
  const stage = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()
  const [auto, setAuto] = useState(true)
  const [run, setRun] = useState(0)
  const [ghost, setGhost] = useState<Ghost>({ x: 0, y: 0, shown: false, act: 'move', n: 0 })
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // The latest closures, so a running loop never calls a stale setter.
  const latest = useRef({ steps, reset, finish })
  latest.current = { steps, reset, finish }

  // biome-ignore lint/correctness/useExhaustiveDependencies: run restarts the loop on purpose.
  useEffect(() => {
    if (reduced) {
      latest.current.finish()
      return
    }
    if (!auto) {
      return
    }
    latest.current.reset()
    const home = homePosition(stage.current)
    setGhost((g) => ({ ...g, ...home, shown: false, act: 'move' }))
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const later = (ms: number, fn: () => void) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            fn()
          }
        }, ms)
      )
    }
    const play = (i: number) => {
      const list = latest.current.steps
      const step = list[i]
      if (!step) {
        setGhost((g) => ({ ...g, ...homePosition(stage.current), shown: false, act: 'move' }))
        later(LOOP_PAUSE_MS, () => setRun((r) => r + 1))
        return
      }
      if (step.to) {
        const at = targetPosition(stage.current, step.to)
        if (at) {
          setGhost((g) => ({ ...g, ...at, shown: true, act: 'move' }))
        }
      }
      later(step.wait ?? 0, () => {
        if (step.act) {
          const { act } = step
          setGhost((g) => ({ ...g, act, n: g.n + 1 }))
        }
        step.do?.()
        if (step.leave) {
          later(LEAVE_MS, () =>
            setGhost((g) => ({ ...g, ...homePosition(stage.current), shown: false, act: 'move' }))
          )
        }
        later(step.after ?? 0, () => {
          setGhost((g) => (g.act === 'press' ? { ...g, act: 'move' } : g))
          play(i + 1)
        })
      })
    }
    later(FIRST_STEP_MS, () => play(0))
    return () => {
      cancelled = true
      for (const timer of timers) {
        clearTimeout(timer)
      }
    }
  }, [run, auto, reduced])

  useEffect(() => () => clearTimeout(idle.current), [])

  /** The viewer took over: stop the loop, and start it again once they leave it alone. */
  const interact = () => {
    if (reduced) {
      return
    }
    setAuto(false)
    setGhost((g) => ({ ...g, shown: false }))
    clearTimeout(idle.current)
    idle.current = setTimeout(() => {
      setAuto(true)
      setRun((r) => r + 1)
    }, IDLE_MS)
  }

  const replay = () => {
    clearTimeout(idle.current)
    setAuto(true)
    setRun((r) => r + 1)
  }

  const bind = {
    ref: stage,
    onPointerDown: interact,
    onPointerMove: (e: { pointerType: string }) => {
      if (e.pointerType === 'mouse') {
        interact()
      }
    },
    onKeyDown: interact,
  }

  return { bind, ghost, auto, reduced, replay }
}

function homePosition(stage: HTMLElement | null) {
  if (!stage) {
    return { x: 0, y: 0 }
  }
  return { x: stage.clientWidth * 0.62, y: stage.clientHeight + 24 }
}

function targetPosition(stage: HTMLElement | null, selector: string) {
  const target = stage?.querySelector(selector)
  if (!(stage && target)) {
    return null
  }
  const box = stage.getBoundingClientRect()
  const r = target.getBoundingClientRect()
  return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }
}

/** The pointer: an arrow with a mouse, a finger ring on a phone-sized layout. */
export function GhostPointer({ ghost }: { ghost: Ghost }) {
  return (
    <span
      aria-hidden="true"
      className="ghost"
      data-act={ghost.act}
      data-shown={ghost.shown ? '' : undefined}
      style={{ '--gx': `${ghost.x}px`, '--gy': `${ghost.y}px` } as CSSProperties}
    >
      <span className="ghost-ring" key={ghost.n} />
      <span className="ghost-finger" />
      <svg aria-hidden="true" className="ghost-arrow" height="22" viewBox="0 0 16 22" width="16">
        <path
          d="M1 1L1 17.5L5.2 13.6L8 20.2L10.9 19L8.2 12.6L14 12.6Z"
          fill="#ffffff"
          stroke="#000000"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
      </svg>
    </span>
  )
}

/** The step captions under a demo, with a dot per step and a replay button. */
export function StoryBar({
  beats,
  current,
  auto,
  reduced,
  onReplay,
}: {
  beats: string[]
  current: number
  auto: boolean
  reduced: boolean
  onReplay: () => void
}) {
  if (reduced) {
    return (
      <ol className="story-all">
        {beats.map((beat, i) => (
          <li key={beat}>
            <b>{i + 1}</b> {beat}
          </li>
        ))}
      </ol>
    )
  }
  return (
    <div className="story-bar">
      <div aria-hidden="true" className="story-steps">
        {beats.map((beat, i) => (
          <i data-on={i <= current ? '' : undefined} key={beat} />
        ))}
      </div>
      <p aria-live="polite" className="story-caption" key={current}>
        <b>{current + 1}</b> · {beats[current]}
      </p>
      <div className="story-actions">
        {auto ? null : <span className="story-paused">Your turn</span>}
        <button className="demo-replay" onClick={onReplay} type="button">
          Replay
        </button>
      </div>
    </div>
  )
}

/** The stage around a demo: the pointer draws over it. */
export function Stage({
  bind,
  ghost,
  className,
  children,
}: {
  bind: ReturnType<typeof useStory>['bind']
  ghost: Ghost
  className: string
  children: ReactNode
}) {
  return (
    <div className={`story-stage ${className}`} {...bind}>
      {children}
      <GhostPointer ghost={ghost} />
    </div>
  )
}
