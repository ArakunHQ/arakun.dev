import { ErrorComponent, createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { followNewBuild, recoverFromChunkError, startDeployWatch } from '@rivi-software/deploy-watch'
import { useChunkErrorRecovery } from '@rivi-software/deploy-watch/react'
import { captureClientException } from '@rivi-software/posthog-tanstack-start/browser'
import { getPostHogBrowserConfig } from '@rivi-software/posthog-tanstack-start/start'
import { setupAnalytics } from './analytics'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultErrorComponent: RouteError,
    // PostHog's settings are Worker vars: read during SSR, handed to the browser here.
    dehydrate: () => ({ posthog: getPostHogBrowserConfig() }),
    hydrate: ({ posthog }) => setupAnalytics(posthog),
    // A missing chunk that reloads the page is not worth a report. Without consent, nothing is sent.
    defaultOnCatch: (error) => {
      void recoverFromChunkError(error).then((reloading) => reloading || captureClientException(error))
    },
  })
  // A tab left open across a deploy asks for page chunks the new build no longer has.
  // These move it onto the new build at its next page change. On the server they do nothing.
  startDeployWatch()
  followNewBuild(router)
  return router
}

// A page chunk that failed to load after a deploy reloads the page instead of showing an error.
function RouteError(props: ErrorComponentProps) {
  if (useChunkErrorRecovery(props.error)) return null
  return <ErrorComponent {...props} />
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
