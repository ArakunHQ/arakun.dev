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
    title:
      'Arakun v0.17 vs T3 Code vs Orca: startup, 10 terminals, flood and browser tabs on Linux',
    description:
      'Measured cold launch, idle and 10-terminal PSS memory, 14.8 MB PTY flood throughput and CEF vs Electron browser tabs across Arakun v0.17.0, T3 Code v0.1.11 and Orca v1.4.269.',
    published: '2026-11-22',
    updated: '2026-11-22',
    author: 'Arakun team',
    readingMinutes: 6,
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'Coding agent workspaces stay open all day while several agents compile, run tests and stream megabytes of output in parallel. When the shell around those agents already eats a gigabyte of RAM before you open a project, every extra worktree hurts.',
          'We measured the official Linux x86_64 releases of Arakun v0.17.0 (Rust + GPUI), T3 Code v0.1.11 (Electron) and Orca v1.4.269 (Electron) on the same machine and isolated X11 display: clean idle baseline (5 runs), a real project with 10 open terminals, a 14.8 MB terminal output flood, and 1–3 built-in browser tabs (with CEF loaded in Arakun).',
        ],
        table: {
          headers: ['Metric', 'Arakun v0.17.0', 'T3 Code v0.1.11', 'Orca v1.4.269'],
          rows: [
            ['Stack', 'Rust + GPUI', 'Electron + Web', 'Electron + Web'],
            [
              'First window mapped (5 runs)',
              '85.0 ms (84.8–91.5)',
              '613.4 ms (553.9–630.2)',
              '1,383.5 ms (1,338.6–1,383.9)',
            ],
            [
              'Clean idle memory (PSS)',
              '141.9 MiB (1 proc)',
              '835.2 MiB (14 procs)',
              '915.2 MiB (13 procs)',
            ],
            ['Idle CPU (10 s window)', '0.20%', '3.98%', '0.40%'],
            [
              'Project open + 10 terminals (PSS)',
              '208.9 MiB (194.3 app-only)',
              '983.2 MiB (970.7 app-only)',
              '1,169.5 MiB (1,155.8 app-only)',
            ],
            [
              '14.8 MB PTY flood (median of 3)',
              '552 ms (548–556 ms)',
              'not tested (no CLI)',
              '1,947 ms (1,914–1,948 ms)',
            ],
            ['PSS after 3× flood', '267.3 MiB', '—', '1,261.9 MiB'],
            [
              '+ 1 built-in browser tab (PSS)',
              '589.3 MiB (CEF loaded)',
              'no built-in browser',
              '1,311.6 MiB',
            ],
            [
              '+ 3 built-in browser tabs (PSS)',
              '638.7 MiB',
              'no built-in browser',
              '1,152.6 MiB (1,338.9 at 2)',
            ],
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
        heading: 'Cold launch to first window',
        paragraphs: [
          'We timed each launch from process spawn to the first mapped top-level X11 window of at least 200×200 pixels across 5 runs after 1 discarded warm-up run. AppImages were extracted beforehand with --appimage-extract so FUSE mount overhead was never billed against T3 Code or Orca.',
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
        heading: 'Memory with a project and 10 live terminals',
        paragraphs: [
          'For multi-process apps, summing RSS double-counts shared libraries across Electron helpers. We read Proportional Set Size (PSS) from /proc/<pid>/smaps_rollup across every process in each app tree, both at clean idle and after opening a repository with 1, 5 and 10 interactive shells.',
          'Going from an open project (183.6 MiB) to 10 live terminals adds only 10.7 MiB of app memory in Arakun (194.3 MiB excluding the shells themselves). T3 Code sits at 983.2 MiB (970.7 MiB app-only) and Orca reaches 1,169.5 MiB (1,155.8 MiB app-only).',
        ],
        chart: {
          title: 'Total PSS memory with project open + 10 terminals (lower is better)',
          subtitle: 'MiB across full process tree (including shells)',
          max: 1220,
          rows: [
            {
              label: 'Arakun v0.17.0',
              value: 208.9,
              valueLabel: '209 MiB',
              note: '194 MiB app-only',
              highlight: true,
            },
            {
              label: 'T3 Code v0.1.11',
              value: 983.2,
              valueLabel: '983 MiB (4.7×)',
              note: '971 MiB app-only',
            },
            {
              label: 'Orca v1.4.269',
              value: 1169.5,
              valueLabel: '1,170 MiB (5.6×)',
              note: '1,156 MiB app-only',
            },
          ],
        },
      },
      {
        heading: 'Terminal flood throughput (14.8 MB of output)',
        paragraphs: [
          'Coding agents stream huge test logs, compiler errors and diffs. To measure real PTY backpressure, we ran seq 1 2000000 (~14.8 MB of text) three times in a live terminal inside the open repository and timed how long the command took to finish.',
          'Because kernel PTY buffers are small, seq cannot exit until the terminal emulator drains its output. Arakun drained 14.8 MB in 552 ms median (~26.8 MB/s) and finished all three runs at 267.3 MiB PSS. Orca took 1,947 ms median (~7.6 MB/s — 3.5× slower) and ended at 1,261.9 MiB PSS. T3 Code has no CLI to submit commands to its terminal drawer, so we left it out of the flood comparison rather than measuring a different path.',
        ],
        chart: {
          title: 'Time to drain seq 1 2000000 (~14.8 MB) in a terminal (lower is better)',
          subtitle: 'Median of 3 runs · milliseconds',
          max: 2100,
          rows: [
            {
              label: 'Arakun v0.17.0',
              value: 552,
              valueLabel: '552 ms (~26.8 MB/s)',
              highlight: true,
            },
            {
              label: 'Orca v1.4.269',
              value: 1947,
              valueLabel: '1,947 ms (~7.6 MB/s · 3.5× slower)',
            },
          ],
        },
      },
      {
        heading: 'What happens when Arakun loads its built-in browser (CEF)',
        paragraphs: [
          'The fair objection to any native-vs-Electron idle chart is: what happens once Arakun actually opens a web page? Arakun ships CEF (308 MiB on disk) and loads it lazily on the first browser tab, so you pay zero Chromium overhead until you use it.',
          'To test the worst case, after the 10 terminals and three 14.8 MB floods, we opened 1, 2 and 3 deterministic local HTML pages (each with styled layout and 250 table rows) in both Arakun and Orca.',
        ],
        chart: {
          title: 'Total PSS with 10 terminals + 3 floods + 3 browser tabs (lower is better)',
          subtitle: 'Same 3 local HTML pages · MiB across full process tree (CEF loaded in Arakun)',
          max: 1400,
          rows: [
            {
              label: 'Arakun v0.17.0 (with CEF)',
              value: 638.7,
              valueLabel: '639 MiB',
              note: '589 MiB at 1 tab · 622 at 2',
              highlight: true,
            },
            {
              label: 'Orca v1.4.269',
              value: 1152.6,
              valueLabel: '1,153 MiB (1.8×)',
              note: '1,312 MiB at 1 tab · 1,339 at 2',
            },
          ],
        },
        bullets: [
          'Even with CEF loaded, 3 live browser tabs, 10 terminals and 3 floods in scrollback, Arakun (638.7 MiB PSS) still uses less memory than T3 Code (835.2 MiB) or Orca (915.2 MiB) at empty idle.',
          'In Orca, PSS rose to 1,311.6 MiB at 1 tab and 1,338.9 MiB at 2 tabs before Chromium GC reclaimed ~186 MiB by tab 3 (1,152.6 MiB).',
          'In the idle breakdown, T3 Code auto-spawned 2 codex processes (~96.5 MiB) on startup alongside 7 t3code Electron processes (~710–728 MiB) and 2 node processes (~21.7 MiB). Excluding codex, T3 Code still sits at ~739 MiB idle (5.2× Arakun).',
          'Orca spiked to 1,108.9 MiB PSS and 57.95% CPU on run 1 while scanning installed CLIs before settling to 915 MiB and 0.30–0.50% CPU on runs 2–5.',
        ],
      },
      {
        heading: 'Hardware, method and caveats',
        paragraphs: [
          'Every benchmark has limits. These are the exact conditions so anyone can verify or repeat the test:',
        ],
        bullets: [
          'Machine: AMD Ryzen 9 5900X (12 cores / 24 threads), 46 GiB RAM, AMD Radeon RX 9060 XT, Linux 7.3.4-zen2-2-zen.',
          'Display: isolated Xvfb :98 (1440×900×24) with WAYLAND_DISPLAY unset and --ozone-platform=x11 --no-sandbox for the extracted Electron AppImages, so all three apps ran under identical X11 conditions.',
          'Accounting: every process matching the app environment tag, extracted binary path or sandbox directory was summed from /proc/<pid>/smaps_rollup (PSS). Active coding agent CLIs (Claude Code, Codex, Devin) add their own process memory on top of any workspace app.',
          'GPU presentation: Xvfb uses software presentation without DRI3, so hardware-accelerated frame pacing is not compared here. On software Lavapipe via tools/bench/bench.py perf (3 runs), Arakun median frame times stayed between 9.3 ms and 15.6 ms across idle, sidebar, zoom, palette, long-file scroll and terminal flood.',
        ],
      },
      {
        heading: 'Releases tested',
        paragraphs: [
          'All measurements used unmodified official Linux x86_64 releases downloaded on November 22, 2026:',
        ],
        code: `Arakun:  https://github.com/ArakunHQ/arakun/releases/tag/v0.17.0
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
  return `${parts.join('\\n')}\\n`
}
