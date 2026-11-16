import { site } from '#/site'

/** Where a page's preview card is served: / is /og/home.png, /docs/install is /og/docs/install.png. */
export const ogImagePath = (path: string) => `/og/${path === '/' ? 'home' : path.slice(1)}.png`

/**
 * The og: and twitter: tags that differ per page; the root route sets the rest.
 * The card itself comes from src/og-cards.ts: give a page a card there before
 * pointing its meta at it.
 */
export function pageMeta({ path, title, description }: { path: string; title: string; description: string }) {
  const image = `${site.url}${ogImagePath(path)}`
  return [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${site.url}${path}` },
    { property: 'og:image', content: image },
    { property: 'og:image:alt', content: `${title}: ${description}` },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}
