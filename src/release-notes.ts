/**
 * Hand-written notes for a release, keyed by its tag.
 *
 * The changelog reads the releases from GitHub (see `releases.ts`), and each
 * release's entry from the top of its notes (`release-entry.ts`), which the version
 * bump pull request of the app writes. An entry here wins over that. These entries
 * are also the whole changelog if GitHub has never been reachable.
 *
 * So a new release needs nothing here. Add an entry to correct a published one
 * without editing its release on GitHub.
 */
export interface ReleaseNote {
  changes: [area: string, change: string][]
  /** ISO date. Only used when GitHub cannot be reached. */
  publishedAt?: string
  title: string
}

export const notes: Record<string, ReleaseNote> = {
  'v0.16.1': {
    title: 'Smoother drawing',
    publishedAt: '2026-11-22T12:30:25Z',
    changes: [
      [
        'App',
        'Animations no longer redraw the whole window, so the app stays smooth and uses less power.',
      ],
    ],
  },
  'v0.16.0': {
    title: 'A session tree in the sidebar and branch lanes',
    publishedAt: '2026-11-22T06:06:22Z',
    changes: [
      [
        'Sessions',
        'Every session is in a tree in the sidebar, with its state. Pin the ones you use most to the title bar.',
      ],
      [
        'Tabs',
        'Pick one of three presets for how sessions and tabs show, in Settings. A dragged tab shows where it will land.',
      ],
      ['Branches', 'The history of main shows a lane for each branch.'],
      ['Speed', 'Git and other short commands start faster.'],
      [
        'Fixes',
        'A long subagent list scrolls. The GitHub sheet no longer shows square corners behind the main card.',
      ],
    ],
  },
  'v0.15.0': {
    title: 'PostHog experiments, SSH commands and a faster app',
    publishedAt: '2026-11-22T04:41:22Z',
    changes: [
      [
        'PostHog',
        'See your experiments, open their details and ask PostHog AI from the PostHog tab. Change feature flags and end experiments there too.',
      ],
      ['Agents', 'An agent in a local session can run SSH commands once you have reviewed them.'],
      [
        'Claude',
        'Arakun checks a Claude seat when it starts, and tells you if the sign-in is bad instead of quietly using another.',
      ],
      [
        'Speed',
        'The app starts faster, long chats scroll more smoothly, big pastes no longer stall and the Usage tab updates sooner.',
      ],
    ],
  },
  'v0.14.1': {
    title: 'Safer pull request reviews',
    publishedAt: '2026-11-22T01:46:59Z',
    changes: [
      [
        'Privacy',
        "A pull request's changes go only to the agent of its own session. Sandboxed sessions no longer offer skills they cannot use.",
      ],
      [
        'Fixes',
        'Folding a sidebar section keeps your preset. Cleanup no longer removes an environment that still holds ignored files you need.',
      ],
    ],
  },
  'v0.14.0': {
    title: 'Scenes in the Isometric tab',
    publishedAt: '2026-11-21T20:18:42Z',
    changes: [
      ['Isometric', 'Create, change and export scenes in the Isometric tab.'],
      ['GitHub', 'Show the newest comment first in a conversation.'],
      [
        'Servers',
        "A server session's skills show before its agent starts, and images it mentions show in the chat.",
      ],
    ],
  },
  'v0.13.0': {
    title: 'A Doop tab and a new model picker',
    publishedAt: '2026-11-21T18:35:37Z',
    changes: [
      ['Doop', 'A Doop tab opens doop.design or your own Doop server.'],
      ['Composer', 'The model picker is one simple column.'],
      ['Accessibility', 'Screen readers name every control, and say why one is turned off.'],
      ['Sidebar', 'Undo removing a piece from the sidebar.'],
      [
        'macOS',
        'Arakun opens again by itself after an update, and the Dynamic Island quits with the app.',
      ],
      [
        'Fixes',
        'A server picks a free branch name when yours is taken, and shows the subagents of sessions you follow there. Installing the server also installs Claude Code.',
      ],
    ],
  },
  'v0.12.1': {
    title: 'Privacy and phone pairing fixes',
    publishedAt: '2026-11-21T17:40:57Z',
    changes: [
      [
        'Privacy',
        'If DO_NOT_TRACK is set, Arakun sends nothing, whatever you picked during setup.',
      ],
      [
        'GitHub',
        'arakun-pilot takes its token from the environment or typed input only, so it never sits in a file or your shell history.',
      ],
      [
        'Fixes',
        'Pairing a phone works again after a dropped connection. The Icons preset keeps its settings.',
      ],
    ],
  },
  'v0.12.0': {
    title: 'Connect arakun-pilot, AI commit messages and more contrast',
    publishedAt: '2026-11-20T23:48:48Z',
    changes: [
      [
        'GitHub',
        'Connect arakun-pilot from a form in the app, see whether it is working and how to fix it, and answer its cards from the keyboard.',
      ],
      [
        'Git',
        "Let the session's agent write your commit message. The session's pull request shows beside its subagents.",
      ],
      ['Agents', 'A timer shows how long a turn runs and what it is waiting for.'],
      ['Setup', 'First launch has four steps, next to a live preview of your window.'],
      [
        'Look',
        'Faint text is easier to read. Arakun follows your system settings for high contrast and reduced motion.',
      ],
      [
        'Fixes',
        'Windows remembers saved secrets. Claude keeps its effort level when you switch models.',
      ],
    ],
  },
  'v0.11.1': {
    title: 'Server skills in the / menu',
    publishedAt: '2026-11-20T19:10:27Z',
    changes: [
      ['Servers', 'Type / in a server session to see its skills.'],
      ['GitHub', 'One notification per review request, not several.'],
      ['Fixes', 'Switching between sessions no longer flashes a blank screen.'],
    ],
  },
  'v0.11.0': {
    title: 'Sandboxed agents and server files',
    publishedAt: '2026-11-20T18:16:22Z',
    changes: [
      ['Agents', "Run a project's agents in a sandbox."],
      ['Skills', 'Workers AI agents use skills. Install more from skills.sh.'],
      [
        'Servers',
        "Browse and open the files of a server's environment, see its changes and commit them.",
      ],
      ['Teams', 'Sign in with GitHub.'],
    ],
  },
  'v0.10.0': {
    title: 'Cursor, PostHog and project icons',
    publishedAt: '2026-11-20T16:45:34Z',
    changes: [
      ['Agents', 'Cursor is an agent now. Each Claude Code session gets its own seat.'],
      ['PostHog', 'A PostHog tab shows your events and people.'],
      [
        'Servers',
        "Continue a server's session with another agent. New environments go to the machine with the most room.",
      ],
      ['Sidebar', 'Draw a pixel-art icon for each project. Rows show their pull request number.'],
      ['Phone', 'Replies on the phone show charts and diagrams.'],
      [
        'Fixes',
        'Tab reaches every button and switch, with a focus ring. Dialogs sit in the middle of the window. Quitting no longer leaves Arakun running without a window.',
      ],
    ],
  },
  'v0.9.0': {
    title: 'Server models, clearer words and GitHub links',
    publishedAt: '2026-11-20T11:28:31Z',
    changes: [
      ['Servers', "A server's environment offers that server's models in the composer."],
      [
        'GitHub',
        "Links to pull requests and issues open in the GitHub tab, and so does a session's pull request.",
      ],
      [
        'App',
        'The app uses one word for each thing, in English. Sign in to an agent before you add a project.',
      ],
      ['Look', 'Status shows with a shape as well as a color.'],
      [
        'Fixes',
        'Arakun tells you what to do when an agent or gh is missing. Phone replies arrive sooner.',
      ],
    ],
  },
  'v0.8.0': {
    title: 'A customize panel and conflicts for agents',
    publishedAt: '2026-11-20T07:33:56Z',
    changes: [
      ['Look', 'Change colors and shapes in a customize panel. The chat moves more calmly.'],
      ['GitHub', "Hand a pull request's conflicts and open comments to an agent."],
      [
        'Servers',
        "Open terminals in a server's environment. Fork, rewind and compact its sessions.",
      ],
      [
        'App',
        'Shortcuts for the side panels. Zoom, sidebar views and project commands are in Settings. Archive environments you are done with.',
      ],
      [
        'Fixes',
        'Opening Arakun again switches to the open window. A slow git or gh call no longer holds up the app.',
      ],
    ],
  },
  'v0.7.0': {
    title: 'Devin, pull requests from the app and review comments',
    publishedAt: '2026-11-19T22:45:56Z',
    changes: [
      ['Agents', 'Devin is an agent now, with its usage and plan in the Usage tab.'],
      [
        'GitHub',
        'Create a pull request from the app, with a title and description written by AI. Reply to, resolve and write review comments on the diff. Re-run failed checks and read their logs.',
      ],
      [
        'Sidebar',
        'Live sessions from every project are in one list. Select several to settle, close or delete them.',
      ],
      [
        'Phone',
        'Save phrases you send often as shortcuts. The phone stays connected more reliably.',
      ],
      ['Linux', 'Arakun keeps running in the background after you close the window.'],
      [
        'Fixes',
        'Old environments are removed once their pull request is done, and logs no longer fill your disk. Windows shows the Arakun icon.',
      ],
    ],
  },
  'v0.6.0': {
    title: 'Servers in projects, one composer menu and nightly builds',
    publishedAt: '2026-11-19T01:44:12Z',
    changes: [
      [
        'Servers',
        "A server's folders and sessions show in their projects. Clone a repository or add a folder on a server, and start environments there.",
      ],
      ['Composer', 'Pick the agent, model and reasoning from one menu.'],
      [
        'Windows',
        'The Dynamic Island runs on Windows too, and shows agents running outside Arakun.',
      ],
      ['GitHub', 'Assigned issues are grouped, and you can act on an issue from its sheet.'],
      ['Updates', 'A nightly channel gets new builds every day.'],
      [
        'Fixes',
        'Small windows stay usable. Fewer crashes, and a clear message when no graphics driver works. Ctrl+B only toggles the sidebar.',
      ],
    ],
  },
  'v0.5.0': {
    title: 'Reopen closed tabs and Linux on ARM',
    publishedAt: '2026-11-18T05:32:04Z',
    changes: [
      ['Tabs', 'Reopen a closed tab, close all tabs to the right and drag tabs into a new order.'],
      ['Sidebar', 'Running environments from your other projects show too.'],
      ['Look', 'Dialogs, menus, tooltips and switches animate.'],
      ['Linux', 'Builds for ARM computers.'],
    ],
  },
  'v0.4.1': {
    title: 'arakun-server for Linux',
    publishedAt: '2026-11-17T23:58:53Z',
    changes: [['Servers', 'Every release now comes with arakun-server for Linux.']],
  },
  'v0.4.0': {
    title: 'Interrupt the agent and clone from a link',
    publishedAt: '2026-11-17T22:55:44Z',
    changes: [
      ['Agents', 'Interrupt an agent to send a message right away.'],
      ['Projects', 'Paste a repository link to clone it.'],
      ['Sidebar', "The sidebar shows one project's environments. Add one in a click."],
      ['Servers', 'One command installs arakun-server as a service.'],
      ['Look', 'The caret glides and the working dots move more smoothly.'],
    ],
  },
  'v0.3.1': {
    title: 'arakun-pilot in the GitHub tab',
    publishedAt: '2026-11-17T20:13:39Z',
    changes: [['GitHub', "The GitHub tab shows arakun-pilot's inbox, with a sheet for each item."]],
  },
  'v0.3.0': {
    title: 'Updates by themselves, browser tabs and a Marketplace',
    publishedAt: '2026-11-17T19:04:10Z',
    changes: [
      [
        'Updates',
        'Arakun installs a new release by itself when you quit, after it checks the signature. A switch in Settings turns this off.',
      ],
      [
        'Browser',
        'Every download has browser tabs now. A setting opens links in your own browser instead.',
      ],
      [
        'Setup',
        'A first launch walks you through setup: your agent, the look, the main shortcuts, GitHub and the phone, then your first project.',
      ],
      [
        'Marketplace',
        'The Extensions tab is now the Marketplace and opens on Discover. Tabs such as GitHub, Usage and Servers are extensions you turn on there, so the sidebar shows only what you use.',
      ],
      [
        'Privacy',
        "Redacted mode (Ctrl+Shift+H) hides emails, keys, IP addresses and account names while you stream or demo. Arakun reads each agent CLI's sign-in and sends it only to that provider.",
      ],
      [
        'macOS',
        'A disk image you drag into Applications. The Dynamic Island shows on the Mac, around the notch. A click on a notification opens Arakun.',
      ],
      [
        'App',
        "The Inbox is a button next to search, with a count. Settings are grouped. The brand book's raccoon is on the start screen and new tabs.",
      ],
      [
        'Fixes',
        'A zoom change no longer closes the app. Views no longer clip in a small window. On Ubuntu, a blocked browser sandbox shows a notice instead of a crash. The Dynamic Island speaks English on Linux too.',
      ],
    ],
  },
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
