import { createFileRoute } from '@tanstack/react-router'
import { site } from '#/site'

const TRAILING_SLASHES = /\/+$/u

/**
 * The docs moved to Mintlify (docs/ in this repo). Their pages kept their slugs, so
 * /docs/install goes to docs.arakun.dev/install and old links and search results still land.
 */
function redirect({ params }: { params: { _splat?: string } }) {
  const slug = (params._splat ?? '').replace(TRAILING_SLASHES, '')
  return Response.redirect(slug ? `${site.docsUrl}/${slug}` : site.docsUrl, 301)
}

export const Route = createFileRoute('/docs/$')({
  server: { handlers: { GET: redirect, HEAD: redirect } },
})
