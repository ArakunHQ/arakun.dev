import { createFileRoute } from '@tanstack/react-router'
import { INSTALLERS, head, installer } from '#/installer'

// `curl -fsSL https://arakun.dev/install | sh` (see src/installer.ts).
export const Route = createFileRoute('/install')({
  server: {
    handlers: {
      GET: () => installer(INSTALLERS.sh),
      HEAD: () => head(INSTALLERS.sh),
    },
  },
})
