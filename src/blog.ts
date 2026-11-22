export interface BenchBar {
  highlight?: boolean
  label: string
  note?: string
  value: number
  valueLabel: string
}

export interface BenchChart {
  max: number
  rows: BenchBar[]
  subtitle: string
  title: string
}

export interface BlogSection {
  bullets?: string[]
  chart?: BenchChart
  code?: string
  heading: string
  paragraphs?: string[]
  table?: {
    headers: string[]
    rows: string[][]
  }
}

export interface BlogPost {
  author: string
  description: string
  published: string
  readingMinutes: number
  sections: BlogSection[]
  slug: string
  title: string
  updated: string
}

export const posts: BlogPost[] = [
  {
    slug: 'arakun-vs-t3code-vs-orca-benchmark',
    title: 'Arakun v0.17 vs T3 Code vs Orca: startup, memory and idle CPU on Linux',
    description:
      'Measured cold launch, proportional memory (PSS), process count and idle CPU across Arakun v0.17.0, T3 Code v0.1.11 and Orca v1.4.269 on Linux.',
    published: '2026-11-22',
    updated: '2026-11-22',
    author: 'Arakun team',
    readingMinutes: 4,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Coding agent workspaces are supposed to stay open all day while several agents compile, run tests and stream output in parallel. When the shell around those agents already eats nearly a gigabyte of RAM before you open a project, every extra worktree hurts.',
          'We measured the official Linux x86_64 releases of Arakun v0.17.0 (Rust + GPUI), T3 Code v0.1.11 (Electron) and Orca v1.4.269 (Electron) on the same machine, under the same isolated X11 display, across five cold launches after one discarded warm-up run.',
        ],
        table: {
          headers: [
            'Metric (median of 5 runs)',
            'Arakun v0.17.0',
            'T3 Code v0.1.11',
            'Orca v1.4.269',
          ],
          rows: [
            ['Stack', 'Rust + GPUI', 'Electron + Web', 'Electron + Web'],
            [
              'First window mapped',
              '85.0 ms (84.8–91.5)',
              '613.4 ms (553.9–630.2)',
              '1,383.5 ms (1,338.6–1,383.9)',
            ],
            [
              'Idle memory (PSS)',
              '141.9 MiB (141.5–142.8)',
              '835.2 MiB (829.6–848.4)',
              '915.2 MiB (914.6–1,108.9)',
            ],
            ['Idle memory (RSS)', '204.7 MiB', '1,497.5 MiB', '1,722.2 MiB'],
            ['Processes at idle', '1', '14', '13'],
            ['Idle CPU (10 s window)', '0.20%', '3.98%', '0.40%'],
            ['Download size (Linux x86_64)', '165.4 MiB', '242.5 MiB', '267.0 MiB'],
            ['Extracted on disk', '377 MiB', '656 MiB', '833 MiB'],
          ],
        },
      },
      {
        heading: 'Cold launch to first window',
        paragraphs: [
          'We timed each launch from process spawn to the first mapped top-level X11 window of at least 200×200 pixels. AppImages were extracted beforehand with --appimage-extract so FUSE mount overhead was not billed against T3 Code or Orca.',
        ],
        chart: {
          title: 'Time to first mapped window (lower is better)',
          subtitle: 'Median of 5 runs after 1 warm-up · milliseconds',
          max: 1450,
          rows: [
            { label: 'Arakun v0.17.0', value: 85.0, valueLabel: '85 ms', highlight: true },
            { label: 'T3 Code v0.1.11', value: 613.4, valueLabel: '613 ms (7.2×)' },
            { label: 'Orca v1.4.269', value: 1383.5, valueLabel: '1,384 ms (16.3×)' },
          ],
        },
      },
      {
        heading: 'Memory at idle (PSS)',
        paragraphs: [
          'For multi-process apps, summing RSS double-counts shared libraries across Electron helpers. We read Proportional Set Size (PSS) from /proc/<pid>/smaps_rollup across every process owned by each app after a 10-second settle window and a 10-second idle window.',
        ],
        chart: {
          title: 'Total process-tree PSS memory at idle (lower is better)',
          subtitle: 'Median of 5 runs · MiB across all app processes',
          max: 960,
          rows: [
            {
              label: 'Arakun v0.17.0',
              value: 141.9,
              valueLabel: '142 MiB',
              note: '1 process',
              highlight: true,
            },
            {
              label: 'T3 Code v0.1.11',
              value: 835.2,
              valueLabel: '835 MiB (5.9×)',
              note: '14 processes',
            },
            {
              label: 'Orca v1.4.269',
              value: 915.2,
              valueLabel: '915 MiB (6.4×)',
              note: '13 processes',
            },
          ],
        },
      },
      {
        heading: 'Where the memory goes',
        paragraphs: [
          'Looking at the per-process breakdown makes the architecture difference clear. It also surfaces details a headline total would hide:',
        ],
        bullets: [
          'Arakun v0.17.0 (141.9 MiB PSS, 1 process): one native Rust binary (69 MiB on disk). Arakun ships CEF (308 MiB on disk) for built-in browser tabs, but dlopens it lazily on the first browser tab. If you only run agents and terminals, you never pay for Chromium.',
          'T3 Code v0.1.11 (835.2 MiB PSS, 14 processes): 7 t3code Electron processes (~710–728 MiB), 2 node backend processes (~21.7 MiB), monitor/bwrap helpers (~1.7 MiB), plus 2 codex processes (~96.5 MiB) that T3 Code auto-spawned on startup. Even excluding those codex processes, T3 Code itself sits at ~739 MiB PSS (5.2× Arakun).',
          'Orca v1.4.269 (915.2 MiB PSS, 13 processes): 9 orca-ide Electron processes (~863.5 MiB on settled runs), 1 orca-agents daemon (~46.5 MiB), and shell/crashpad helpers (~4.7 MiB). Run 1 also hit 1,108.9 MiB PSS and 57.95% CPU during initial CLI discovery before runs 2–5 settled at 915 MiB and 0.30–0.50% CPU.',
        ],
      },
      {
        heading: 'Hardware, method and caveats',
        paragraphs: [
          'Every benchmark has limits. State them up front so anyone can check the numbers or run their own.',
        ],
        bullets: [
          'Machine: AMD Ryzen 9 5900X (12 cores / 24 threads), 46 GiB RAM, AMD Radeon RX 9060 XT, Linux 7.3.4-zen2-2-zen.',
          'Display: isolated Xvfb :98 (1440×900×24) with WAYLAND_DISPLAY unset and --ozone-platform=x11 --no-sandbox for the extracted Electron AppImages, so all three apps ran on the same X11 server without touching the active desktop.',
          'Scope: this measures clean idle baseline before opening a repository, terminals or browser tabs. Opening a browser tab in Arakun loads CEF and adds Chromium processes; opening active agent sessions in any of the three adds the memory of the underlying CLI (Claude Code, Codex, Devin, etc.).',
          'Presentation: Xvfb does not expose DRI3 hardware presentation, so frame pacing and GPU-accelerated scroll performance are not measured here. We measure Arakun frame times separately with ZED_MEASUREMENTS=1 via tools/bench/bench.py in the repository.',
        ],
      },
      {
        heading: 'Reproduce it yourself',
        paragraphs: [
          'Download the three official Linux x86_64 releases, extract the AppImages so FUSE is out of the loop, launch each under an isolated Xvfb display and fresh HOME, wait 10 seconds, then sum Pss: from /proc/<pid>/smaps_rollup across every process in the app tree.',
        ],
        code: `# Official releases tested (2026-11-22)
Arakun:  https://github.com/ArakunHQ/arakun/releases/tag/v0.17.0
T3 Code: https://github.com/pingdotgg/t3code/releases/tag/v0.1.11
Orca:    https://github.com/StablyAI/orca/releases/tag/v1.4.269`,
      },
    ],
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug)
}

export function postPath(slug: string): string {
  return `/blog/${slug}`
}

export function postToMarkdown(post: BlogPost): string {
  const parts: string[] = [
    `# ${post.title}`,
    '',
    `> ${post.description}`,
    '',
    `Published ${post.published} · ${post.readingMinutes} min read · ${post.author}`,
  ]
  for (const section of post.sections) {
    parts.push('', `## ${section.heading}`)
    for (const p of section.paragraphs ?? []) {
      parts.push('', p)
    }
    if (section.table) {
      const { headers, rows } = section.table
      parts.push(
        '',
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.join(' | ')} |`)
      )
    }
    if (section.chart) {
      parts.push(
        '',
        ...section.chart.rows.map(
          (row) => `- **${row.label}:** ${row.valueLabel}${row.note ? ` (${row.note})` : ''}`
        )
      )
    }
    if (section.bullets) {
      parts.push('', ...section.bullets.map((b) => `- ${b}`))
    }
    if (section.code) {
      parts.push('', '```', section.code, '```')
    }
  }
  return `${parts.join('\n')}\n`
}
