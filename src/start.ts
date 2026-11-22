import {
  posthogFunctionErrors,
  posthogRequestErrors,
} from '@rivi-software/posthog-tanstack-start/start'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { hasMarkdownPage, pageMarkdown, prefersMarkdown } from '#/markdown'

function hasVaryToken(header: string | null, token: string): boolean {
  if (!header) {
    return false
  }
  const target = token.toLowerCase()
  return header.split(',').some((value) => value.trim().toLowerCase() === target)
}

// Serve Markdown directly when an agent sends `Accept: text/markdown` so TanStack
// Start does not reject it with HTTP 406.
const markdownForAgents = createMiddleware().server(async ({ next, pathname, request }) => {
  const isPage =
    (request.method === 'GET' || request.method === 'HEAD') && hasMarkdownPage(pathname)
  if (isPage && prefersMarkdown(request.headers.get('accept'))) {
    const body = await pageMarkdown(pathname)
    if (body !== null) {
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: {
          'cache-control':
            pathname === '/changelog' || pathname === '/changelog/'
              ? 'public, max-age=300'
              : 'public, max-age=3600',
          'content-type': 'text/markdown; charset=utf-8',
          vary: 'Accept',
        },
      })
    }
  }
  const result = await next()
  if (isPage && !hasVaryToken(result.response.headers.get('vary'), 'accept')) {
    result.response.headers.append('vary', 'Accept')
  }
  return result
})

// Server functions and server routes turn a thrown error into a response before the
// Worker sees it, so these report it to PostHog. No cookie is set on the server.
export const startInstance = createStart(() => ({
  requestMiddleware: [posthogRequestErrors, markdownForAgents],
  functionMiddleware: [posthogFunctionErrors],
}))
