import { useEffect, useState } from 'react'
import type { AgentName } from './icons'
import { AgentIcon } from './icons'

// Three sessions split side by side (src/shell/panes.rs), each in its own worktree
// (docs/features.md, "One session, one worktree"). A new environment gets a
// placeholder branch, env/<adjective>-<noun>, and the app renames it after the first
// prompt (src/env_name.rs). All three edit the same file without touching each other.

interface Line {
  kind: 'add' | 'del' | 'ctx'
  n: number
  text: string
}

interface Pane {
  agent: AgentName
  branch: string
  env: string
  lines: Line[]
  /** Ticks between streamed lines, so the three don't move in step. */
  pace: number
  prompt: string
  title: string
}

const FILE = 'src/pricing.ts'

const panes: Pane[] = [
  {
    agent: 'Claude Code',
    env: 'crisp-pine',
    title: 'Add yearly plans',
    branch: 'feat/yearly-plans',
    prompt: 'Add yearly prices to the plans.',
    pace: 4,
    lines: [
      { kind: 'ctx', n: 1, text: 'export const plans = {' },
      { kind: 'del', n: 2, text: '  pro: { monthly: 12 },' },
      { kind: 'add', n: 2, text: '  pro: { monthly: 12, yearly: 120 },' },
      { kind: 'add', n: 3, text: '  team: { monthly: 20, yearly: 200 },' },
      { kind: 'ctx', n: 4, text: '}' },
    ],
  },
  {
    agent: 'Codex',
    env: 'brave-otter',
    title: 'Fix rounding in totals',
    branch: 'fix/total-rounding',
    prompt: 'Totals drop the cents. Fix it.',
    pace: 6,
    lines: [
      { kind: 'ctx', n: 14, text: 'export function total(cents: number) {' },
      { kind: 'del', n: 15, text: '  return Math.round(cents / 100)' },
      { kind: 'add', n: 15, text: '  return Math.round(cents) / 100' },
      { kind: 'ctx', n: 16, text: '}' },
    ],
  },
  {
    agent: 'OpenCode',
    env: 'quiet-heron',
    title: 'Format prices',
    branch: 'refactor/price-format',
    prompt: 'Show prices with the currency.',
    pace: 5,
    lines: [
      { kind: 'del', n: 22, text: 'export const price = (n: number) => `$${n}`' },
      { kind: 'add', n: 22, text: "const usd = { style: 'currency', currency: 'USD' }" },
      { kind: 'add', n: 23, text: 'export const price = (n: number) =>' },
      { kind: 'add', n: 24, text: "  n.toLocaleString('en-US', usd)" },
    ],
  },
]

const TICK_MS = 110
/** When the prompt is in and the branch gets its real name. */
const RENAME_AT = 8
const EDIT_AT = 12

const doneAt = (pane: Pane) => EDIT_AT + pane.lines.length * pane.pace + 6
const END = Math.max(...panes.map(doneAt)) + 2

export function WorktreesDemo() {
  const [tick, setTick] = useState(0)
  const [run, setRun] = useState(0)

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new run replays the scene.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTick(END)
      return
    }
    setTick(0)
    const timer = setInterval(() => {
      setTick((t) => {
        if (t >= END) {
          clearInterval(timer)
          return t
        }
        return t + 1
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [run])

  const finished = tick >= END

  return (
    <div className="wt-stage">
      <div className="wt-window">
        {panes.map((pane, i) => (
          <PaneView focused={i === 0} key={pane.env} pane={pane} tick={tick} />
        ))}
      </div>
      <p aria-live="polite" className="demo-hint">
        {finished
          ? 'Three branches, three worktrees, one file. Each merges on its own.'
          : 'Three agents edit the same file, each on its own branch.'}
        {finished && (
          <button className="demo-replay" onClick={() => setRun((n) => n + 1)} type="button">
            Replay
          </button>
        )}
      </p>
    </div>
  )
}

function PaneView({ pane, tick, focused }: { pane: Pane; tick: number; focused: boolean }) {
  const renamed = tick >= RENAME_AT
  const editing = tick >= EDIT_AT
  const shown = editing ? Math.min(pane.lines.length, Math.floor((tick - EDIT_AT) / pane.pace)) : 0
  const done = tick >= doneAt(pane)
  const added = pane.lines.filter((l) => l.kind === 'add').length
  const removed = pane.lines.filter((l) => l.kind === 'del').length
  const branch = renamed ? pane.branch : `env/${pane.env}`

  return (
    <section aria-label={`${pane.agent} in ${pane.env}`} className="wt-pane">
      {focused ? <span className="wt-focus" /> : null}
      <div className="wt-tabs">
        <span className="wt-env">{pane.env}</span>
        <span className="wt-tab">
          <AgentIcon agent={pane.agent} size={14} />
          <span>{pane.title}</span>
        </span>
      </div>
      <div className="wt-body">
        <div className="wt-branch">
          <span>{pane.agent}</span>
          <code data-renamed={renamed ? '' : undefined} key={branch}>
            {branch}
          </code>
        </div>
        <p className="wt-prompt">{pane.prompt}</p>
        {editing && (
          <div className="app-diff">
            <div className="app-diff-head">
              <code>{FILE}</code>
              <span className="add">+{added}</span>
              <span className="del">-{removed}</span>
            </div>
            {pane.lines.slice(0, shown).map((line) => (
              <div className="app-diff-line" data-kind={line.kind} key={`${line.kind}${line.n}`}>
                <span className="n">{line.n}</span>
                <span className="m">{mark(line.kind)}</span>
                <span className="t">{line.text}</span>
              </div>
            ))}
            {!done && <div className="app-diff-cursor" />}
          </div>
        )}
        <div className="wt-status" data-done={done ? '' : undefined}>
          {done ? (
            <>
              <i />
              Ready to merge · no conflicts
            </>
          ) : (
            <>
              <i />
              {editing ? `Editing ${FILE}` : 'Working'}
            </>
          )}
        </div>
        <code className="wt-path">~/arakun-workspaces/shop/env-{pane.env}</code>
      </div>
    </section>
  )
}

function mark(kind: Line['kind']) {
  if (kind === 'add') {
    return '+'
  }
  // The app marks removed lines with a real minus sign (diffs.rs).
  return kind === 'del' ? '−' : ''
}
