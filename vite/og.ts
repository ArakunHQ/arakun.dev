import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import type { Plugin } from 'vite'
import { runnerImport } from 'vite'
import type * as Cards from '../src/og-cards'
import { blogContent } from './blog'

type OgCard = Cards.OgCard

/**
 * Renders a link preview card for every page in src/og-cards.ts: emitted into
 * the client build at /og/<page>.png, served on request in dev. The layout is
 * the Brandbook's social card (Doop canvas pr25gtHBtk, "OG card · dark"):
 * black ground, the bare raccoon cropped at the right edge, a mono label, the
 * title and one line.
 */

const W = 1200
const H = 630

// Brandbook tokens. Cards are always the dark card: link previews can't follow light or dark mode.
const color = { ground: '#0b0b0b', text: '#f2f2f2', muted: '#a3a3a3', faint: '#737373' }

const require = createRequire(import.meta.url)
const fontFile = (pkg: string, file: string) =>
  readFile(join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file))

interface Assets {
  fonts: Parameters<typeof satori>[1]['fonts']
  raccoon: string
}

async function loadAssets(root: string): Promise<Assets> {
  // Satori reads static TTF/WOFF faces, not the variable WOFF2 the site uses.
  const [regular, semibold, mono, raccoon] = await Promise.all([
    fontFile('@fontsource/geist', 'geist-latin-400-normal.woff'),
    fontFile('@fontsource/geist', 'geist-latin-600-normal.woff'),
    fontFile('@fontsource/geist-mono', 'geist-mono-latin-400-normal.woff'),
    readFile(join(root, 'assets/brand/raccoon-paper.svg')),
  ])
  return {
    fonts: [
      { name: 'Geist', data: regular, weight: 400, style: 'normal' },
      { name: 'Geist', data: semibold, weight: 600, style: 'normal' },
      { name: 'Geist Mono', data: mono, weight: 400, style: 'normal' },
    ],
    raccoon: `data:image/svg+xml;base64,${raccoon.toString('base64')}`,
  }
}

/** The name alone gets the full 96 px; page titles step down so they fit beside the raccoon in two lines. */
function titleSize(title: string) {
  if (title.length <= 12) {
    return 96
  }
  return title.length <= 16 ? 76 : 60
}

interface Node {
  props: Record<string, unknown>
  type: string
}
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  props: Record<string, unknown> = {}
): Node => ({
  type,
  props: { style, children, ...props },
})

function layout(card: OgCard, assets: Assets): Node {
  const size = titleSize(card.title)
  return el(
    'div',
    {
      width: W,
      height: H,
      display: 'flex',
      position: 'relative',
      background: color.ground,
      fontFamily: 'Geist',
    },
    [
      // The mark's viewBox is 184 × 144.
      el(
        'img',
        { position: 'absolute', right: -110, top: 104, width: 670, height: 524 },
        undefined,
        {
          src: assets.raccoon,
          width: 670,
          height: 524,
        }
      ),
      el(
        'div',
        {
          position: 'absolute',
          left: 72,
          top: 64,
          fontFamily: 'Geist Mono',
          fontSize: 20,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: color.faint,
        },
        card.label
      ),
      el(
        'div',
        {
          position: 'absolute',
          left: 72,
          bottom: 72,
          width: 548,
          display: 'flex',
          flexDirection: 'column',
          gap: 23,
        },
        [
          el(
            'div',
            {
              fontSize: size,
              fontWeight: 600,
              letterSpacing: -0.04 * size,
              lineHeight: size > 80 ? 0.95 : 1.02,
              color: color.text,
            },
            card.title
          ),
          el(
            'div',
            {
              fontSize: 28,
              lineHeight: 1.3,
              letterSpacing: -0.28,
              color: color.muted,
              lineClamp: 3,
            },
            card.line
          ),
        ]
      ),
    ]
  )
}

async function render(card: OgCard, assets: Assets) {
  // satori's types want a ReactNode; a plain { type, props } tree is what it walks.
  const svg = await satori(layout(card, assets) as never, {
    width: W,
    height: H,
    fonts: assets.fonts,
  })
  return new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: false } })
    .render()
    .asPng()
}

export function ogCards(): Plugin {
  let root = process.cwd()
  let assets: Promise<Assets> | undefined
  // Loaded once, on first use.
  const getAssets = () => {
    assets ??= loadAssets(root)
    return assets
  }
  // Loaded through Vite so the #/ imports resolve; fresh on every call so dev shows edits.
  // A build leaves drafts out of the cards, as it leaves them out of the site.
  let command: 'build' | 'serve' = 'serve'
  const loadCards = async () => {
    const { module } = await runnerImport<typeof Cards>(join(root, 'src/og-cards.ts'), {
      configFile: false,
      root,
      logLevel: 'error',
      resolve: { tsconfigPaths: true },
      // The cards list blog posts, which come from content/blog through this plugin.
      plugins: [blogContent({ drafts: command === 'serve' })],
    })
    return module.ogCards.map((card) => ({ card, file: module.ogImagePath(card.path) }))
  }

  return {
    name: 'arakun:og-cards',
    configResolved({ root: configRoot, command: configCommand }) {
      root = configRoot
      command = configCommand
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith('/og/')) {
          return next()
        }
        try {
          const match = (await loadCards()).find((c) => c.file === url)
          if (!match) {
            return next()
          }
          const png = await render(match.card, await getAssets())
          res.setHeader('Content-Type', 'image/png')
          res.setHeader('Cache-Control', 'no-store')
          res.end(png)
        } catch (error) {
          next(error)
        }
      })
    },
    async generateBundle() {
      if (this.environment.name !== 'client') {
        return
      }
      const loaded = await getAssets()
      const cards = await loadCards()
      const pngs = await Promise.all(cards.map(({ card }) => render(card, loaded)))
      for (const [i, { file }] of cards.entries()) {
        this.emitFile({ type: 'asset', fileName: file.slice(1), source: pngs[i] })
      }
    },
  }
}
