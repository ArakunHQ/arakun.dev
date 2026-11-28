import { useId, useState } from 'react'
import { Eye, EyeOff, SquareLock } from './icons'

// The secret card from the app (core/src/agent/view/cards.rs, core/src/agent/secret.rs).
// The agent asks with request_secret; what you type goes into the keyring, and the
// agent gets a one-time handle, secret-ref:<64 hex>, to use with run_with_secrets.
// Nothing here leaves the page: the handle is made up in the browser.

const LABEL = 'Cloudflare API token'
const FIELD = 'CLOUDFLARE_API_TOKEN'

type Phase = 'asking' | 'saved' | 'declined'

/** A handle shaped like the app's: secret-ref: and 64 hex characters (secret.rs:870-879). */
function makeHandle() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `secret-ref:${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export function SecretDemo() {
  const [phase, setPhase] = useState<Phase>('asking')
  const [handle, setHandle] = useState('')

  return (
    <div className="sc-stage">
      <div className="sc-sheet">
        <p className="sc-agent">
          The deploy needs a Cloudflare API token. I'll ask for it on a card, so it stays out of
          this chat.
        </p>
        <div className="app-tool" data-state={phase === 'asking' ? 'running' : 'done'}>
          <span>{phase === 'asking' ? 'Asking for' : 'Asked for'}</span>
          <code>{LABEL}</code>
          {phase === 'asking' && <i className="app-spin" />}
        </div>
        {phase === 'asking' && (
          <SecretCard
            onDecline={() => setPhase('declined')}
            onSave={() => {
              setHandle(makeHandle())
              setPhase('saved')
            }}
          />
        )}
        {phase === 'saved' && (
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
        )}
        {phase === 'declined' && (
          <div className="sc-result">
            <span className="sc-result-label">What the agent got</span>
            <pre>
              The user declined. Do not ask for this secret in a message; go on without it, or stop
              and say what you need.
            </pre>
          </div>
        )}
      </div>
      <p aria-live="polite" className="demo-hint">
        {phase === 'asking' && 'Type anything. It never leaves this page.'}
        {phase === 'saved' && 'The agent has a handle. The value never reached it.'}
        {phase === 'declined' && 'Declined. The agent goes on without it.'}
        {phase !== 'asking' && (
          <button className="demo-replay" onClick={() => setPhase('asking')} type="button">
            Replay
          </button>
        )}
      </p>
    </div>
  )
}

function SecretCard({ onSave, onDecline }: { onSave: () => void; onDecline: () => void }) {
  const [value, setValue] = useState('')
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
        <div className="app-masked">
          {/* The app masks with one * per character (core/src/input.rs). The real text is
              transparent under the stars, so the caret and selection still work. */}
          <span aria-hidden="true" className="mask">
            {shown ? '' : '*'.repeat(value.length)}
          </span>
          <input
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            data-shown={shown ? '' : undefined}
            id={id}
            onChange={(e) => setValue(e.target.value)}
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
