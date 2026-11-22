import { site } from '#/site'

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
  cardTitle?: string
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
    cardTitle: 'Arakun vs T3 Code vs Orca',
    title:
      'Arakun v0.17 vs T3 Code vs Orca: startup, 10 terminals, flood and browser tabs on Linux',
    description:
      'Native Wayland and hardware GPU benchmark of Arakun v0.17.0, T3 Code v0.1.11 and Orca v1.4.269: launch, 10 terminals, 14.8 MB PTY flood and 3 browser tabs.',
    published: '2026-11-22',
    updated: '2026-11-22',
    author: 'Arakun team',
    readingMinutes: 6,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Coding agent workspaces stay open all day while several agents compile, run tests and stream megabytes of output in parallel. When the shell around those agents already eats nearly a gigabyte of RAM before you start a single agent, every extra worktree hurts.',
          'We measured the official Linux x86_64 releases of Arakun v0.17.0 (Rust + GPUI), T3 Code v0.1.11 (Electron) and Orca v1.4.269 (Electron) on native Wayland with hardware GPU rendering (Hyprland on an AMD Radeon RX 9060 XT, visible 1920×1080 workspace). All three apps were pre-seeded with the same git repository open so none was measured on a welcome screen.',
        ],
        table: {
          headers: [
            'Metric (native Wayland + GPU)',
            'Arakun v0.17.0',
            'T3 Code v0.1.11',
            'Orca v1.4.269',
          ],
          rows: [
            ['Stack', 'Rust + GPUI', 'Electron + Web', 'Electron + Web'],
            [
              'Launch into open project (5 runs)',
              '304.9 ms (302.4–314.2)',
              '778.5 ms (754.9–788.4)',
              '1,451.2 ms (1,420.9–1,546.7)',
            ],
            [
              'Project open, idle PSS (5 runs)',
              '114.3 MiB (4 procs)',
              '854.4 MiB (12 procs)',
              '934.8 MiB (13 procs)',
            ],
            ['Project open, idle RSS (5 runs)', '245.7 MiB', '1,438.2 MiB', '1,765.0 MiB'],
            [
              'Idle CPU, start view (10 s)',
              '12.98% (bug — see below)',
              '1.90%',
              '0.50% (run 1: 57.69%)',
            ],
            [
              'Project + 10 live terminals (PSS)',
              '138.2 MiB (123.6 app-only)',
              '911.6 MiB (899.1 app-only)',
              '995.8 MiB (982.0 app-only)',
            ],
            [
              '14.8 MB PTY flood (median of 3)',
              '493 ms (489–504 ms)',
              'not tested (no CLI)',
              '1,764 ms (1,666–1,887 ms)',
            ],
            ['CPU while flooding / PSS after', '138.1% / 188.4 MiB', '—', '235.9% / 1,258.2 MiB'],
            [
              '+ 1 built-in browser tab (PSS)',
              '528.7 MiB (CEF loaded)',
              'no built-in browser',
              '1,210.3 MiB',
            ],
            [
              '+ 3 built-in browser tabs (PSS)',
              '567.5 MiB',
              'no built-in browser',
              '962.9 MiB (1,210.3 at 1)',
            ],
            ['Idle CPU with 3 browser tabs (10 s)', '3.09%', '—', '7.85%'],
            [
              'Download / extracted on disk',
              '165.4 / 377 MiB',
              '242.5 / 656 MiB',
              '267.0 / 833 MiB',
            ],
          ],
        },
      },
      {
        heading: 'Launch into an open project',
        paragraphs: [
          'Each app ran one warm-up launch where we dismissed onboarding and added the same fixture git repository, then exited cleanly. We then timed five launches from process spawn to Hyprland emitting its openwindow event on the visible workspace. AppImages were extracted beforehand with --appimage-extract so FUSE mount overhead was never billed against T3 Code or Orca.',
        ],
        chart: {
          title: 'Time to first mapped Wayland window (lower is better)',
          subtitle: 'Median of 5 runs into the same open repo · milliseconds',
          max: 1550,
          rows: [
            { label: 'Arakun v0.17.0', value: 304.9, valueLabel: '305 ms', highlight: true },
            { label: 'T3 Code v0.1.11', value: 778.5, valueLabel: '779 ms (2.6×)' },
            { label: 'Orca v1.4.269', value: 1451.2, valueLabel: '1,451 ms (4.8×)' },
          ],
        },
      },
      {
        heading: 'Memory with a project and 10 live terminals',
        paragraphs: [
          'For multi-process apps, summing RSS double-counts shared libraries across Electron helpers. We read Proportional Set Size (PSS) from /proc/<pid>/smaps_rollup across every process in each app tree, both idle with the project open and after opening 1, 5 and 10 interactive shells.',
          'Going from an open project (114.3 MiB total, 111.0 MiB app-only excluding the default dock shell) to 10 live terminals adds 23.9 MiB total and only 12.6 MiB of app memory in Arakun (138.2 MiB total, 123.6 MiB app-only). T3 Code sits at 911.6 MiB (899.1 MiB app-only) and Orca reaches 995.8 MiB (982.0 MiB app-only).',
        ],
        chart: {
          title: 'Total PSS memory with project open + 10 terminals (lower is better)',
          subtitle: 'Native Wayland + RX 9060 XT · MiB across full process tree',
          max: 1050,
          rows: [
            {
              label: 'Arakun v0.17.0',
              value: 138.2,
              valueLabel: '138 MiB',
              note: '124 MiB app-only',
              highlight: true,
            },
            {
              label: 'T3 Code v0.1.11',
              value: 911.6,
              valueLabel: '912 MiB (6.6×)',
              note: '899 MiB app-only',
            },
            {
              label: 'Orca v1.4.269',
              value: 995.8,
              valueLabel: '996 MiB (7.2×)',
              note: '982 MiB app-only',
            },
          ],
        },
      },
      {
        heading: 'Terminal flood throughput (14.8 MB of output)',
        paragraphs: [
          'Coding agents stream huge test logs, compiler errors and diffs. To measure real PTY backpressure, we ran seq 1 2000000 (~14.8 MB of text) three times in a visible terminal inside the open repository and timed how long the command took to exit.',
          'Because kernel PTY buffers are small, seq cannot finish until the terminal emulator drains its output. Arakun drained 14.8 MB in 493 ms median (~30.0 MB/s) at 138% CPU and finished all three floods at 188.4 MiB PSS (opening a new dock terminal per flood, so all three stayed in scrollback). Orca took 1,764 ms median (~8.4 MB/s — 3.6× slower) at 236% CPU and ended at 1,258.2 MiB PSS. T3 Code has no CLI to send commands into its terminal drawer, so we left it out of the flood comparison rather than testing a different path.',
        ],
        chart: {
          title: 'Time to drain seq 1 2000000 (~14.8 MB) in a terminal (lower is better)',
          subtitle: 'Median of 3 runs on native Wayland · milliseconds',
          max: 1950,
          rows: [
            {
              label: 'Arakun v0.17.0',
              value: 493,
              valueLabel: '493 ms (~30.0 MB/s)',
              highlight: true,
            },
            {
              label: 'Orca v1.4.269',
              value: 1764,
              valueLabel: '1,764 ms (~8.4 MB/s · 3.6× slower)',
            },
          ],
        },
      },
      {
        heading: 'What happens when Arakun loads its built-in browser (CEF)',
        paragraphs: [
          'The fair objection to any native-vs-Electron chart is: what happens once Arakun opens a web page? Arakun ships CEF (308 MiB on disk) and dlopens it lazily on the first browser tab, so you pay zero Chromium memory until you open one.',
          'After the 10 terminals and three 14.8 MB floods, we opened 1, 2 and 3 deterministic local HTML pages (each with styled layout and 250 table rows) in both Arakun and Orca and measured both PSS and 10-second idle CPU with all 3 tabs visible.',
        ],
        chart: {
          title: 'Total PSS with 10 terminals + 3 floods + 3 browser tabs (lower is better)',
          subtitle: 'Same 3 local HTML pages · MiB across full process tree (CEF loaded in Arakun)',
          max: 1260,
          rows: [
            {
              label: 'Arakun v0.17.0 (with CEF)',
              value: 567.5,
              valueLabel: '568 MiB',
              note: '3.09% idle CPU',
              highlight: true,
            },
            {
              label: 'Orca v1.4.269',
              value: 962.9,
              valueLabel: '963 MiB (1.7×)',
              note: '1,210 MiB at 1 tab · 7.85% idle CPU',
            },
          ],
        },
      },
      {
        heading: 'Where Arakun lost — and other nuances',
        paragraphs: ['Benchmarks only help if you report the rows you lose too:'],
        bullets: [
          'Arakun idle CPU on the project start view (12.98%): Arakun lost this row to Orca (0.50% on runs 2–5) and T3 Code (1.90%). The start screen and Dynamic Island kept repainting while idle; once a browser tab covered the start view, Arakun idle CPU dropped to 3.09% (beating Orca at 7.85%). We are treating that idle repaint as a bug to fix.',
          'T3 Code background codex process: on startup, T3 Code auto-spawned 1 codex process (78.4 MiB) alongside 7 t3code Electron processes (761.9 MiB) and 1 node process (10.2 MiB). Excluding codex, T3 Code still uses ~776 MiB idle (6.8× Arakun).',
          'Orca run 1 spike and GC dip: Orca hit 1,084.2 MiB PSS and 57.69% CPU on run 1 during CLI discovery before settling to 932–940 MiB and 0.40–0.50% CPU on runs 2–5. During the browser test, Orca peaked at 1,210.3 MiB on tab 1 before Chromium GC brought it to 932.9–962.9 MiB on tabs 2–3.',
          'Active agent CLIs: these numbers measure the workspace apps themselves. Running Claude Code, Codex or Devin sessions adds each CLI process on top of whichever app hosts it.',
        ],
      },
      {
        heading: 'Hardware, environment and releases tested',
        paragraphs: [
          'All measurements ran on November 22, 2026 using unmodified official Linux x86_64 releases on AMD Ryzen 9 5900X (12 cores / 24 threads), 46 GiB RAM, AMD Radeon RX 9060 XT, Linux 7.3.4-zen2-2-zen, Hyprland Wayland (DP-2, 1920×1080 visible workspace, cursor parked at 500,500). Electron apps ran with --no-sandbox --ozone-platform=wayland from extracted AppImages.',
        ],
        code: `Arakun:  ${site.releasesUrl}/tag/v0.17.0
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
