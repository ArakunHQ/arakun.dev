/** Facts and links the whole site shares. Checked against github.com/ArakunHQ/arakun. */
const org = 'https://github.com/ArakunHQ'
const repo = `${org}/arakun`
const version = '0.18.1'
const release = `${repo}/releases/download/v${version}`

/** Supported coding agents and their Mintlify doc slugs under docs.arakun.dev. */
export const agents = [
  { name: 'Claude Code', slug: 'claude-code' },
  { name: 'Codex', slug: 'codex' },
  { name: 'Devin', slug: 'devin' },
  { name: 'Cursor', slug: 'cursor' },
  { name: 'Droid', slug: 'droid' },
  { name: 'OpenCode', slug: 'opencode' },
  { name: 'Antigravity', slug: 'antigravity' },
  { name: 'Workers AI', slug: 'workers-ai' },
] as const

export const agentList =
  'Claude Code, Codex, Devin, Cursor, Droid, OpenCode, Antigravity and Workers AI'

export const site = {
  name: 'Arakun',
  line: 'One native window for your coding agents.',
  /** The home page's description in search results, and the app's in its structured data. */
  description: `Arakun is a native app where ${agentList} work side by side, each on its own git worktree.`,
  /** Absolute origin, for links that leave the site: og:image, canonical URLs. */
  url: 'https://arakun.dev',
  /** The day the home page last changed in substance, for the sitemap. */
  updated: '2026-11-22',
  /**
   * The fallback release, for when GitHub cannot be reached. Pages show the newest
   * release from GitHub instead (useLatest in src/components/ui.tsx).
   */
  version,
  released: 'November 22, 2026',
  license: 'AGPL-3.0',
  installUrl: 'https://arakun.dev/install',
  /** The docs, on Mintlify (docs/ in this repo). /docs/<page> here redirects to them. */
  docsUrl: 'https://docs.arakun.dev',
  /** arakun-server alone, for Linux machines with no display (src/routes/install-server.ts). */
  installServerUrl: 'https://arakun.dev/install-server',
  githubUrl: repo,
  githubOrgUrl: org,
  issuesUrl: `${repo}/issues`,
  licenseUrl: `${repo}/blob/main/LICENSE`,
  releasesUrl: `${repo}/releases`,
  sourceUrl: `${repo}#build-from-source`,
  privacyEmail: 'privacy@arakun.dev',
  /**
   * Who runs the site, for the privacy page. Provisional: CoderLabs runs it until Arakun
   * has an organization of its own. Then change this, and sign a new PostHog DPA in its name.
   */
  operator: {
    name: 'CoderLabs, Inc.',
    address: '131 Continental Dr, Suite 305, Newark, DE 19713, USA',
  },
  downloads: {
    Linux: `${release}/arakun-v${version}-linux-x86_64.tar.gz`,
    'Linux arm64': `${release}/arakun-v${version}-linux-arm64.tar.gz`,
    Windows: `${release}/arakun-v${version}-windows-x86_64.zip`,
    macOS: `${release}/arakun-v${version}-macos-arm64.dmg`,
  },
}

export type Platform = keyof typeof site.downloads

/**
 * The header of each inner page. The page shows it in its PageHeader and its
 * link preview card (src/og-cards.ts) uses the same title and lead. `tab` is the
 * <title>: what search results and the browser tab show, so it names the page's topic.
 * `description` is for search results when the lead is too short for one (at least 70
 * characters). `updated` is the day the page last changed in substance, for the sitemap:
 * change it with the page.
 */
export const pages = {
  features: {
    path: '/features',
    updated: '2026-11-22',
    num: '01',
    label: 'Features',
    tab: 'Features: many coding agents in one window · Arakun',
    title: 'Many agents. One calm window.',
    lead: 'Arakun is quiet, quick, and awake while you are away. This is what it does.',
  },
  download: {
    path: '/download',
    updated: '2026-11-22',
    num: '02',
    label: 'Download',
    tab: 'Download Arakun for Linux, Windows and macOS',
    // Not "Install Arakun": that is the title of the install page in the docs.
    title: 'Download Arakun',
    lead: `One line in a terminal, or download the build for your platform. Free and open source under ${site.license}.`,
  },
  changelog: {
    path: '/changelog',
    updated: '2026-11-22',
    num: '03',
    label: 'Changelog',
    tab: 'Arakun changelog: every release, newest first',
    title: 'What changed',
    lead: 'Every release, newest first.',
    description:
      'Every Arakun release, newest first: new features, fixes and changes to the native app for Claude Code, Codex, Devin, Cursor and other coding agents.',
  },
  blog: {
    path: '/blog',
    updated: '2026-11-22',
    num: '04',
    label: 'Blog',
    tab: 'Blog: benchmarks and engineering notes · Arakun',
    title: 'Engineering notes',
    lead: 'Measured numbers, architecture notes and decisions behind Arakun.',
    description:
      'Measured benchmarks, Rust and GPUI architecture notes, and product decisions from the team building Arakun.',
  },
  privacy: {
    path: '/privacy',
    updated: '2026-11-22',
    num: '05',
    label: 'Privacy',
    tab: 'Privacy: what arakun.dev and the app collect · Arakun',
    title: 'Privacy',
    lead: 'What arakun.dev and the Arakun app collect, why, and how to say no.',
    description:
      'What arakun.dev and the Arakun app collect, why they collect it, who processes it and how to turn it off.',
  },
}

export const installCommands = {
  sh: `curl -fsSL ${site.installUrl} | sh`,
  powershell: `irm ${site.installUrl}.ps1 | iex`,
  server: `curl -fsSL ${site.installServerUrl} | sh`,
}

export const pillars = [
  {
    title: 'Many agents, one place',
    body: `${agentList} side by side. Each task gets its own worktree, so agents don't step on each other.`,
  },
  {
    title: 'Agents can use the app',
    body: 'The arakun command lets an agent open pages, read terminals, run the project check and leave review drafts.',
  },
  {
    title: 'Know what they are doing',
    body: 'A Dynamic Island, an Inbox and a phone remote tell you when a session finishes, fails or needs an answer.',
  },
  {
    title: 'Native and fast',
    body: 'A GPU-rendered Rust app, not a web view, with a keyboard-first palette for everything.',
  },
]

export const sessions = [
  {
    text: 'Opus 5.5 needs an answer in env/brave-otter.',
    time: 'now',
    tone: 'accent',
    label: 'Needs you',
  },
  {
    text: 'Droid finished in env/quiet-heron. 12 files changed.',
    time: '4 min ago',
    tone: 'success',
    label: 'Finished',
  },
  {
    text: 'OpenCode is running the project check in env/slow-lynx.',
    time: '6 min ago',
    tone: 'attention',
    label: 'Running',
  },
  {
    text: 'Workers AI failed in env/pale-finch. The check found 2 errors.',
    time: '19 min ago',
    tone: 'error',
    label: 'Failed',
  },
] as const
