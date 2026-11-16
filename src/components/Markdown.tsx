import type { ReactNode } from 'react'

/**
 * Renders the markdown GitHub release notes use: headings, lists, paragraphs,
 * code blocks, and inline code, bold, links and bare URLs.
 *
 * It builds React elements and never sets HTML, so text written on GitHub
 * cannot inject markup into the page. Links are kept only when they are
 * http(s). Anything it does not know is shown as plain text.
 */
export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = []
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  let paragraph: string[] = []
  let items: string[] = []

  const flush = () => {
    if (paragraph.length) blocks.push(<p key={blocks.length}>{inline(paragraph.join(' '))}</p>)
    if (items.length) {
      blocks.push(
        <ul key={blocks.length}>
          {items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      )
    }
    paragraph = []
    items = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = line.match(/^```/)
    if (fence) {
      flush()
      const code: string[] = []
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i])
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const item = line.match(/^\s*[-*+]\s+(.*)$/)
    if (heading) {
      flush()
      // Release notes sit under the release's own title, so every heading is a small one.
      blocks.push(<h4 key={blocks.length}>{inline(heading[1])}</h4>)
    } else if (item) {
      if (paragraph.length) flush()
      items.push(item[1])
    } else if (!line.trim()) {
      flush()
    } else if (items.length && /^\s+\S/.test(line)) {
      // An indented line continues the list item above it.
      items[items.length - 1] += ` ${line.trim()}`
    } else {
      if (items.length) flush()
      paragraph.push(line.trim())
    }
  }
  flush()
  return <div className="md">{blocks}</div>
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s<>)]+[^\s<>).,;:!?])/g

/** GitHub writes pull requests and comparisons as full URLs. Show them the way GitHub does. */
function linkLabel(url: string) {
  const pull = url.match(/github\.com\/[^/]+\/[^/]+\/(?:pull|issues)\/(\d+)/)
  if (pull) return `#${pull[1]}`
  const compare = url.match(/github\.com\/[^/]+\/[^/]+\/(?:compare|commits)\/(.+)$/)
  if (compare) return compare[1]
  return url.replace(/^https?:\/\//, '')
}

const safe = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined)

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push(text.slice(last, match.index))
    const [token, code, bold, link, url] = match
    const key = out.length
    if (code) out.push(<code key={key}>{code.slice(1, -1)}</code>)
    else if (bold) out.push(<strong key={key}>{bold.slice(2, -2)}</strong>)
    else if (link) {
      const [, label, href] = link.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!
      out.push(safe(href) ? <a key={key} href={href}>{label}</a> : label)
    } else if (url) {
      out.push(
        <a key={key} href={url}>
          {linkLabel(url)}
        </a>,
      )
    }
    last = match.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
