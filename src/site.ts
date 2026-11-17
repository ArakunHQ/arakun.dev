/** Facts and links the whole site shares. Checked against github.com/ArakunHQ/arakun. */
const repo = 'https://github.com/ArakunHQ/arakun'
const version = '0.1.0'
const release = `${repo}/releases/download/v${version}`

export const site = {
  name: 'Arakun',
  line: 'One native window for your coding agents.',
  /** Absolute origin, for links that leave the site: og:image, canonical URLs. */
  url: 'https://arakun.dev',
  version,
  released: 'November 14, 2026',
  license: 'AGPL-3.0',
  installUrl: 'https://arakun.dev/install',
  githubUrl: repo,
  issuesUrl: `${repo}/issues`,
  licenseUrl: `${repo}/blob/main/LICENSE`,
  releasesUrl: `${repo}/releases`,
  sourceUrl: `${repo}#build-from-source`,
  privacyEmail: 'privacy@arakun.dev',
  /**
   * Who runs the site, for the privacy page. Provisional: CoderLabs runs it until Arakun
   * has an organization of its own. Then change this, and sign a new PostHog DPA in its name.
   */
  operator: { name: 'CoderLabs, Inc.', address: '131 Continental Dr, Suite 305, Newark, DE 19713, USA' },
  /** Release v0.1.0 has no macOS archive, so macOS has no direct download. */
  downloads: {
    Linux: `${release}/arakun-v${version}-linux-x86_64.tar.gz`,
    Windows: `${release}/arakun-v${version}-windows-x86_64.zip`,
  },
}

export type Platform = keyof typeof site.downloads

/**
 * The header of each inner page. The page shows it in its PageHeader and its
 * link preview card (src/og-cards.ts) uses the same title and lead.
 */
export const pages = {
  features: {
    path: '/features',
    num: '01',
    label: 'Features',
    title: 'Many agents. One calm window.',
    lead: 'Arakun is quiet, quick, and awake while you are away. This is what it does.',
  },
  download: {
    path: '/download',
    num: '02',
    label: 'Download',
    title: 'Install Arakun',
    lead: `One line in a terminal, or download the build for your platform. Free and open source under ${site.license}.`,
  },
  docs: {
    path: '/docs',
    num: '03',
    label: 'Docs',
    title: 'Learn Arakun',
    lead: 'Short pages, plain words. Start with the install, then give an agent its first task.',
  },
  changelog: {
    path: '/changelog',
    num: '04',
    label: 'Changelog',
    title: 'What changed',
    lead: 'Every release, newest first.',
  },
  privacy: {
    path: '/privacy',
    num: '05',
    label: 'Privacy',
    title: 'Privacy',
    lead: 'What arakun.dev and the Arakun app collect, why, and how to say no.',
  },
}

export const installCommands = {
  sh: `curl -fsSL ${site.installUrl} | sh`,
  powershell: `irm ${site.installUrl}.ps1 | iex`,
}

export const pillars = [
  {
    title: 'Many agents, one place',
    body: "Claude Code, Droid, OpenCode and Workers AI side by side. Each task gets its own worktree, so agents don't step on each other.",
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
  { text: 'Opus 5.5 needs an answer in env/brave-otter.', time: 'now', tone: 'accent', label: 'Needs you' },
  { text: 'Droid finished in env/quiet-heron. 12 files changed.', time: '4 min ago', tone: 'success', label: 'Finished' },
  { text: 'OpenCode is running the project check in env/slow-lynx.', time: '6 min ago', tone: 'attention', label: 'Running' },
  { text: 'Workers AI failed in env/pale-finch. The check found 2 errors.', time: '19 min ago', tone: 'error', label: 'Failed' },
] as const
