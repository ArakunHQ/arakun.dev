import type { WorkerBundleCheckOptions } from '@rivi-software/workers-bundle-check'

// Runs after `vite build` (see the build script). It fails on source maps the assets
// would serve and on values shaped like secrets in the Worker or the assets.
//
// No `forbidden` rules: a module rule needs a source map for every Worker file, and
// TanStack Start writes a few virtual chunks (the server function resolver, the
// manifest, the runtime) without one.
export default {
  serverDir: 'dist/server',
  assetsDir: 'dist/client',
} satisfies WorkerBundleCheckOptions
