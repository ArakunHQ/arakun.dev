import { createFileRoute } from '@tanstack/react-router'
import { head, INSTALLERS, installer } from '#/installer'

// `curl -fsSL https://arakun.dev/install-server | sh`: only arakun-server (see src/installer.ts).
export const Route = createFileRoute('/install-server')({
  server: {
    handlers: {
      GET: () => installer(INSTALLERS.server),
      HEAD: () => head(INSTALLERS.server),
    },
  },
})
