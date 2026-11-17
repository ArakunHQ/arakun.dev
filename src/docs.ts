// biome-ignore lint/correctness/noUndeclaredDependencies: a tsconfig path to the code fumadocs-mdx writes into .source, not a package.
import { docs as collection } from 'collections/server'
import { loader } from 'fumadocs-core/source'

/**
 * The docs, written from the app's README (github.com/ArakunHQ/arakun). Each page is
 * an MDX file in content/docs; content/docs/meta.json sets the order and the groups.
 * That order is the order of the index, the side list and the previous/next links.
 * To add a page, add its file and put its name in meta.json.
 */
export const source = loader({ baseUrl: '/docs', source: collection.toFumadocsSource() })

export interface Doc {
  group: string
  slug: string
  summary: string
  title: string
}

/** Every page in meta.json order, each under the last `---Group---` before it. */
export const docs: Doc[] = []
let group = ''
for (const node of source.getPageTree().children) {
  if (node.type === 'separator') {
    group = String(node.name ?? '')
  }
  if (node.type !== 'page') {
    continue
  }
  const page = source.getNodePage(node)
  if (!page) {
    continue
  }
  docs.push({
    slug: page.slugs.join('/'),
    group,
    title: page.data.title,
    summary: page.data.description,
  })
}

// A page left out of meta.json would be reachable but listed nowhere.
const missing = source
  .getPages()
  .filter((page) => !docs.some((doc) => doc.slug === page.slugs.join('/')))
if (missing.length > 0) {
  throw new Error(
    `Add these docs to content/docs/meta.json: ${missing.map((page) => page.slugs.join('/')).join(', ')}`
  )
}

export const groups = [...new Set(docs.map((doc) => doc.group))].map((title) => ({
  title,
  docs: docs.filter((doc) => doc.group === title),
}))

export const groupSlug = (title: string) => title.toLowerCase().replaceAll(' ', '-')

type Body = Awaited<ReturnType<ReturnType<typeof source.getPages>[number]['data']['load']>>
const bodies = new Map<string, Promise<Body>>()

/**
 * The compiled page. Each page is its own chunk, fetched on first use. The promise is
 * kept, so the route loader can wait for it and the page can read it with use().
 */
export function loadBody(slug: string): Promise<Body> {
  let body = bodies.get(slug)
  if (!body) {
    const page = source.getPage(slug.split('/'))
    if (!page) {
      throw new Error(`No doc named ${slug}`)
    }
    // A failed load is forgotten, so the next visit tries again.
    body = page.data.load().catch((error: unknown) => {
      bodies.delete(slug)
      throw error
    })
    bodies.set(slug, body)
  }
  return body
}
