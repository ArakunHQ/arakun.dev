import { useId, useState } from 'react'
import { Eye, EyeOff, SquareLock } from './icons'
import type { Step } from './story'
import { Stage, StoryBar, useStory } from './story'

// The secret card from the app (core/src/agent/view/cards.rs, core/src/agent/secret.rs).
// The agent asks with request_secret; what you type goes into the keyring, and the
// agent gets a one-time handle, secret-ref:<64 hex>, to use with run_with_secrets.
// Nothing here leaves the page: the handle is made up in the browser.

const LABEL = 'Cloudflare API token'
const FIELD = 'CLOUDFLARE_API_TOKEN'
/** What the story types. Made up; the field shows it as stars. */
const TYPED = 'cfat_7Qm2xL9pV4aR1sN8'
const TYPE_MS = 55

type Phase = 'intro' | 'asking' | 'saved' | 'declined'

const BEATS = [
  'The agent asks for a secret on a card',
  'You type it, and it stays masked',
  'Save keeps it out of the chat',
  'The agent gets a handle, never the value',
]

/** A handle shaped like the app's: secret-ref: and 64 hex characters (secret.rs:870-879). */
function makeHandle() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `secret-ref:${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export function SecretDemo() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [handle, setHandle] = useState('')
  const [value, setValue] = useState('')
  const [typing, setTyping] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = () => {
    setTyping(false)
    setSaving(false)
    setHandle(makeHandle())
    setPhase('saved')
  }

  const story = useStory({
    reset: () => {
      setValue('')
      setTyping(false)
      setSaving(false)
      setPhase('intro')
    },
    finish: () => {
      setValue(TYPED)
      setHandle(makeHandle())
      setPhase('saved')
    },
    steps: [
      { wait: 1100, do: () => setPhase('asking') },
      { to: '.app-masked', act: 'tap', wait: 1300, do: () => setTyping(true), after: 250 },
      ...Array.from(
        TYPED,
        (_, i): Step => ({ wait: TYPE_MS, do: () => setValue(TYPED.slice(0, i + 1)) })
      ),
      { to: '.app-secret .app-btn[data-primary]', wait: 700, do: () => setSaving(true) },
      { act: 'tap', wait: 250, do: save, after: 4200, leave: true },
    ],
  })

  let beat = 0
  if (phase === 'asking') {
    beat = saving ? 2 : Number(typing || value.length > 0)
  } else if (phase !== 'intro') {
    beat = 3
  }

  return (
    <div>
      <Stage bind={story.bind} className="sc-stage" ghost={story.ghost}>
        <div className="sc-sheet">
          <p className="sc-agent">
            The deploy needs a Cloudflare API token. I'll ask for it on a card, so it stays out of
            this chat.
          </p>
          <div className="app-tool" data-state={phase === 'asking' ? 'running' : 'done'}>
            <span>{phase === 'intro' || phase === 'asking' ? 'Asking for' : 'Asked for'}</span>
            <code>{LABEL}</code>
            {phase === 'intro' || phase === 'asking' ? <i className="app-spin" /> : null}
          </div>
          {phase === 'asking' ? (
            <SecretCard
              focused={typing}
              onChange={setValue}
              onDecline={() => setPhase('declined')}
              onSave={save}
              value={value}
            />
          ) : null}
          {phase === 'saved' ? (
            <>
              <div className="sc-result">
                <span className="sc-result-label">What the agent got</span>
                <pre>
                  The user saved it. These are handles, not the values. Redeem them with the
                  run_with_secrets tool, which sets each as an environment variable for one command;
                  each works once, in this project, within 24 hours. Never type a handle into a page
                  or a terminal:{'\n'}
                  <b>
                    {FIELD}: {handle}
                  </b>
                </pre>
              </div>
              <div className="app-tool" data-state="done">
                <span>Ran</span>
                <code>npx wrangler deploy</code>
                <span className="sc-with">with {FIELD} set for this one command</span>
              </div>
            </>
          ) : null}
          {phase === 'declined' ? (
            <div className="sc-result">
              <span className="sc-result-label">What the agent got</span>
              <pre>
                The user declined. Do not ask for this secret in a message; go on without it, or
                stop and say what you need.
              </pre>
            </div>
          ) : null}
        </div>
      </Stage>
      <StoryBar
        auto={story.auto}
        beats={BEATS}
        current={beat}
        onReplay={story.replay}
        reduced={story.reduced}
      />
    </div>
  )
}

function SecretCard({
  value,
  focused,
  onChange,
  onSave,
  onDecline,
}: {
  value: string
  /** The story is typing into the field. */
  focused: boolean
  onChange: (value: string) => void
  onSave: () => void
  onDecline: () => void
}) {
  const [shown, setShown] = useState(false)
  const id = useId()
  const ready = value.length > 0

  return (
    <div className="app-secret">
      <div className="app-secret-head">
        <SquareLock size={14} />
        <span className="title">{LABEL}</span>
        <span className="note">Stays out of the transcript</span>
      </div>
      <p className="app-secret-reason">To deploy the Worker with wrangler.</p>
      <div className="app-secret-field">
        <label htmlFor={id}>{FIELD}</label>
        <div className="app-masked" data-focused={focused ? '' : undefined}>
          {/* The app masks with one * per character (core/src/input.rs). The real text is
              transparent under the stars, so the caret and selection still work. */}
          <span aria-hidden="true" className="mask">
            {shown ? '' : '*'.repeat(value.length)}
            {focused ? <i className="mask-caret" /> : null}
          </span>
          <input
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            data-shown={shown ? '' : undefined}
            id={id}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ready) {
                onSave()
              }
            }}
            spellCheck={false}
            type="text"
            value={value}
          />
          <button
            aria-label={shown ? 'Hide' : 'Show'}
            className="show"
            onClick={() => setShown((s) => !s)}
            type="button"
          >
            {shown ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div className="app-secret-actions">
        <button
          className="app-btn"
          data-primary=""
          disabled={!ready}
          onClick={onSave}
          type="button"
        >
          Save
        </button>
        <button className="app-btn" onClick={onDecline} type="button">
          Decline
        </button>
        <span className="status">The agent gets a handle, never the value</span>
      </div>
    </div>
  )
}
