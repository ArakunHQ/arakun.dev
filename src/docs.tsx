import type { ReactNode } from 'react'
import { site } from '#/site'

/**
 * The docs, written from the app's README (github.com/ArakunHQ/arakun).
 * One entry per page; the order here is the order of the index, the side
 * list and the previous/next links. To add a page, add an entry.
 */
export interface Doc {
  body: ReactNode
  group: string
  slug: string
  summary: string
  title: string
}

const Code = ({ children }: { children: string }) => (
  <pre>
    <code>{children}</code>
  </pre>
)
const K = ({ children }: { children: string }) => <kbd>{children}</kbd>

export const docs: Doc[] = [
  // Get started
  {
    slug: 'install',
    group: 'Get started',
    title: 'Install Arakun',
    summary: 'One line in a terminal.',
    body: (
      <>
        <h2>macOS and Linux</h2>
        <p>Run this in a terminal. It works on macOS with Apple silicon and on Linux x86_64.</p>
        <Code>{`curl -fsSL ${site.installUrl} | sh`}</Code>
        <h2>Windows</h2>
        <p>Run this in PowerShell.</p>
        <Code>{`irm ${site.installUrl}.ps1 | iex`}</Code>
        <h2>What the script does</h2>
        <p>
          It downloads the latest release, checks it against <code>SHA256SUMS</code> and installs it
          for your user.
        </p>
        <table>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Installs to</th>
              <th>To uninstall</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>macOS</td>
              <td>
                <code>~/Applications/Arakun.app</code>, linked as <code>~/.local/bin/arakun</code>
              </td>
              <td>
                <code>rm -rf ~/Applications/Arakun.app ~/.local/bin/arakun</code>
              </td>
            </tr>
            <tr>
              <td>Linux</td>
              <td>
                <code>~/.local/bin/arakun</code>
              </td>
              <td>
                <code>rm ~/.local/bin/arakun</code>
              </td>
            </tr>
            <tr>
              <td>Windows</td>
              <td>
                <code>%LOCALAPPDATA%\Programs\Arakun</code>, added to your user <code>PATH</code>,
                with a Start menu shortcut
              </td>
              <td>
                Delete that folder and the shortcut, and remove it from <code>PATH</code>
              </td>
            </tr>
          </tbody>
        </table>
        <h2>A given version</h2>
        <Code>{`curl -fsSL ${site.installUrl} | sh -s -- --version v${site.version}`}</Code>
        <p>
          Or set <code>ARAKUN_VERSION=v{site.version}</code>. There is no build for Intel Macs or
          Linux on ARM yet. Build from source there.
        </p>
        <h2>What Linux needs</h2>
        <p>
          glibc 2.35 or newer (Ubuntu 22.04+, Debian 12+, Fedora 36+), a Vulkan driver and the usual
          desktop libraries: libxkbcommon, Wayland or X11, fontconfig and freetype.
        </p>
        <h2>Agents come separately</h2>
        <p>
          Arakun does not bundle the agents. Install the ones you want to use. Each agent's page in
          these docs says what it needs.
        </p>
        <p>
          These tools are optional: <code>git</code> for Changes, worktrees and branches,{' '}
          <code>gh</code> for CI and the GitHub tab, <code>bwrap</code> for headless agents,{' '}
          <code>tailscale</code> for the phone over Tailscale.
        </p>
      </>
    ),
  },
  {
    slug: 'start-a-session',
    group: 'Get started',
    title: 'Start a session',
    summary: 'Add a project, pick an agent, write the task.',
    body: (
      <>
        <h2>Add a project</h2>
        <p>In the project's folder, run:</p>
        <Code>arakun .</Code>
        <p>This adds the project, or switches to it. It starts Arakun if it is not running.</p>
        <h2>Projects and environments</h2>
        <p>
          The rail on the left lists your projects. Each project has environments: the main checkout
          plus git worktrees. Every environment has its own tabs, sessions, terminals and draft
          prompt.
        </p>
        <p>Give each task its own worktree, so the agents don't step on each other.</p>
        <h2>Write the task</h2>
        <p>
          Press <K>Ctrl+T</K> for a new session. Pick the agent and the model in the composer, then
          write what you want done.
        </p>
        <ul>
          <li>
            <K>Enter</K> sends. <K>Shift+Enter</K> adds a line.
          </li>
          <li>
            <K>Up</K> on an empty composer recalls earlier prompts.
          </li>
          <li>Paste or drop images to attach them.</li>
        </ul>
        <h2>Branch names from the task</h2>
        <p>
          A new environment starts on a random branch name, such as <code>env/brave-otter</code>.
          After the first prompt, a small model names the branch after the task, such as{' '}
          <code>fix/terminal-tab-name</code>, and Arakun renames it. The folder keeps its name.
        </p>
        <p>
          By default the agent you sent the prompt to names it, when that agent is Claude Code or
          Droid. Other agents leave the name alone. Settings › General can pick one agent for every
          environment, or turn naming off.
        </p>
      </>
    ),
  },
  {
    slug: 'review-the-work',
    group: 'Get started',
    title: 'Review the work',
    summary: 'Read the diff, check it and open the pull request.',
    body: (
      <>
        <h2>See what each turn changed</h2>
        <p>
          A session's transcript shows markdown, diffs, tool calls and images. Per-turn diffs show
          what each turn changed, including changes made by shell commands. Sessions can be resumed.
        </p>
        <p>
          The Workspace panel has three tabs: Sessions, an Explorer and the uncommitted Changes.
        </p>
        <h2>Let the project check run</h2>
        <p>
          Set a check command for the project, such as <code>cargo test</code> or{' '}
          <code>npm test</code>. It runs after each turn that edits files. See{' '}
          <a href="/docs/run-the-project-check">Run the project check</a>.
        </p>
        <h2>Finish on GitHub</h2>
        <p>
          The GitHub tab is a queue of what waits on you: pull requests whose review is asked of
          you, mentions and assignments, your own open pull requests, and what is ready to merge.
        </p>
        <p>
          Pick an item to see its state, checks, what blocks the merge, its timeline, files and
          commits. You can comment, approve, request changes or merge from there. A comment posts at
          once. Approve, request changes and merge ask a second time.
        </p>
        <p>
          It reads GitHub through the <code>gh</code> CLI, so install <code>gh</code> and sign in
          first.
        </p>
      </>
    ),
  },

  // Agents
  {
    slug: 'claude-code',
    group: 'Agents',
    title: 'Claude Code',
    summary: 'Runs through the ACP adapter.',
    body: (
      <>
        <p>
          Arakun runs Claude Code through the ACP adapter{' '}
          <code>@agentclientprotocol/claude-agent-acp</code>.
        </p>
        <h2>What you need</h2>
        <ul>
          <li>
            Node.js with <code>npm</code>. Arakun installs the adapter itself.
          </li>
          <li>
            A <code>claude</code> that is signed in, or set up with an API key or another endpoint (
            <code>ANTHROPIC_BASE_URL</code>) in <code>~/.claude/settings.json</code> or the
            environment.
          </li>
        </ul>
        <h2>Good to know</h2>
        <p>
          The Usage tab reads token use and cost from Claude Code's own logs, and shows your plan's
          limits.
        </p>
      </>
    ),
  },
  {
    slug: 'droid',
    group: 'Agents',
    title: 'Droid',
    summary: "Runs Factory's droid CLI.",
    body: (
      <>
        <p>
          Arakun runs Droid through Factory's <code>droid</code> CLI.
        </p>
        <h2>What you need</h2>
        <ul>
          <li>
            The <code>droid</code> CLI, installed and signed in.
          </li>
        </ul>
        <h2>Good to know</h2>
        <p>The Usage tab reads token use and cost from Droid's own logs.</p>
      </>
    ),
  },
  {
    slug: 'opencode',
    group: 'Agents',
    title: 'OpenCode',
    summary: 'Runs the opencode CLI.',
    body: (
      <>
        <p>
          Arakun runs OpenCode through the <code>opencode</code> CLI.
        </p>
        <h2>What you need</h2>
        <ul>
          <li>
            The <code>opencode</code> CLI, signed in:
          </li>
        </ul>
        <Code>opencode auth login</Code>
      </>
    ),
  },
  {
    slug: 'workers-ai',
    group: 'Agents',
    title: 'Workers AI',
    summary: 'A tool loop Arakun runs against the Workers AI API.',
    body: (
      <>
        <p>
          For Cloudflare Workers AI there is no outside CLI. Arakun runs the tool loop itself
          against the Workers AI API.
        </p>
        <h2>What you need</h2>
        <p>A Cloudflare API token with Workers AI access. Give it to Arakun in one of two ways:</p>
        <ul>
          <li>
            Store it through <code>opencode auth login</code>.
          </li>
          <li>
            Set <code>CLOUDFLARE_API_TOKEN</code> and <code>CLOUDFLARE_ACCOUNT_ID</code>.
          </li>
        </ul>
        <h2>Good to know</h2>
        <p>
          <a href="/docs/headless-agents">Headless agents</a> use Workers AI models for now.
        </p>
      </>
    ),
  },

  // The arakun command
  {
    slug: 'the-arakun-command',
    group: 'The arakun command',
    title: 'How the command works',
    summary: 'It acts on the environment of the current folder.',
    body: (
      <>
        <p>
          While Arakun is running, <code>arakun &lt;command&gt;</code> acts on the environment of
          the current folder. It talks to the app over a local control socket.
        </p>
        <p>
          Terminals and agents started by Arakun get <code>arakun</code> on their <code>PATH</code>.
          The agents also get a note about it in their system prompt. Set{' '}
          <code>ARAKUN_AGENT_HINT=off</code> to remove that note.
        </p>
        <h2>Everyday commands</h2>
        <Code>{`arakun .                    # add this project, or switch to it
arakun ls                   # projects, environments and sessions
arakun palette              # bring the window up with Ctrl+K open
arakun notify "done"        # desktop notification
arakun notices --unseen     # notifications you haven't read yet
arakun rename fix/tab-name  # rename this environment's branch
arakun --version            # print the version`}</Code>
        <h2>Open the palette from anywhere</h2>
        <p>
          Bind <code>arakun palette</code> to a global key in your desktop. On Hyprland, for
          example:
        </p>
        <Code>bind = SUPER, K, exec, arakun palette</Code>
      </>
    ),
  },
  {
    slug: 'open-pages-and-files',
    group: 'The arakun command',
    title: 'Open pages and files',
    summary: 'arakun browse, arakun open and arakun page.',
    body: (
      <>
        <h2>Open a page</h2>
        <Code>arakun browse -s localhost:3000</Code>
        <p>This opens the page in the side pane.</p>
        <h2>Open a file</h2>
        <Code>arakun open -s src/main.rs:42</Code>
        <p>This opens the file in the side pane at line 42.</p>
        <h2>Let an agent drive a page</h2>
        <p>
          Agents can drive pages on localhost through <code>arakun page</code>: screenshot, console,
          click, type and eval.
        </p>
        <Code>arakun page screenshot # PNG of the environment's browser tab</Code>
        <h2>The browser is optional</h2>
        <p>
          Browser tabs are based on CEF. Release builds do not include the browser yet. Build from
          source with the <code>browser</code> feature to get it.
        </p>
      </>
    ),
  },
  {
    slug: 'read-a-terminal',
    group: 'The arakun command',
    title: 'Read a terminal',
    summary: 'arakun run and arakun logs.',
    body: (
      <>
        <p>
          Each environment has a dock of terminals. They are numbered, so agents and scripts can
          read them.
        </p>
        <h2>Start a command and wait for it</h2>
        <Code>arakun run --port 5173 npm run dev</Code>
        <p>This opens a new terminal, runs the command and waits until the port answers.</p>
        <h2>Wait for output</h2>
        <Code>arakun logs 2 --until compiled</Code>
        <p>This waits until terminal 2 prints "compiled".</p>
        <h2>Options</h2>
        <p>
          <code>arakun run</code> and <code>arakun logs</code> take{' '}
          <code>--ready &lt;text&gt;</code>, <code>--port &lt;n&gt;</code> and{' '}
          <code>--timeout &lt;s&gt;</code> before the command. They fail with the tail of the output
          if the command exits or times out first.
        </p>
      </>
    ),
  },
  {
    slug: 'run-the-project-check',
    group: 'The arakun command',
    title: 'Run the project check',
    summary: 'One command that runs after each turn that edits files.',
    body: (
      <>
        <p>
          The project check is a command you set per project, such as <code>cargo test</code> or{' '}
          <code>npm test</code>.
        </p>
        <h2>When it runs</h2>
        <p>
          It runs after each turn that edits files. When it fails, the tail of the output goes back
          to the agent, up to three times in a row.
        </p>
        <p>To run it yourself in the current environment:</p>
        <Code>arakun check</Code>
        <h2>It does not stall your computer</h2>
        <p>
          Checks run one at a time across all sessions, at low priority, with half the cores for
          builds. Several agents finishing together don't slow the machine down.
        </p>
        <h2>Loops</h2>
        <p>
          Arakun notices when an agent loops: the same failing command or the same edit, over and
          over. It offers to stop and rethink.
        </p>
      </>
    ),
  },
  {
    slug: 'leave-a-review-draft',
    group: 'The arakun command',
    title: 'Leave a review draft',
    summary: 'An agent reviews a pull request; you decide what is posted.',
    body: (
      <>
        <p>
          An agent can review a pull request for you and leave a draft. The draft sends nothing. You
          post it, edit it or discard it in the GitHub tab.
        </p>
        <Code>{`arakun github draft o/r#12 --verdict approve --head <sha> \\
  --body-file - --agent Claude < review.md`}</Code>
        <ul>
          <li>
            <code>--body-file</code> takes a file, or <code>-</code> for stdin.
          </li>
          <li>
            <code>--head</code> is the commit the agent read. An approval needs it.
          </li>
        </ul>
        <h2>Safety</h2>
        <p>
          Posting a draft asks a second time. An approval goes out only for the commit the agent
          read. After new commits, the draft can only be posted as a comment.
        </p>
      </>
    ),
  },

  // Know what they are doing
  {
    slug: 'dynamic-island',
    group: 'Know what they are doing',
    title: 'Dynamic Island',
    summary: 'A small overlay at the top of the screen.',
    body: (
      <>
        <p>
          The Dynamic Island is a small overlay at the top of the screen. It shows what the agents
          of every project are doing: a dot per busy session, and a card when one finishes, fails or
          needs an answer.
        </p>
        <h2>Where it works</h2>
        <p>
          Linux on Wayland only, for now. It needs a compositor with the wlr-layer-shell protocol.
          Windows has no Dynamic Island yet.
        </p>
        <p>
          It runs as its own process, <code>arakun island-host</code>.
        </p>
      </>
    ),
  },
  {
    slug: 'inbox',
    group: 'Know what they are doing',
    title: 'Inbox',
    summary: 'Every notice, grouped by day.',
    body: (
      <>
        <p>
          Every notice Arakun shows, on the island or as a desktop notification, also lands in the
          sidebar's Inbox. It sits under the sessions waiting on you, grouped by day.
        </p>
        <ul>
          <li>Click a notice to open what it is about.</li>
          <li>The badge counts the unread ones. They count as read when you close the Inbox.</li>
          <li>Arakun keeps the last 300.</li>
        </ul>
        <h2>From a terminal</h2>
        <Code>arakun notices --unseen</Code>
      </>
    ),
  },
  {
    slug: 'phone-remote',
    group: 'Know what they are doing',
    title: 'Phone remote',
    summary: 'Follow sessions and answer the agent from a phone.',
    body: (
      <>
        <p>
          Arakun serves a web page that lets a paired phone follow sessions, send prompts and answer
          the agent.
        </p>
        <h2>How the phone reaches your computer</h2>
        <ul>
          <li>Over the local network. This is the default.</li>
          <li>Over Tailscale.</li>
          <li>Through an end-to-end encrypted relay.</li>
        </ul>
        <h2>The relay</h2>
        <p>
          The relay defaults to the hosted one at <code>arakun.dev</code>. You can run your own: it
          is a Cloudflare Worker in the <code>relay/</code> folder of the repository. Point{' '}
          <code>relay_base</code> in <code>phone.json</code> at it.
        </p>
      </>
    ),
  },

  // Go further
  {
    slug: 'keyboard-shortcuts',
    group: 'Go further',
    title: 'Keyboard shortcuts',
    summary: 'The keys for sessions, panes and the palette.',
    body: (
      <>
        <h2>Window</h2>
        <ul>
          <li>
            <K>Ctrl+T</K> new session
          </li>
          <li>
            <K>Ctrl+J</K> toggle the terminal dock
          </li>
          <li>
            <K>Ctrl+B</K> toggle the sidebar
          </li>
          <li>
            <K>Ctrl+D</K> split right, <K>Ctrl+Shift+D</K> split down
          </li>
          <li>
            <K>Ctrl+Alt+arrows</K> move between panes
          </li>
          <li>
            <K>Ctrl+Tab</K> or <K>Ctrl+1…9</K> switch tabs
          </li>
          <li>
            <K>Alt+Up</K> and <K>Alt+Down</K> switch environments
          </li>
          <li>
            <K>Ctrl+F</K> search the conversation
          </li>
          <li>
            <K>Ctrl+=</K>, <K>Ctrl+-</K> and <K>Ctrl+0</K> zoom the whole interface
          </li>
        </ul>
        <h2>The palette</h2>
        <p>
          <K>Ctrl+K</K> or <K>Ctrl+P</K> opens the palette. One search covers sessions of every
          project, GitHub, runs, files and symbols, views, commands, settings and memory.
        </p>
        <ul>
          <li>
            Start with <code>&gt;</code> for commands, <code>/</code> for files, <code>:</code> for
            settings, <code>@</code> for people or <code>#</code> for pull requests.
          </li>
          <li>
            <K>→</K> opens a row's actions or goes into it. <K>←</K> goes back.
          </li>
          <li>
            <K>Ctrl+Enter</K> asks an agent.
          </li>
        </ul>
        <h2>The GitHub tab</h2>
        <ul>
          <li>
            <K>J</K> and <K>K</K> next and previous item
          </li>
          <li>
            <K>A</K> approve, <K>C</K> comment, <K>R</K> review with an agent
          </li>
          <li>
            <K>O</K> open on GitHub
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: 'memory',
    group: 'Go further',
    title: 'Memory',
    summary: 'What agents learn carries over to the next session.',
    body: (
      <>
        <p>
          Agents save what they learn with <code>arakun mem</code>. Every new session starts with an
          index of it in the system prompt.
        </p>
        <p>Memory is plain JSON files: one per repository, plus a global one.</p>
        <h2>Search it</h2>
        <Code>{'arakun mem search <words>'}</Code>
      </>
    ),
  },
  {
    slug: 'headless-agents',
    group: 'Go further',
    title: 'Headless agents',
    summary: 'An agent that keeps going with the app closed.',
    body: (
      <>
        <Code>{'arakun agent run <prompt>'}</Code>
        <p>This starts an agent in its own process. It keeps going with the app closed.</p>
        <h2>The sandbox</h2>
        <p>
          Its tools run inside a bubblewrap sandbox. The workspace is writable and the rest is
          read-only. There are no credentials, and no network unless you pass{' '}
          <code>--allow net</code>.
        </p>
        <h2>The policy</h2>
        <p>
          <code>--policy readonly|workspace|full</code> decides which tool calls need your approval.
          Answer with <code>arakun agent approve</code> or <code>arakun agent deny</code>.
        </p>
        <h2>Limits</h2>
        <p>
          Linux only: it needs <code>bwrap</code>. Headless runs use Workers AI models for now.
        </p>
      </>
    ),
  },
  {
    slug: 'server',
    group: 'Go further',
    title: 'Server',
    summary: 'Arakun without a window, for a machine nobody sits at.',
    body: (
      <>
        <p>
          <code>arakun server serve</code> is Arakun without a window: for a build box, the
          workstation at the office or a VPS. It runs sessions of any agent signed in on that
          machine and keeps them going while nothing is connected.
        </p>
        <p>
          <code>arakun-server</code> is the same server as a program of its own. It needs no display
          library.
        </p>
        <h2>Start it and pair a device</h2>
        <Code>{`arakun-server serve   # runs until Ctrl+C
arakun-server pair    # in another terminal: a link and its QR code`}</Code>
        <p>The link is good for two minutes and pairs one device. Use it in one of two ways:</p>
        <ul>
          <li>In the app: open the Servers tab and paste the link.</li>
          <li>On a phone, or in any browser: open the link.</li>
        </ul>
        <h2>Work with sessions</h2>
        <Code>{`arakun-server add ~/code/app                 # a folder sessions can start in
arakun-server new --agent claude "fix the failing test"
arakun-server ls                             # folders and sessions
arakun-server wait <id>                      # until it stops working
arakun-server send <id> <text>               # a follow-up
arakun-server approve <id>                   # or deny`}</Code>
        <h2>How devices reach it</h2>
        <ul>
          <li>
            <code>--reach relay</code> is the default. The server dials out, so it works behind a
            firewall, and everything between the device and the server is end-to-end encrypted.
          </li>
          <li>
            <code>--reach tailscale</code> serves it at the machine's tailnet name over HTTPS.
          </li>
          <li>
            <code>--reach lan</code> listens over plain HTTP. Nothing is encrypted. Use it only on a
            network you trust.
          </li>
        </ul>
        <p>
          Sign in to each agent on that machine first. The server uses its logins and its permission
          settings.
        </p>
      </>
    ),
  },
  {
    slug: 'crash-reports',
    group: 'Go further',
    title: 'Crash reports and usage counts',
    summary: 'What the app sends, and how to turn it off.',
    body: (
      <>
        <p>
          Arakun sends nothing until you say so. On first launch it asks "Send crash reports and
          usage counts?". Closing the question answers nothing, and Arakun asks again the next time
          it starts.
        </p>
        <h2>What is sent</h2>
        <ul>
          <li>
            <strong>Crash reports:</strong> a crash's message and stack trace. Your home folder
            becomes <code>~</code>, and paths, links, emails and anything shaped like a key or token
            are removed. When an agent stops with an error, only the agent's name and a fixed
            category such as "rate limited" go out, never the error's text.
          </li>
          <li>
            <strong>Usage counts:</strong> app launched, session started, agent turn finished,
            project added, environment created, a built-in view opened and a browser tab opened.
          </li>
        </ul>
        <p>
          Each report carries Arakun's version, your OS and the CPU architecture. Arakun never sends
          prompts, replies, file contents, URLs or project names. <a href="/privacy">Privacy</a>{' '}
          says who receives the reports and how long we keep them.
        </p>
        <h2>Change your answer</h2>
        <p>
          Open Settings › General and turn Crash reports or Usage counts on or off. Each switch
          works on its own.
        </p>
        <h2>Turn both off</h2>
        <p>
          Set <code>DO_NOT_TRACK=1</code> or <code>ARAKUN_TELEMETRY=0</code> in the environment
          Arakun starts in. Both stay off, and Arakun does not ask.
        </p>
        <h2>The files</h2>
        <p>Two files in Arakun's data folder hold the setting:</p>
        <ul>
          <li>
            <code>telemetry.json</code>: your answer.
          </li>
          <li>
            <code>telemetry-id</code>: a random id that the reports carry. It is not tied to any
            account.
          </li>
        </ul>
        <p>The data folder is in one of these places:</p>
        <ul>
          <li>
            Linux and macOS: <code>~/.local/share/arakun</code>
          </li>
          <li>
            Windows: <code>%LOCALAPPDATA%\arakun</code>
          </li>
        </ul>
        <p>
          Delete <code>telemetry-id</code> and Arakun makes a new id. To have the reports for an id
          deleted, send the id to <a href={`mailto:${site.privacyEmail}`}>{site.privacyEmail}</a>.
        </p>
      </>
    ),
  },
]

export const groups = [...new Set(docs.map((doc) => doc.group))].map((title) => ({
  title,
  docs: docs.filter((doc) => doc.group === title),
}))

export const groupSlug = (title: string) => title.toLowerCase().replaceAll(' ', '-')
