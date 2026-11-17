import type { ReactNode } from 'react'

const NEWLINE = /\r\n?/gu
const FENCE = '```'
const HEADING = /^#{1,6}\s+(?<text>.*)$/u
const LIST_ITEM = /^\s*[-*+]\s+(?<text>.*)$/u
const INDENTED = /^\s+\S/u
const INLINE =
  /(?<code>`[^`]+`)|(?<bold>\*\*[^*]+\*\*)|(?<link>\[(?<label>[^\]]+)\]\((?<href>[^)\s]+)\))|(?<url>https?:\/\/[^\s<>)]+[^\s<>).,;:!?])/gu
const GITHUB_PULL = /github\.com\/[^/]+\/[^/]+\/(?:pull|issues)\/(?<number>\d+)/u
const GITHUB_COMPARE = /github\.com\/[^/]+\/[^/]+\/(?:compare|commits)\/(?<range>.+)$/u
const SCHEME = /^https?:\/\//u
const HTTP = /^https?:\/\//iu

/**
 * Renders the markdown GitHub release notes use: headings, lists, paragraphs,
 * code blocks, and inline code, bold, links and bare URLs.
 *
 * It builds React elements and never sets HTML, so text written on GitHub
 * cannot inject markup into the page. Links are kept only when they are
 * http(s). Anything it does not know is shown as plain text.
 */
export function Markdown({ source }: { source: string }) {
  return <div className="md">{blocks(source)}</div>
}

function blocks(source: string): ReactNode[] {
  const out: ReactNode[] = []
  let paragraph: string[] = []
  let items: string[] = []
  // The lines of an open code block, or null outside one.
  let code: string[] | null = null

  const flush = () => {
    if (paragraph.length) {
      out.push(<p key={out.length}>{inline(paragraph.join(' '))}</p>)
    }
    if (items.length) {
      out.push(
        <ul key={out.length}>
          {items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the list is built once and never reorders.
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>
      )
    }
    paragraph = []
    items = []
  }
  const closeCode = (lines: string[]) => {
    out.push(
      <pre key={out.length}>
        <code>{lines.join('\n')}</code>
      </pre>
    )
    code = null
  }

  for (const line of source.replace(NEWLINE, '\n').split('\n')) {
    if (code) {
      if (line.startsWith(FENCE)) {
        closeCode(code)
      } else {
        code.push(line)
      }
      continue
    }
    if (line.startsWith(FENCE)) {
      flush()
      code = []
      continue
    }
    const heading = HEADING.exec(line)?.groups?.text
    const item = LIST_ITEM.exec(line)?.groups?.text
    if (heading !== undefined) {
      flush()
      // Release notes sit under the release's own title, so every heading is a small one.
      out.push(<h3 key={out.length}>{inline(heading)}</h3>)
    } else if (item !== undefined) {
      if (paragraph.length) {
        flush()
      }
      items.push(item)
    } else if (!line.trim()) {
      flush()
    } else if (items.length && INDENTED.test(line)) {
      // An indented line continues the list item above it.
      items[items.length - 1] += ` ${line.trim()}`
    } else {
      if (items.length) {
        flush()
      }
      paragraph.push(line.trim())
    }
  }
  // A code block nobody closed runs to the end of the notes.
  if (code) {
    closeCode(code)
  }
  flush()
  return out
}

/** GitHub writes pull requests and comparisons as full URLs. Show them the way GitHub does. */
function linkLabel(url: string) {
  const pull = GITHUB_PULL.exec(url)?.groups?.number
  if (pull) {
    return `#${pull}`
  }
  const range = GITHUB_COMPARE.exec(url)?.groups?.range
  if (range) {
    return range
  }
  return url.replace(SCHEME, '')
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) {
      out.push(text.slice(last, match.index))
    }
    const { code, bold, label, href, url } = match.groups ?? {}
    const key = out.length
    if (code) {
      out.push(<code key={key}>{code.slice(1, -1)}</code>)
    } else if (bold) {
      out.push(<strong key={key}>{bold.slice(2, -2)}</strong>)
    } else if (label && href) {
      out.push(
        HTTP.test(href) ? (
          <a href={href} key={key}>
            {label}
          </a>
        ) : (
          label
        )
      )
    } else if (url) {
      out.push(
        <a href={url} key={key}>
          {linkLabel(url)}
        </a>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) {
    out.push(text.slice(last))
  }
  return out
}
