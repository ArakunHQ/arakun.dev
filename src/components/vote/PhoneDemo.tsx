import { useEffect, useRef, useState } from 'react'
import { AgentIcon, Chevron } from './icons'

// The phone remote's permission card (phone/src/components/session/PermissionCard.tsx)
// over the session from the phone's own demo (phone/src/demo.tsx). Allow is a 700 ms
// hold, so a tap in a pocket never runs a command; Always allow takes two taps.

const HOLD_MS = 700
const ARM_MS = 3000
const TOAST_MS = 2200
const COMMAND = 'cargo test --locked relay'

type Answer = 'allow' | 'always' | 'deny'
type Phase = 'asking' | 'running' | 'done' | 'denied'

export function PhoneDemo() {
  const [phase, setPhase] = useState<Phase>('asking')
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null)
  const transcript = useRef<HTMLDivElement>(null)

  const say = (text: string) => setToast({ text, id: Date.now() })

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (phase !== 'running') {
      return
    }
    const timer = setTimeout(() => setPhase('done'), 1800)
    return () => clearTimeout(timer)
  }, [phase])

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the newest entry whenever the phase adds one.
  useEffect(() => {
    const el = transcript.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [phase])

  const answer = (choice: Answer) => {
    // The toast names the option, with a check for the ones that allow (session.tsx).
    if (choice === 'deny') {
      say('Deny')
      setPhase('denied')
      return
    }
    say(choice === 'always' ? 'Always allow ✓' : 'Allow ✓')
    setPhase('running')
  }

  let toolState = 'in_progress'
  if (phase === 'done') {
    toolState = 'completed'
  } else if (phase === 'denied') {
    toolState = 'failed'
  }

  return (
    <div className="ph-stage">
      <div className="ph-frame">
        <div className="ph-top">
          <span className="ph-av">
            <AgentIcon agent="Claude Code" size={18} />
          </span>
          <span className="ph-title">
            <b>Fix the idle relay drop</b>
            <span>arakun · env/brave-otter</span>
          </span>
        </div>
        <div className="ph-transcript" ref={transcript}>
          <div className="ph-entry">
            <div className="ph-user">
              The phone drops off the relay after a minute idle. Find out why and fix it.
            </div>
            <div className="ph-meta">9:41 · Worked for 2m</div>
          </div>
          <div className="ph-entry ph-lead">
            <div className="ph-who">Claude</div>
            <p className="ph-text">
              The relay closes a socket after 60 s without traffic. A phone that only reads sends
              nothing, so it gets cut.
            </p>
          </div>
          <div className="ph-steps">
            <ToolRow add={24} del={6} state="completed" title="Edited relay/src/socket.ts" />
            <ToolRow add={11} del={2} state="completed" title="Edited phone/relay.js" />
          </div>
          <div className="ph-entry">
            <p className="ph-text">
              I added a ping every 25 s and a reconnect with backoff. Now I want to run the relay
              tests.
            </p>
          </div>
          <div className="ph-steps">
            <ToolRow command={COMMAND} state={toolState} />
          </div>
          {phase === 'done' && (
            <div className="ph-entry ph-new">
              <p className="ph-text">All 14 relay tests pass. An idle phone now stays connected.</p>
            </div>
          )}
          {phase === 'denied' && (
            <div className="ph-entry ph-new">
              <p className="ph-text">Okay, I won't run them. The change is ready when you are.</p>
            </div>
          )}
        </div>
        {phase === 'asking' && <PermissionCard onAnswer={answer} onTap={say} />}
        {phase !== 'asking' && (
          <div className="ph-composer">
            <span className="ph-placeholder">Message Claude…</span>
            {(phase === 'done' || phase === 'denied') && (
              <button className="demo-replay" onClick={() => setPhase('asking')} type="button">
                Replay
              </button>
            )}
            <span aria-hidden="true" className="ph-send" />
          </div>
        )}
        {toast ? (
          <div className="ph-toast" key={toast.id} role="status">
            {toast.text}
          </div>
        ) : null}
      </div>
      <p aria-live="polite" className="demo-hint">
        {PHONE_HINTS[phase]}
      </p>
    </div>
  )
}

const PHONE_HINTS: Record<Phase, string> = {
  asking: 'Press and hold to allow. A quick tap only shows a reminder.',
  running: 'Allowed. The agent goes on while your phone is in your pocket.',
  done: 'The tests ran. You never sat and watched.',
  denied: 'Denied. Nothing ran.',
}

function ToolRow({
  title,
  command,
  state,
  add,
  del,
}: {
  title?: string
  command?: string
  state: string
  add?: number
  del?: number
}) {
  return (
    <div className="ph-tool" data-state={state}>
      <span className="ph-ttitle">
        {command ? (
          <>
            Ran <code>{command}</code>
          </>
        ) : (
          title
        )}
        {add !== undefined && (
          <span className="ph-stats">
            <span className="add">+{add}</span> <span className="del">−{del}</span>
          </span>
        )}
      </span>
      {state === 'failed' && <span className="ph-bang">!</span>}
      {state === 'in_progress' && <span className="ph-spin" />}
    </div>
  )
}

function PermissionCard({
  onAnswer,
  onTap,
}: {
  onAnswer: (answer: Answer) => void
  onTap: (text: string) => void
}) {
  const [folded, setFolded] = useState(false)
  const [holding, setHolding] = useState(false)
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const held = useRef<boolean>(false)

  useEffect(() => {
    if (!armed) {
      return
    }
    const disarm = setTimeout(() => setArmed(false), ARM_MS)
    return () => clearTimeout(disarm)
  }, [armed])

  useEffect(() => () => clearTimeout(timer.current), [])

  const stop = () => {
    clearTimeout(timer.current)
    setHolding(false)
  }

  return (
    <div className="perm" data-folded={folded ? '' : undefined}>
      <button
        aria-expanded={!folded}
        className="phead"
        onClick={() => setFolded((f) => !f)}
        type="button"
      >
        <span className="label">
          <span className="dot" />
          Asks permission
        </span>
        <span className="kind">execute</span>
        <span className="peek">{COMMAND}</span>
        <Chevron size={16} />
      </button>
      <div className="pbody">
        <div className="what">
          <code>{COMMAND}</code>
        </div>
        <div className="where">arakun · env/brave-otter</div>
        <div className="opts">
          <button className="pbtn outline" onClick={() => onAnswer('deny')} type="button">
            Deny
          </button>
          <button
            className="pbtn hold"
            data-holding={holding ? '' : undefined}
            onClick={() => {
              // The click that ends a finished hold is not a tap.
              if (held.current) {
                held.current = false
                return
              }
              onTap('Hold to allow')
            }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerCancel={stop}
            onPointerDown={(e) => {
              e.preventDefault()
              held.current = false
              setHolding(true)
              timer.current = setTimeout(() => {
                stop()
                held.current = true
                navigator.vibrate?.(15)
                onAnswer('allow')
              }, HOLD_MS)
            }}
            onPointerLeave={stop}
            onPointerUp={stop}
            type="button"
          >
            <i />
            <span>Hold to allow</span>
          </button>
        </div>
        <button
          className="always"
          onClick={() => {
            if (armed) {
              onAnswer('always')
            } else {
              setArmed(true)
            }
          }}
          type="button"
        >
          <span className="warn">!</span>
          <span className="grow">
            <span className="t" data-armed={armed ? '' : undefined}>
              {armed ? 'Tap again to always allow' : 'Always allow'}
            </span>
            <span className="s">For the rest of this session · tap twice</span>
          </span>
        </button>
      </div>
    </div>
  )
}
