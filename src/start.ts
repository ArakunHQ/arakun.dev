import { createStart } from '@tanstack/react-start'
import { posthogFunctionErrors, posthogRequestErrors } from '@rivi-software/posthog-tanstack-start/start'

// Server functions and server routes turn a thrown error into a response before the
// Worker sees it, so these report it to PostHog. No cookie is set on the server.
export const startInstance = createStart(() => ({
  requestMiddleware: [posthogRequestErrors],
  functionMiddleware: [posthogFunctionErrors],
}))
