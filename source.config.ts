import { pageSchema } from 'fumadocs-core/source/schema'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import { remarkSite } from './src/mdx/remark-site.ts'

/**
 * The docs live in content/docs as MDX, one file per page. content/docs/meta.json
 * sets the order and the groups. Every page needs a title and a description:
 * the description is the line under the title, in the index and on the link card.
 */
export const docs = defineDocs({
  dir: 'content/docs',
  docs: { async: true, schema: pageSchema.required({ description: true }) },
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkSite],
    // `tab="…"` on code blocks makes the same <Tabs items> as writing them by hand.
    remarkCodeTabOptions: { Tabs: 'Tabs' },
  },
})
