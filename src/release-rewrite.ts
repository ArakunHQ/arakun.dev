import type { ReleaseNote } from '#/release-notes'
import { notes } from '#/release-notes'

/**
 * Turns a release's notes on GitHub into a changelog entry in the site's own
 * words: a title and a short list of changes per area, like the hand-written
 * entries in `release-notes.ts`. Workers AI writes it; `releases.ts` decides
 * when, and keeps the answer.
 *
 * Everything here is plain functions, so it runs the same outside a Worker.
 */

/**
 * Bump when the prompt or the model changes. Entries written before then are
 * written again, once, in the new way.
 */
export const REWRITE_VERSION = 1

/**
 * Z.ai's GLM-5.3 Flash: of the Workers AI models we tried on v0.2.1's notes, it came
 * closest to the hand-written entry, in about five seconds. It needs the Workers
 * Paid plan.
 */
export const MODEL = '@cf/zai-org/glm-5.3-flash' satisfies keyof AiModels

/** A line of GitHub's generated notes: `* feat(x): do y by @someone in https://github.com/o/r/pull/1`. */
const generated =
  /^\s*[*-]\s+(?<title>.+?)\s+by\s+@\S+\s+in\s+https:\/\/github\.com\/\S+\/pull\/\d+\s*$/u

/** Conventional Commit types that change nothing a user of the app sees. A revert may, so it stays. */
const unseen = /^(?:build|ci|test|tests|chore|docs|style|refactor)(?:\(.*?\))?!?:/iu

/**
 * What GitHub adds around the generated list: its two headings, contributors and the
 * compare link. Other headings stay, since a person may have written one, such as a
 * warning to read before upgrading.
 */
const boilerplate = [
  /^\s*#+\s*(?:What['’]s Changed|New Contributors)\s*$/iu,
  /made their first contribution/iu,
  /^\s*\*\*Full Changelog\*\*/iu,
]

/** The longest notes we send. GitHub's generated list for a big release fits easily. */
const MAX_INPUT = 12_000

/** A code fence around the model's JSON, which some models add. */
const fence = /^\s*```(?:json)?\s*|\s*```\s*$/gu
const endPeriod = /\.$/u

/** Drops HTML comments, such as the one GitHub puts above its generated notes, even across lines. */
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
    // An unclosed comment hides the rest, as it would on GitHub.
    if (end < 0) {
      return kept
    }
    at = end + 3
  }
}

/**
 * What the model reads. For GitHub's generated list: only the pull requests a
 * user could notice, without authors and links, after any text a person wrote
 * around it, such as a warning. Notes written by a person go through as they are.
 */
export function changesFrom(body: string): string {
  const lines = withoutComments(body).split('\n')
  const prs = lines
    .map((line) => generated.exec(line)?.groups?.title)
    .filter((title) => title !== undefined)
  if (prs.length === 0) {
    return lines.join('\n').trim().slice(0, MAX_INPUT)
  }
  const written = lines
    .filter(
      (line) =>
        line.trim() && !generated.test(line) && !boilerplate.some((pattern) => pattern.test(line))
    )
    .join('\n')
    .trim()
  const visible = prs
    .filter((title) => !unseen.test(title))
    .map((title) => `- ${title}`)
    .join('\n')
  return [written, visible].filter(Boolean).join('\n\n').slice(0, MAX_INPUT)
}

// The first release's hand-written entry shows the tone. Its changes are old news,
// so the model cannot pass them off as part of a new release.
const first = notes['v0.1.0']
const example = {
  title: first.title,
  changes: first.changes.map(([area, change]) => ({ area, change })),
}

const instructions = `You write the changelog on the website of Arakun, a native desktop app that runs coding agents side by side.

You get the changes in one release, as pull request titles or as notes a developer wrote. Write the release's changelog entry for people who use the app, not for its developers.

Rules:
- Group the changes into at most 8 areas. Name each area with one or two words, such as Agents, Servers, GitHub, Look, App, Usage, Privacy, Windows, macOS, Linux. Put small fixes together in one area called Fixes, as the last one.
- For each area, write one or two short, plain sentences. Say what a user can do now or what works better. Present tense.
- Leave out what a user would not notice: tests, CI, builds, refactors, dependency updates, formatting, code review follow-ups.
- No pull request numbers, names, links, markdown or emoji. No marketing words such as "exciting", "seamless" or "powerful". Do not invent anything the changes do not say.
- The title names the two or three biggest changes in under 60 characters, in sentence case, without the version and without a period.

An entry for an earlier release, written by hand. Match its tone and length, not its content:
${JSON.stringify(example, null, 2)}`

/** The JSON shape the model must answer in. */
export const schema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { area: { type: 'string' }, change: { type: 'string' } },
        required: ['area', 'change'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'changes'],
  additionalProperties: false,
}

export function prompt(tag: string, changes: string): AiModels[typeof MODEL]['inputs'] {
  return {
    messages: [
      { role: 'system', content: instructions },
      { role: 'user', content: `The changes in ${tag}:\n\n${changes}` },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'changelog_entry', schema, strict: true },
    },
    temperature: 0.2,
    // The model thinks before it answers, and the thinking counts against this.
    max_tokens: 4096,
    reasoning_effort: 'low',
  }
}

/** A changelog entry: what `release-notes.ts` holds per release, without the date. */
export type Entry = Omit<ReleaseNote, 'publishedAt'>

const plain = (text: unknown, max: number) =>
  typeof text === 'string'
    ? text
        .replace(/[*_`#]/gu, '')
        .replace(/\s+/gu, ' ')
        .trim()
        .slice(0, max)
    : ''

/**
 * Checks the model's answer and returns the entry, or null if it is not one we
 * would show. The page renders it as text, never as HTML.
 */
export function entryFrom(result: unknown): Entry | null {
  // Older models answer in `response`, newer ones like an OpenAI chat completion.
  const answer = result as {
    response?: unknown
    choices?: { message?: { content?: unknown } }[]
  } | null
  let value = answer?.choices?.[0]?.message?.content ?? answer?.response
  // The answer is the object itself or JSON text, sometimes in a code fence.
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value.replace(fence, ''))
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object') {
    return null
  }
  const { title, changes } = value as { title?: unknown; changes?: unknown }
  const cleanTitle = plain(title, 80).replace(endPeriod, '')
  if (!(cleanTitle && Array.isArray(changes))) {
    return null
  }
  const cleanChanges = changes
    .map((item): [string, string] => [plain(item?.area, 20), plain(item?.change, 280)])
    .filter(([area, change]) => area && change)
    .slice(0, 10)
  if (cleanChanges.length === 0) {
    return null
  }
  return { title: cleanTitle, changes: cleanChanges }
}
