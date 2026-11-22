import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import mdx from '@mdx-js/rollup'
import type { Heading, Nodes, Root, RootContent } from 'mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown } from 'mdast-util-to-markdown'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Plugin } from 'vite'
import { parse as parseYaml } from 'yaml'
import { authors, categories, slugify } from '../src/blog-data'
import { site } from '../src/site'
import { artNames } from './og-art'

/**
 * The blog's build step. Posts are MDX files in content/blog/<slug>.mdx:
 *
 * - @mdx-js/rollup compiles each one into a React component (the article body).
 * - virtual:blog/posts is the list of posts: frontmatter, reading time and the
 *   table of contents. It holds no body text, so the overview stays small.
 * - virtual:blog/markdown is each post as plain Markdown, served to agents.
 *
 * Both virtual modules are built here, in Node, so the Worker never parses MDX.
 */

export const CONTENT_DIR = 'content/blog'
const POSTS_ID = 'virtual:blog/posts'
const MARKDOWN_ID = 'virtual:blog/markdown'
const BODIES_ID = 'virtual:blog/bodies'
const VIRTUAL_IDS = [POSTS_ID, MARKDOWN_ID, BODIES_ID]
const resolved = (id: string) => `\0${id}`

const WORDS_PER_MINUTE = 220
const DATE = /^\d{4}-\d{2}-\d{2}$/u
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const WORD = /\S+/gu
// `{/* a comment */}`: the only expression a post may hold, since agents get no output for it.
const COMMENT = /^\s*\/\*[\s\S]*\*\/\s*$/u

interface Frontmatter {
  authors: string[]
  cardTitle?: string
  categories: string[]
  cover?: string
  description: string
  draft?: boolean
  featured?: boolean
  published: string
  title: string
  updated?: string
}

/** Gives every h2 and h3 an id, numbered when two headings share a text, so the contents can link to them. */
function remarkHeadingIds() {
  return (tree: Root) => {
    const seen = new Map<string, number>()
    visit(tree, (node) => {
      if (node.type !== 'heading' || node.depth < 2 || node.depth > 3) {
        return
      }
      const base = slugify(textOf(node)) || 'section'
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      const id = count ? `${base}-${count + 1}` : base
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
    })
  }
}

export const remarkPlugins = [remarkFrontmatter, remarkGfm, remarkHeadingIds]

function visit(node: Nodes, fn: (node: Nodes) => void) {
  fn(node)
  if ('children' in node) {
    for (const child of node.children) {
      visit(child, fn)
    }
  }
}

function textOf(node: Nodes): string {
  if ('value' in node && (node.type === 'text' || node.type === 'inlineCode')) {
    return node.value
  }
  return 'children' in node ? node.children.map((child) => textOf(child as Nodes)).join('') : ''
}

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter).use(remarkGfm)

// ---- Components as Markdown ----

type Attrs = Record<string, unknown>
type JsxNode = Extract<Nodes, { type: 'mdxJsxFlowElement' | 'mdxJsxTextElement' }>

function attributes(node: JsxNode, file: string): Attrs {
  const out: Attrs = {}
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') {
      throw new Error(`${file}: spread attributes are not supported on <${node.name}>`)
    }
    if (attr.value === null || attr.value === undefined) {
      out[attr.name] = true
    } else if (typeof attr.value === 'string') {
      out[attr.name] = attr.value
    } else {
      // Attribute values are literals the post's author wrote, run here at build time.
      out[attr.name] = new Function(`return (${attr.value.value})`)()
    }
  }
  return out
}

interface FlowStep {
  label: string
  note?: string
}

interface LayerRow {
  items: string[]
  label: string
}

interface ChartRow {
  label: string
  note?: string
  valueLabel: string
}

const md = (nodes: RootContent[]) =>
  toMarkdown(
    { type: 'root', children: nodes },
    { bullet: '-', extensions: [gfmToMarkdown()] }
  ).trim()
const raw = (value: string): RootContent => ({ type: 'html', value })

/** Each component the blog offers (src/components/blog-mdx.tsx), written as plain Markdown for agents. */
const asMarkdown: Record<string, (attrs: Attrs, children: string) => string> = {
  BarChart: (a, _children) =>
    [
      `**${a.title}**${a.subtitle ? ` (${a.subtitle})` : ''}`,
      '',
      ...(a.rows as ChartRow[]).map(
        (row) => `- ${row.label}: ${row.valueLabel}${row.note ? ` (${row.note})` : ''}`
      ),
    ].join('\n'),
  Callout: (a, children) =>
    `> **${a.title ?? (a.tone === 'warning' ? 'Warning' : 'Note')}:** ${children.replaceAll('\n', '\n> ')}`,
  DataTable: (_a, children) => children,
  Figure: (a) => `![${a.alt}](${a.src})${a.caption ? `\n\n*${a.caption}*` : ''}`,
  Flow: (a) =>
    [
      `**${a.title}**${a.caption ? ` (${a.caption})` : ''}`,
      '',
      ...(a.steps as FlowStep[]).map(
        (step, index) => `${index + 1}. ${step.label}${step.note ? `: ${step.note}` : ''}`
      ),
    ].join('\n'),
  Layers: (a) =>
    [
      `**${a.title}**${a.caption ? ` (${a.caption})` : ''}`,
      '',
      ...(a.rows as LayerRow[]).map((row) => `- ${row.label}: ${row.items.join(', ')}`),
    ].join('\n'),
  Release: (a) => `[${site.name} ${a.version}](${site.releasesUrl}/tag/${a.version})`,
  Stat: (a) => `- **${a.value}** ${a.label}${a.note ? ` (${a.note})` : ''}`,
  StatGrid: (_a, children) => children.replaceAll('\n\n', '\n'),
}
export const componentNames = Object.keys(asMarkdown)

/** One node as plain Markdown, or null for one agents don't need (imports, frontmatter, comments). */
function flattenNode(node: RootContent, file: string): RootContent | null {
  if (node.type === 'mdxjsEsm' || node.type === 'yaml') {
    return null
  }
  if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
    if (COMMENT.test(node.value)) {
      return null
    }
    // The agent Markdown could not show what the expression renders, so a post never uses one.
    throw new Error(
      `${file}: {${node.value}} is an expression. Write the text out, or use a blog component.`
    )
  }
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    const render = node.name ? asMarkdown[node.name] : undefined
    if (!render) {
      throw new Error(
        `${file}: <${node.name}> is not a blog component. Use one of: ${componentNames.join(', ')}`
      )
    }
    const children = md(flatten(node.children as RootContent[], file))
    return raw(render(attributes(node, file), children))
  }
  if ('children' in node) {
    return { ...node, children: flatten(node.children as RootContent[], file) } as RootContent
  }
  return node
}

/** Replaces JSX, imports and expressions with plain Markdown, depth first. */
function flatten(nodes: RootContent[], file: string): RootContent[] {
  return nodes.map((node) => flattenNode(node, file)).filter((node) => node !== null)
}

// ---- Reading the posts ----

/** A real day written as YYYY-MM-DD: 2026-02-30 fails, because it does not read back the same. */
function isDate(value: string) {
  return DATE.test(value) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)
}

/** A cover names art in vite/og-art.ts, so a typo fails the build instead of showing the raccoon. */
function checkCover(cover: string | undefined, file: string) {
  if (cover !== undefined && !artNames.includes(cover)) {
    throw new Error(
      `${file}: unknown cover "${cover}". Use one of: ${artNames.join(', ')} (vite/og-art.ts)`
    )
  }
}

function check(fm: Partial<Frontmatter>, file: string): Frontmatter {
  const fail = (message: string): never => {
    throw new Error(`${file}: ${message}`)
  }
  for (const key of ['title', 'description', 'published'] as const) {
    if (typeof fm[key] !== 'string' || !fm[key]) {
      fail(`frontmatter needs "${key}"`)
    }
  }
  for (const key of ['published', 'updated'] as const) {
    if (fm[key] !== undefined && !isDate(String(fm[key]))) {
      fail(`"${key}" must be a date written as YYYY-MM-DD`)
    }
  }
  if (!Array.isArray(fm.authors) || fm.authors.length === 0) {
    fail('frontmatter needs "authors", a list of ids from src/blog-data.ts')
  }
  for (const id of fm.authors ?? []) {
    if (!Object.hasOwn(authors, id)) {
      fail(`unknown author "${id}". Add it to authors in src/blog-data.ts`)
    }
  }
  if (!Array.isArray(fm.categories) || fm.categories.length === 0) {
    fail('frontmatter needs "categories", a list of ids from src/blog-data.ts')
  }
  for (const id of fm.categories ?? []) {
    if (!Object.hasOwn(categories, id)) {
      fail(`unknown category "${id}". Add it to categories in src/blog-data.ts`)
    }
  }
  checkCover(fm.cover, file)
  return fm as Frontmatter
}

async function readPost(root: string, name: string) {
  const slug = name.slice(0, -'.mdx'.length)
  const file = `${CONTENT_DIR}/${name}`
  if (!SLUG.test(slug)) {
    throw new Error(`${file}: the file name is the URL, so use lower case words joined by "-"`)
  }
  const source = await readFile(join(root, file), 'utf8')
  const tree = parser.parse(source)
  remarkHeadingIds()(tree)

  const yaml = tree.children.find((node) => node.type === 'yaml')
  // The core schema keeps dates as text, the way the site compares and prints them.
  const fm = check((yaml ? parseYaml(yaml.value, { schema: 'core' }) : {}) ?? {}, file)

  const toc = tree.children
    .filter((node): node is Heading => node.type === 'heading' && node.depth === 2)
    .map((node) => ({ id: String(node.data?.hProperties?.id), text: textOf(node) }))

  const body = md(flatten(tree.children, file))
  const words = body.match(WORD)?.length ?? 0
  return {
    meta: {
      slug,
      title: fm.title,
      cardTitle: fm.cardTitle,
      cover: fm.cover,
      description: fm.description,
      published: fm.published,
      updated: fm.updated ?? fm.published,
      authors: fm.authors,
      categories: fm.categories,
      featured: fm.featured === true,
      draft: fm.draft === true,
      readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      toc,
    },
    body,
  }
}

async function readPosts(root: string, includeDrafts: boolean) {
  const names = (await readdir(join(root, CONTENT_DIR))).filter((name) => name.endsWith('.mdx'))
  const posts = await Promise.all(names.map((name) => readPost(root, name)))
  return posts
    .filter((post) => includeDrafts || !post.meta.draft)
    .sort((a, b) => b.meta.published.localeCompare(a.meta.published))
}

/**
 * The virtual modules. The og card renderer uses this part alone, without MDX, and
 * passes `drafts` itself, since its own Vite runner always looks like a dev server.
 */
export function blogContent({ drafts }: { drafts?: boolean } = {}): Plugin {
  let root = process.cwd()
  let includeDrafts = drafts ?? true
  return {
    name: 'arakun:blog-content',
    configResolved(config) {
      ;({ root } = config)
      // Drafts show while writing, never in a build that could ship.
      includeDrafts = drafts ?? config.command === 'serve'
    },
    resolveId(id) {
      return VIRTUAL_IDS.includes(id) ? resolved(id) : undefined
    },
    async load(id) {
      if (!VIRTUAL_IDS.some((name) => id === resolved(name))) {
        return
      }
      const posts = await readPosts(root, includeDrafts)
      for (const name of await readdir(join(root, CONTENT_DIR))) {
        this.addWatchFile(join(root, CONTENT_DIR, name))
      }
      if (id === resolved(BODIES_ID)) {
        // One chunk per post, and none for a draft in a build, so its text never ships.
        const entries = posts.map(
          ({ meta }) =>
            `${JSON.stringify(meta.slug)}: () => import(${JSON.stringify(`/${CONTENT_DIR}/${meta.slug}.mdx`)})`
        )
        return `export const bodies = {${entries.join(',\n')}}`
      }
      if (id === resolved(POSTS_ID)) {
        return `export const posts = ${JSON.stringify(posts.map((post) => post.meta))}`
      }
      return `export const markdown = ${JSON.stringify(Object.fromEntries(posts.map((post) => [post.meta.slug, post.body])))}`
    },
    configureServer(server) {
      const dir = join(root, CONTENT_DIR)
      // A post added, changed or removed: rebuild the lists that come from the posts.
      const refresh = (file: string) => {
        if (!(file.startsWith(dir) && file.endsWith('.mdx'))) {
          return
        }
        for (const environment of Object.values(server.environments)) {
          for (const id of VIRTUAL_IDS) {
            const mod = environment.moduleGraph.getModuleById(resolved(id))
            if (mod) {
              environment.moduleGraph.invalidateModule(mod)
            }
          }
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(dir)
      server.watcher.on('add', refresh)
      server.watcher.on('change', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

/** Everything the site needs for the blog: the MDX compiler and the virtual modules. */
export function blog(): Plugin[] {
  return [
    {
      enforce: 'pre',
      ...mdx({ remarkPlugins }),
    } as Plugin,
    blogContent(),
  ]
}
