import { createFileRoute } from '@tanstack/react-router'
import { INSTALLERS, head, installer } from '#/installer'

// `irm https://arakun.dev/install.ps1 | iex` (see src/installer.ts).
export const Route = createFileRoute('/install.ps1')({
  server: {
    handlers: {
      GET: () => installer(INSTALLERS.ps1),
      HEAD: () => head(INSTALLERS.ps1),
    },
  },
})
