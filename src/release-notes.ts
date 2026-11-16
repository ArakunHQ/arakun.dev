/**
 * Hand-written notes for a release, keyed by its tag.
 *
 * The changelog reads the releases from GitHub (see `releases.ts`). When a
 * release has notes on GitHub, the page shows those. When it has none, the page
 * shows the entry here, if there is one. These entries are also the whole
 * changelog if GitHub has never been reachable.
 *
 * So the usual way to add a release is to write its notes on GitHub. Add an
 * entry here only for a release whose GitHub notes are empty.
 */
export type ReleaseNote = {
  title: string
  /** ISO date. Only used when GitHub cannot be reached. */
  publishedAt?: string
  changes: [area: string, change: string][]
}

export const notes: Record<string, ReleaseNote> = {
  'v0.1.0': {
    title: 'The first release',
    publishedAt: '2026-11-14T19:15:17Z',
    changes: [
      ['Agents', 'Claude Code, Droid, OpenCode and Workers AI run side by side.'],
      ['Worktrees', "Each task gets its own git worktree, so agents don't step on each other."],
      ['Command', 'The arakun command lets an agent open pages, read terminals, run the project check and leave review drafts.'],
      ['News', 'A Dynamic Island, an Inbox and a phone remote tell you when a session finishes, fails or needs an answer.'],
      ['App', 'A GPU-rendered Rust app with a keyboard-first palette for everything.'],
      ['Platforms', 'Linux is supported. Windows is in beta. macOS is experimental, with no release build yet.'],
    ],
  },
}
