import { ErrorComponent, createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { followNewBuild, startDeployWatch } from '@rivi-software/deploy-watch'
import { useChunkErrorRecovery } from '@rivi-software/deploy-watch/react'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultErrorComponent: RouteError,
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
