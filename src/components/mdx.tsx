import { Children, createContext, isValidElement, useContext, useId, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { MDXComponents } from 'mdx/types'
import { useCelebrate } from './Celebrate'

/**
 * The components a docs page can use in MDX, after Fumadocs UI's: Callout, Steps,
 * Tabs, Cards and Accordions. They use the site's tokens, not Fumadocs' styles.
 * Code blocks get a title and a copy button, and headings get a link to themselves.
 */

/** A link inside the site moves with the router; any other opens as usual. */
function SmartLink({ href = '', children, ...props }: ComponentProps<'a'>) {
  if (href.startsWith('/') && !href.startsWith('//')) {
    // The href comes from MDX, so the router can't check it; an unknown path shows the 404 page.
    return (
      <Link to={href as '/'} {...(props as object)}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

const icon = {
  info: <path d="M12 16v-5m0-3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  tip: <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3Z" />,
  warn: <path d="M12 9v4m0 3h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  error: <path d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  success: <path d="m8 12.5 2.5 2.5L16 9.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
}
type CalloutType = keyof typeof icon
// The names Fumadocs and Docusaurus use, so pages written for either work here.
const alias: Record<string, CalloutType> = { note: 'info', idea: 'tip', warning: 'warn', danger: 'error', caution: 'warn' }

export function Callout({ type = 'info', title, children }: { type?: string; title?: ReactNode; children?: ReactNode }) {
  const tone: CalloutType = type in icon ? (type as CalloutType) : (alias[type] ?? 'info')
  return (
    <aside className="callout" data-type={tone}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon[tone]}
      </svg>
      <div>
        {title && <p className="callout-title">{title}</p>}
        {children}
      </div>
    </aside>
  )
}

export const Steps = ({ children }: { children?: ReactNode }) => <div className="steps">{children}</div>
export const Step = ({ children }: { children?: ReactNode }) => <div className="step">{children}</div>

export function Cards({ children }: { children?: ReactNode }) {
  return <div className="cards">{children}</div>
}

export function Card({ title, description, href, children }: { title: ReactNode; description?: ReactNode; href?: string; children?: ReactNode }) {
  const body = (
    <>
      <span className="card-title">{title}</span>
      {description && <span className="card-text">{description}</span>}
      {children && <span className="card-text">{children}</span>}
    </>
  )
  return href ? (
    <SmartLink href={href} className="card">
      {body}
    </SmartLink>
  ) : (
    <div className="card">{body}</div>
  )
}

const TabsContext = createContext<{ id: string; value: string } | null>(null)
const TabIndex = createContext(-1)

/** Tabs with `items`; each <Tab value> shows when its item is picked. All panels stay in the page for search engines. */
export function Tabs({ items, defaultIndex = 0, children }: { items: string[]; defaultIndex?: number; children?: ReactNode }) {
  const id = useId()
  const [value, setValue] = useState(items[defaultIndex] ?? items[0])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const pick = (index: number) => {
    const next = (index + items.length) % items.length
    setValue(items[next])
    buttons.current[next]?.focus()
  }
  return (
    <div className="tabs">
      <div role="tablist" className="tabs-list">
        {items.map((item, index) => (
          <button
            key={item}
            ref={(el) => {
              buttons.current[index] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={item === value}
            tabIndex={item === value ? 0 : -1}
            onClick={() => setValue(item)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') pick(index + 1)
              if (e.key === 'ArrowLeft') pick(index - 1)
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <TabsContext value={{ id, value }}>
        {Children.map(children, (child) =>
          isValidElement<{ value?: string }>(child) && child.props.value !== undefined ? (
            <TabIndex.Provider value={items.indexOf(child.props.value)}>{child}</TabIndex.Provider>
          ) : (
            child
          ),
        )}
      </TabsContext>
    </div>
  )
}

export function Tab({ value, children }: { value: string; children?: ReactNode }) {
  const tabs = useContext(TabsContext)
  const index = useContext(TabIndex)
  return (
    <div
      role="tabpanel"
      className="tabs-panel"
      id={tabs ? `${tabs.id}-panel-${index}` : undefined}
      aria-labelledby={tabs ? `${tabs.id}-tab-${index}` : undefined}
      hidden={tabs ? tabs.value !== value : false}
    >
      {children}
    </div>
  )
}

export const Accordions = ({ children }: { children?: ReactNode }) => <div className="accordions">{children}</div>

export function Accordion({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <details className="accordion">
      <summary>
        {title}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div>{children}</div>
    </details>
  )
}

/** A code block from Shiki: an optional `title="…"` on top and a copy button. */
function CodeBlock({ title, children, ...props }: ComponentProps<'pre'>) {
  const pre = useRef<HTMLPreElement>(null)
  const celebrate = useCelebrate()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  return (
    <figure className="code" data-titled={title ? '' : undefined}>
      {title && <figcaption>{title}</figcaption>}
      <button
        type="button"
        className="code-copy"
        data-state={copied ? 'copied' : 'idle'}
        aria-label={copied ? 'Copied' : 'Copy the code'}
        onClick={(e) => {
          navigator.clipboard?.writeText(pre.current?.querySelector('code')?.innerText ?? '').catch(() => {})
          setCopied(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setCopied(false), 2000)
          celebrate(e.currentTarget, { text: 'Copied. Paste it in a terminal.', label: 'Copied', tone: 'success' }, 12)
        }}
      >
        <svg className="c" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
          <path d="M15 9V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className="ok" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <pre ref={pre} {...props}>
        {children}
      </pre>
    </figure>
  )
}

/** A heading with a link to itself, shown on hover. */
function heading(Tag: 'h2' | 'h3') {
  return function Heading({ id, children, ...props }: ComponentProps<'h2'>) {
    if (!id) return <Tag {...props}>{children}</Tag>
    return (
      <Tag id={id} {...props}>
        <a href={`#${id}`} className="anchor">
          {children}
        </a>
      </Tag>
    )
  }
}

/** A wide table scrolls by itself instead of the page on a narrow screen. */
const Table = (props: ComponentProps<'table'>) => (
  <div className="table">
    <table {...props} />
  </div>
)

export const mdxComponents = {
  a: SmartLink,
  pre: CodeBlock,
  h2: heading('h2'),
  h3: heading('h3'),
  table: Table,
  Callout,
  Steps,
  Step,
  Tabs,
  Tab,
  Cards,
  Card,
  Accordions,
  Accordion,
} satisfies MDXComponents
