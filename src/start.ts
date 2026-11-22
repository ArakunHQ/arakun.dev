import {
  posthogFunctionErrors,
  posthogRequestErrors,
} from '@rivi-software/posthog-tanstack-start/start'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { pageMarkdown, prefersMarkdown } from '#/markdown'

// Serve Markdown directly when an agent sends `Accept: text/markdown` so TanStack
// Start does not reject it with HTTP 406.
const markdownForAgents = createMiddleware().server(async ({ next, pathname, request }) => {
  const body = request.method === 'GET' || request.method === 'HEAD' ? pageMarkdown(pathname) : null
  if (body !== null && prefersMarkdown(request.headers.get('accept'))) {
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: {
        'cache-control': 'public, max-age=3600',
        'content-type': 'text/markdown; charset=utf-8',
        vary: 'Accept',
      },
    })
  }
  const result = await next()
  if (body !== null) {
    const vary = result.response.headers.get('vary')
    if (!vary?.toLowerCase().includes('accept')) {
      result.response.headers.append('vary', 'Accept')
    }
  }
  return result
})

// Server functions and server routes turn a thrown error into a response before the
// Worker sees it, so these report it to PostHog. No cookie is set on the server.
export const startInstance = createStart(() => ({
  requestMiddleware: [posthogRequestErrors, markdownForAgents],
  functionMiddleware: [posthogFunctionErrors],
}))
