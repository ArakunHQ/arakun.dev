import type { ReleaseNote } from '#/release-notes'

/**
 * Reads the changelog entry at the top of a release's notes on GitHub.
 *
 * The version bump pull request in ArakunHQ/arakun adds `release-notes/<version>.md`,
 * and the release workflow puts it above GitHub's generated list of pull requests:
 *
 * ```md
 * ## Smoother drawing and a session tree
 *
 * - **Sessions:** Every session is in a tree in the sidebar.
 * - **Fixes:** A long subagent list scrolls.
 * ```
 *
 * A `##` title, then one `- **Area:** change` line per area. The list ends at the
 * first line that is not one of those, such as GitHub's "What's Changed".
 *
 * Plain functions, so it runs the same outside a Worker.
 */

/** A changelog entry: what `release-notes.ts` holds per release, without the date. */
export type Entry = Omit<ReleaseNote, 'publishedAt'>

const heading = /^##\s+(?<title>.+?)\s*#*\s*$/u
// `**Area:**` or `**Area**:`, so either way of writing it works.
const area = /^[-*]\s+\*\*(?<area>[^*]+?):?\*\*:?\s+(?<change>.+)$/u
/** GitHub's own heading above its generated list: no entry was written. */
const generatedHeading = /^what['’]s changed$/iu
const endPeriod = /\.$/u

/** Drops HTML comments, even across lines, as GitHub does when it shows the notes. */
function withoutComments(text: string): string {
  let kept = ''
  let at = 0
  for (;;) {
    const start = text.indexOf('<!--', at)
    if (start < 0) {
      return kept + text.slice(at)
    }
    kept += text.slice(at, start)
    const end = text.indexOf('-->', start + 4)
    if (end < 0) {
      return kept
    }
    at = end + 3
  }
}

/** The page renders entries as text; this keeps stray markdown out of them. */
const plain = (text: string, max: number) =>
  text.replace(/[*_`]/gu, '').replace(/\s+/gu, ' ').trim().slice(0, max)

/** The entry at the top of `body`, or null when the notes don't start with one. */
export function entryFrom(body: string): Entry | null {
  const lines = withoutComments(body)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const rawTitle = heading.exec(lines[0] ?? '')?.groups?.title
  if (!rawTitle || generatedHeading.test(rawTitle)) {
    return null
  }
  const changes: [string, string][] = []
  for (const line of lines.slice(1)) {
    const match = area.exec(line)?.groups
    if (!match) {
      break
    }
    const name = plain(match.area, 20)
    const change = plain(match.change, 280)
    if (name && change) {
      changes.push([name, change])
    }
  }
  const title = plain(rawTitle, 80).replace(endPeriod, '')
  return title && changes.length > 0 ? { title, changes } : null
}
