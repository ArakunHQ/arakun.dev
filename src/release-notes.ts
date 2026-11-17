/**
 * Hand-written notes for a release, keyed by its tag.
 *
 * The changelog reads the releases from GitHub (see `releases.ts`). An entry
 * here wins over the release's notes on GitHub. Without one, the page shows the
 * GitHub notes. These entries are also the whole changelog if GitHub has never
 * been reachable.
 *
 * So the usual way to add a release is to write its notes on GitHub. Add an
 * entry here when the GitHub notes are empty, or are GitHub's generated list of
 * pull requests, which says little to someone who uses the app.
 */
export interface ReleaseNote {
  changes: [area: string, change: string][]
  /** ISO date. Only used when GitHub cannot be reached. */
  publishedAt?: string
  title: string
}

export const notes: Record<string, ReleaseNote> = {
  'v0.2.1': {
    title: 'Remote servers, a GitHub tab and Codex',
    publishedAt: '2026-11-17T03:37:05Z',
    changes: [
      [
        'Agents',
        'OpenAI Codex is an agent now. Claude Code also runs on an API key or another endpoint.',
      ],
      ['Servers', 'arakun server runs sessions on a remote machine. The Servers tab follows them.'],
      ['GitHub', 'A GitHub tab with a review queue and a pull request view.'],
      [
        'Look',
        "The brand book's black, white and amber, set in Geist. Amber now marks only what needs you.",
      ],
      [
        'App',
        'New environments get a name from the first prompt. The window reopens where you left it.',
      ],
      ['Usage', 'The usage tab shows the plan limits of CLIProxyAPI accounts.'],
      [
        'Privacy',
        'Crash reports and usage counts, only if you say yes on first launch. Sessions and transcripts are saved so only you can read them.',
      ],
      [
        'macOS',
        'A signed and notarized build for Apple silicon, with an Edit menu, Services and a Liquid Glass icon.',
      ],
      [
        'Fixes',
        'No crash on first launch without projects. Shortcut hints show the right keys. Windows finds its browser runtime.',
      ],
    ],
  },
  'v0.1.0': {
    title: 'The first release',
    publishedAt: '2026-11-14T19:15:17Z',
    changes: [
      ['Agents', 'Claude Code, Droid, OpenCode and Workers AI run side by side.'],
      ['Worktrees', "Each task gets its own git worktree, so agents don't step on each other."],
      [
        'Command',
        'The arakun command lets an agent open pages, read terminals, run the project check and leave review drafts.',
      ],
      [
        'News',
        'A Dynamic Island, an Inbox and a phone remote tell you when a session finishes, fails or needs an answer.',
      ],
      ['App', 'A GPU-rendered Rust app with a keyboard-first palette for everything.'],
      [
        'Platforms',
        'Linux is supported. Windows is in beta. macOS is experimental, with no release build yet.',
      ],
    ],
  },
}
