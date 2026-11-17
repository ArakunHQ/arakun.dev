import { site } from '../site.ts'

/**
 * Fills in `{site.version}`, `{site.installUrl}` and the other facts of src/site.ts
 * when the docs build, so no page writes a version or a URL by hand. It works in
 * prose, inline code, code blocks, link targets and JSX attributes. MDX would
 * read `{site.x}` in prose as code, and code blocks would print it as it is.
 * An unknown name fails the build rather than showing a blank.
 */

type Node = { type: string; value?: unknown; url?: string; children?: Node[]; attributes?: Node[]; data?: unknown }

const placeholder = /\{\s*site\.([\w.]+)\s*\}/g
const whole = /^\s*site\.([\w.]+)\s*$/

function lookup(path: string): string {
  let value: unknown = site
  for (const key of path.split('.')) value = (value as Record<string, unknown> | undefined)?.[key]
  if (typeof value !== 'string') throw new Error(`MDX: site.${path} is not a text value in src/site.ts`)
  return value
}

const fill = (text: string) => text.replace(placeholder, (_, path: string) => lookup(path))

function visit(node: Node) {
  if ((node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') && typeof node.value === 'string') {
    node.value = fill(node.value)
  }
  if ((node.type === 'link' || node.type === 'definition') && node.url) node.url = fill(node.url.replace(/%7B/gi, '{').replace(/%7D/gi, '}'))

  for (const attribute of node.attributes ?? []) {
    const value = attribute.value as Node | string | null | undefined
    if (typeof value === 'string') attribute.value = fill(value)
    else if (value?.type === 'mdxJsxAttributeValueExpression' && typeof value.value === 'string') {
      const match = whole.exec(value.value)
      if (match) attribute.value = lookup(match[1])
    }
  }

  node.children?.forEach((child, index, siblings) => {
    if ((child.type === 'mdxTextExpression' || child.type === 'mdxFlowExpression') && typeof child.value === 'string') {
      const match = whole.exec(child.value)
      if (match) {
        const text: Node = { type: 'text', value: lookup(match[1]) }
        siblings[index] = child.type === 'mdxFlowExpression' ? { type: 'paragraph', children: [text] } : text
        return
      }
    }
    visit(child)
  })
}

export function remarkSite() {
  return (tree: Node) => visit(tree)
}
