import type { MDXComponents } from 'mdx/types'
import type { ComponentProps, ReactNode } from 'react'
import { site } from '#/site'

// The components a post can use without importing them. Each one also needs a plain
// Markdown form in vite/blog.ts (asMarkdown), which the build checks, so agents that
// read /blog/<slug> as Markdown get the same facts.

const SCHEME = /^https?:\/\//u

export interface BarChartRow {
  /** Draw this bar in the accent color: the result the chart is about. */
  highlight?: boolean
  label: string
  /** A short aside after the label, such as "121 MiB app-only". */
  note?: string
  value: number
  /** The value as people should read it, such as "309 ms (2.5×)". */
  valueLabel: string
}

/** Horizontal bars, one per row, scaled to `max` (or to the largest value). */
export function BarChart({
  title,
  subtitle,
  max,
  rows,
}: {
  max?: number
  rows: BarChartRow[]
  subtitle?: string
  title: string
}) {
  const top = max ?? Math.max(...rows.map((row) => row.value))
  return (
    <figure className="bench-chart">
      <figcaption>
        <span className="bench-chart-title">{title}</span>
        {subtitle ? <span className="bench-chart-sub mono-label">{subtitle}</span> : null}
      </figcaption>
      <div className="bench-bars">
        {rows.map((row) => {
          const pct = Math.max(4, Math.min(100, (row.value / top) * 100))
          return (
            <div
              className="bench-row"
              data-highlight={row.highlight ? 'true' : undefined}
              key={row.label}
            >
              <div className="bench-row-head">
                <span className="bench-label">
                  {row.label}
                  {row.note ? <span className="bench-note"> · {row.note}</span> : null}
                </span>
                <span className="bench-val">{row.valueLabel}</span>
              </div>
              <div className="bench-track">
                <div className="bench-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

type CalloutTone = 'note' | 'tip' | 'warning'
const calloutTitle: Record<CalloutTone, string> = { note: 'Note', tip: 'Tip', warning: 'Warning' }

/** A boxed aside: `<Callout tone="tip" title="Try it">…</Callout>`. */
export function Callout({
  tone = 'note',
  title,
  children,
}: {
  children: ReactNode
  title?: string
  tone?: CalloutTone
}) {
  return (
    <aside className="callout" data-tone={tone}>
      <p className="callout-title mono-label">{title ?? calloutTitle[tone]}</p>
      <div className="callout-body">{children}</div>
    </aside>
  )
}

/** A row of headline numbers. Put <Stat> elements inside. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stat-grid">{children}</div>
}

/** One headline number: `<Stat value="309 ms" label="launch into a project" note="2.5× faster" />`. */
export function Stat({ value, label, note }: { label: string; note?: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {note ? <span className="stat-note mono-label">{note}</span> : null}
    </div>
  )
}

/** An image with a caption. Put the file under public/blog/<slug>/. */
export function Figure({
  src,
  alt,
  caption,
  width,
  height,
  wide,
}: {
  alt: string
  caption?: string
  /** The image's size in pixels, so the page does not jump while it loads. */
  height: number
  src: string
  width: number
  /** Let the image run wider than the text column on large screens. */
  wide?: boolean
}) {
  return (
    <figure className="blog-figure" data-wide={wide ? 'true' : undefined}>
      <img alt={alt} decoding="async" height={height} loading="lazy" src={src} width={width} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

/** Pairs each entry with a key from its text, numbering repeats ("git", "git-2"), so two equal labels don't share a key. */
function keyed<T>(entries: T[], text: (entry: T) => string) {
  const seen = new Map<string, number>()
  return entries.map((entry) => {
    const base = text(entry)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return { entry, key: count === 1 ? base : `${base}-${count}` }
  })
}

export interface FlowStep {
  /** Draw this step in the accent color: the one the text is about. */
  highlight?: boolean
  label: string
  /** A short line under the label, such as "one JSON line each way". */
  note?: string
}

/** The arrow between two steps. It points right, and down when the steps stack. */
function FlowArrow() {
  return (
    <svg
      aria-hidden="true"
      className="flow-arrow"
      fill="none"
      height="12"
      viewBox="0 0 20 12"
      width="20"
    >
      <path
        d="M0 6h18M13 1l5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/** Steps that follow each other, joined by arrows: `<Flow title="…" steps={[{ label: "…" }]} />`. */
export function Flow({
  title,
  caption,
  steps,
}: {
  caption?: string
  steps: FlowStep[]
  title: string
}) {
  return (
    <figure className="diagram">
      <figcaption>
        <span className="diagram-title">{title}</span>
        {caption ? <span className="diagram-caption">{caption}</span> : null}
      </figcaption>
      <ol className="flow-steps">
        {keyed(steps, (step) => step.label).map(({ entry: step, key }, index) => (
          <li className="flow-step" key={key}>
            {index > 0 ? <FlowArrow /> : null}
            <div className="flow-box" data-highlight={step.highlight ? 'true' : undefined}>
              <span className="flow-label">{step.label}</span>
              {step.note ? <span className="flow-note">{step.note}</span> : null}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  )
}

export interface LayerRow {
  /** Draw this layer in the accent color: the one the text is about. */
  highlight?: boolean
  items: string[]
  label: string
}

/** Layers stacked top to bottom, each with the parts it holds: `<Layers title="…" rows={[…]} />`. */
export function Layers({
  title,
  caption,
  rows,
}: {
  caption?: string
  rows: LayerRow[]
  title: string
}) {
  return (
    <figure className="diagram">
      <figcaption>
        <span className="diagram-title">{title}</span>
        {caption ? <span className="diagram-caption">{caption}</span> : null}
      </figcaption>
      <div className="layers">
        {keyed(rows, (row) => row.label).map(({ entry: row, key }) => (
          <div className="layer" data-highlight={row.highlight ? 'true' : undefined} key={key}>
            <span className="layer-label mono-label">{row.label}</span>
            <ul className="layer-items">
              {keyed(row.items, (item) => item).map(({ entry: item, key: itemKey }) => (
                <li key={itemKey}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </figure>
  )
}

/**
 * Wraps a Markdown table. `highlight={2}` marks the second column as the result
 * the table is about. Leave a blank line after the opening tag and before the closing one.
 */
export function DataTable({ highlight, children }: { children: ReactNode; highlight?: number }) {
  return (
    <div className="bench-data" data-highlight={highlight}>
      {children}
    </div>
  )
}

/** A link to an Arakun release on GitHub: `<Release version="v0.18.1" />`. */
export function Release({ version }: { version: string }) {
  return (
    <a href={`${site.releasesUrl}/tag/${version}`} rel="noopener" target="_blank">
      {site.name} {version}
    </a>
  )
}

/** Code blocks get a label with their language: ```sh shows "sh". */
function Pre({ children, ...props }: ComponentProps<'pre'>) {
  const className = (children as { props?: { className?: string } }).props?.className ?? ''
  const lang = className.replace('language-', '')
  return (
    <div className="blog-code-wrap">
      {lang && lang !== 'text' ? <span className="blog-code-lang mono-label">{lang}</span> : null}
      <pre className="blog-code" {...props}>
        {children}
      </pre>
    </div>
  )
}

/**
 * Headings get a "#" link to themselves, so a reader can share a section. It sits
 * beside the text, not around it, so a link in the heading is never inside another.
 */
function anchored(Tag: 'h2' | 'h3') {
  return function Heading({ id, children, ...props }: ComponentProps<'h2'>) {
    return (
      <Tag className="anchored" id={id} {...props}>
        {id ? (
          <a aria-label="Link to this section" className="heading-anchor" href={`#${id}`}>
            #
          </a>
        ) : null}
        {children}
      </Tag>
    )
  }
}

const siteOrigin = new URL(site.url).origin
/** Whether a link leaves the site. Compares origins, so arakun.dev.example.com counts as another site. */
function isExternal(href: string) {
  if (!SCHEME.test(href)) {
    return false
  }
  try {
    return new URL(href).origin !== siteOrigin
  } catch {
    return true
  }
}

/** Links to other sites open in a new tab; links on this site stay in it. */
function Anchor({ href = '', ...props }: ComponentProps<'a'>) {
  return isExternal(href) ? (
    <a href={href} rel="noopener" target="_blank" {...props} />
  ) : (
    <a href={href} {...props} />
  )
}

/** A bare Markdown table scrolls sideways on a narrow screen instead of breaking the layout. */
function Table(props: ComponentProps<'table'>) {
  return (
    <div className="bench-table-wrap">
      <table className="bench-table" {...props} />
    </div>
  )
}

export const mdxComponents: MDXComponents = {
  a: Anchor,
  h2: anchored('h2'),
  h3: anchored('h3'),
  pre: Pre,
  table: Table,
  BarChart,
  Callout,
  DataTable,
  Figure,
  Flow,
  Layers,
  Release,
  Stat,
  StatGrid,
}
