/**
 * Cover art for blog posts. A post picks one with `cover: <name>` in its
 * frontmatter, and vite/og.ts draws it on the right of the post's card in
 * place of the large raccoon. The card is the post's cover on the blog and its
 * link preview, so the art is always on the dark card.
 */

export interface Node {
  props: Record<string, unknown>
  type: string
}

export const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  props: Record<string, unknown> = {}
): Node => ({
  type,
  props: { style, children, ...props },
})

// Brandbook tokens, dark only: link previews can't follow light or dark mode.
export const color = {
  ground: '#0b0b0b',
  raised: '#161616',
  line: '#1f1f1f',
  lineStrong: '#2b2b2b',
  text: '#f2f2f2',
  muted: '#a3a3a3',
  faint: '#737373',
  amber: '#ffb547',
}

export interface ArtAssets {
  /** The bare raccoon as a data URL. Its viewBox is 184 × 144. */
  raccoon: string
}

function chip(text: string, accent: boolean) {
  return el(
    'div',
    {
      display: 'flex',
      padding: '6px 12px',
      fontFamily: 'Geist Mono',
      fontSize: 17,
      color: accent ? color.amber : color.text,
      background: accent ? 'rgba(255, 181, 71, 0.08)' : color.raised,
      border: `1px solid ${accent ? 'rgba(255, 181, 71, 0.35)' : color.lineStrong}`,
      borderRadius: 6,
    },
    text
  )
}

function band(label: string, items: string[], accent = false) {
  return el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '18px 22px',
      background: color.ground,
      border: `${accent ? 2 : 1}px solid ${accent ? color.amber : color.lineStrong}`,
      borderRadius: 14,
      boxShadow: accent ? '0 0 48px rgba(255, 181, 71, 0.18)' : 'none',
    },
    [
      el(
        'div',
        {
          fontFamily: 'Geist Mono',
          fontSize: 15,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: accent ? color.amber : color.faint,
        },
        label
      ),
      el(
        'div',
        { display: 'flex', flexWrap: 'wrap', gap: 8 },
        items.map((item) => chip(item, accent))
      ),
    ]
  )
}

/** Dots every 28 px that fade out toward the left edge, as an SVG data URL. */
function dotGrid(width: number, height: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="d" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1.5" fill="${color.lineStrong}"/></pattern><linearGradient id="f"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.35" stop-color="#fff"/></linearGradient><mask id="m"><rect width="100%" height="100%" fill="url(#f)"/></mask></defs><rect width="100%" height="100%" fill="url(#d)" mask="url(#m)"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/** A short amber link between two bands, with a dot at each end. */
function link() {
  const dot = el('div', {
    width: 8,
    height: 8,
    borderRadius: 4,
    background: color.amber,
  })
  return el('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }, [
    dot,
    el('div', { width: 2, flexGrow: 1, background: color.amber, opacity: 0.6 }),
    dot,
  ])
}

/** "How Arakun works": the app's three layers, with the raccoon sitting on top of the stack. */
function architecture(assets: ArtAssets): Node {
  const left = 640
  const width = 500
  return el(
    'div',
    { position: 'absolute', left: 0, top: 0, width: 1200, height: 630, display: 'flex' },
    [
      // A faint dot grid behind the stack, so the right half reads as a drawing board.
      // An SVG pattern, since satori does not repeat CSS backgrounds.
      el('img', { position: 'absolute', left: 600, top: 0, width: 600, height: 630 }, undefined, {
        src: dotGrid(600, 630),
        width: 600,
        height: 630,
      }),
      el(
        'img',
        { position: 'absolute', left: left + width - 190, top: 38, width: 166, height: 130 },
        undefined,
        { src: assets.raccoon, width: 166, height: 130 }
      ),
      el(
        'div',
        {
          position: 'absolute',
          left,
          top: 150,
          width,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        },
        [
          band('Window', ['rail', 'tabs', 'sessions', 'dock']),
          link(),
          band('arakun-core', ['agent', 'terminal', 'git', 'browser'], true),
          link(),
          band('Child processes', ['agents', 'shells', 'git', 'Chromium']),
        ]
      ),
    ]
  )
}

export const arts: Record<string, (assets: ArtAssets) => Node> = { architecture }
export const artNames = Object.keys(arts)
