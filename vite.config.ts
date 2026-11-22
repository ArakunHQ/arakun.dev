import { execFileSync } from 'node:child_process'
import { cloudflare } from '@cloudflare/vite-plugin'
import { deployWatch } from '@rivi-software/deploy-watch/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { blog } from './vite/blog.ts'
import { ogCards } from './vite/og.ts'

// deploy-watch reads the commit from these CI variables itself.
const CI_COMMIT_VARS = [
  'WORKERS_CI_COMMIT_SHA',
  'CF_PAGES_COMMIT_SHA',
  'GITHUB_SHA',
  'CI_COMMIT_SHA',
]

// `pnpm run deploy` runs by hand, where no CI variable names the commit. Without an id the
// watch stays off, so name the build after the commit. A build of uncommitted changes
// gets a time on the end, so it never shares an id with another build.
function localBuildId(): string | undefined {
  if (CI_COMMIT_VARS.some((name) => process.env[name])) {
    return undefined
  }
  // One build loads this config more than once. Keep the first id, or the page and
  // /build.json would disagree and every tab would think a new build is live.
  if (process.env.ARAKUN_BUILD_ID) {
    return process.env.ARAKUN_BUILD_ID
  }
  try {
    const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim()
    const commit = git('rev-parse', 'HEAD')
    const id = git('status', '--porcelain') ? `${commit}-${Date.now()}` : commit
    process.env.ARAKUN_BUILD_ID = id
    return id
  } catch {
    return undefined
  }
}

export default defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({
      viteEnvironment: { name: 'ssr' },
    }),
    blog(),
    tanstackStart(),
    viteReact(),
    ogCards(),
    deployWatch({ buildId: command === 'build' ? localBuildId() : undefined }),
  ],
}))
