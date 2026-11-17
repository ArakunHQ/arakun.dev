import { createFileRoute } from '@tanstack/react-router'
import { INSTALLERS, head, installer } from '#/installer'

// The same script as /install, under its file name (see src/installer.ts).
export const Route = createFileRoute('/install.sh')({
  server: {
    handlers: {
      GET: () => installer(INSTALLERS.sh),
      HEAD: () => head(INSTALLERS.sh),
    },
  },
})
